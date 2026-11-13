import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Cuenta, fecha, moneda, operable } from '../core/modelos';
import { mensajeError } from '../core/texto-error';
import { Confirmacion } from '../ui/confirmacion';
import { MENSAJES_MONTO, errorDe, validarMonto } from '../ui/validacion';

type Tipo = 'deposito' | 'retiro' | 'transferencia';

interface Comprobante {
  titulo: string;
  referencia: string;
  fecha: string;
  monto: number;
  cuentaId: number;
  filas: { etiqueta: string; valor: string }[];
}

const NOMBRES: Record<Tipo, string> = { deposito: 'Depósito', retiro: 'Retiro', transferencia: 'Transferencia' };

@Component({
  selector: 'app-operaciones',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './operaciones.html',
})
export class Operaciones {
  private readonly api = inject(Api);
  private readonly ruta = inject(ActivatedRoute);
  private readonly confirmacion = inject(Confirmacion);
  private readonly fb = inject(FormBuilder);
  readonly moneda = moneda;
  readonly nombres = NOMBRES;
  readonly tipos: Tipo[] = ['deposito', 'retiro', 'transferencia'];
  readonly cuentas = signal<Cuenta[]>([]);
  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly pestana = signal<Tipo>('deposito');
  readonly error = signal('');
  readonly comprobante = signal<Comprobante | null>(null);

  readonly deposito = this.fb.nonNullable.group({
    cuentaId: ['', Validators.required],
    monto: ['', [Validators.required, validarMonto]],
    descripcion: ['', Validators.maxLength(255)],
  });
  readonly retiro = this.fb.nonNullable.group({
    cuentaId: ['', Validators.required],
    monto: ['', [Validators.required, validarMonto]],
    descripcion: ['', Validators.maxLength(255)],
  });
  readonly transferencia = this.fb.nonNullable.group({
    cuentaOrigenId: ['', Validators.required],
    cuentaDestinoId: ['', Validators.required],
    monto: ['', [Validators.required, validarMonto]],
    concepto: ['', Validators.maxLength(255)],
  });

  private readonly valDeposito = toSignal(this.deposito.valueChanges, { initialValue: this.deposito.getRawValue() });
  private readonly valRetiro = toSignal(this.retiro.valueChanges, { initialValue: this.retiro.getRawValue() });
  private readonly valTransferencia = toSignal(this.transferencia.valueChanges, { initialValue: this.transferencia.getRawValue() });

  /** Solo se ofrecen cuentas activas de clientes activos: el backend rechaza las demás. */
  readonly operables = computed(() => this.cuentas().filter(operable));
  readonly cuentaDeposito = computed(() => this.buscar(this.valDeposito().cuentaId));
  readonly cuentaRetiro = computed(() => this.buscar(this.valRetiro().cuentaId));
  readonly cuentaOrigen = computed(() => this.buscar(this.valTransferencia().cuentaOrigenId));
  readonly cuentaDestino = computed(() => this.buscar(this.valTransferencia().cuentaDestinoId));
  readonly destinos = computed(() => this.operables().filter((cuenta) => String(cuenta.id) !== String(this.valTransferencia().cuentaOrigenId)));
  readonly excedeRetiro = computed(() => excede(this.valRetiro().monto, this.cuentaRetiro()));
  readonly excedeTransferencia = computed(() => excede(this.valTransferencia().monto, this.cuentaOrigen()));

  constructor() {
    const consulta = this.ruta.snapshot.queryParamMap;
    const tipo = consulta.get('tipo') as Tipo | null;
    if (tipo && this.tipos.includes(tipo)) {
      this.pestana.set(tipo);
    }
    const cuentaId = consulta.get('cuentaId') ?? '';
    if (cuentaId) {
      this.deposito.patchValue({ cuentaId });
      this.retiro.patchValue({ cuentaId });
      this.transferencia.patchValue({ cuentaOrigenId: cuentaId });
    }
    this.cargarCuentas(true);
  }

  cambiar(tipo: Tipo): void {
    this.pestana.set(tipo);
    this.error.set('');
    this.comprobante.set(null);
  }

  moverPestana(evento: KeyboardEvent): void {
    const indice = this.tipos.indexOf(this.pestana());
    const delta = evento.key === 'ArrowRight' ? 1 : evento.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) {
      return;
    }
    evento.preventDefault();
    const siguiente = this.tipos[(indice + delta + this.tipos.length) % this.tipos.length];
    this.cambiar(siguiente);
    document.getElementById(`pestana-${siguiente}`)?.focus();
  }

  errorDe(grupo: FormGroup, campo: string, mensajes: Record<string, string>): string {
    return errorDe(grupo.get(campo), mensajes);
  }

  errorMonto(grupo: FormGroup, excede: boolean, cuenta: Cuenta | null = null): string {
    const control = grupo.get('monto');
    const base = errorDe(control, MENSAJES_MONTO);
    if (base) {
      return base;
    }
    if (!excede || !(control?.touched || control?.dirty)) {
      return '';
    }
    return cuenta ? `El monto supera el saldo disponible (${moneda(cuenta.saldo)}).` : MENSAJES_MONTO['saldo'];
  }

  nuevaOperacion(): void {
    this.comprobante.set(null);
    this.error.set('');
  }

  async depositar(): Promise<void> {
    const cuenta = this.cuentaDeposito();
    if (!this.validar(this.deposito) || !cuenta) {
      return;
    }
    const valor = this.deposito.getRawValue();
    const monto = Number(valor.monto);
    const ok = await this.confirmacion.pedir({
      titulo: 'Confirmar depósito',
      mensaje: 'Revise los datos antes de registrar el depósito.',
      detalle: [
        { etiqueta: 'Cuenta', valor: cuenta.numeroCuenta },
        { etiqueta: 'Titular', valor: cuenta.clienteNombre },
        { etiqueta: 'Monto', valor: moneda(monto) },
        { etiqueta: 'Saldo después', valor: moneda(cuenta.saldo + monto) },
      ],
      confirmar: 'Registrar depósito',
    });
    if (!ok) {
      return;
    }
    this.enviar();
    this.api.depositar(cuenta.id, monto, valor.descripcion.trim()).subscribe({
      next: ({ movimiento }) => {
        this.terminar({
          titulo: 'Depósito registrado',
          referencia: `MOV-${movimiento.id}`,
          fecha: fecha(movimiento.fecha),
          monto: movimiento.monto,
          cuentaId: cuenta.id,
          filas: [
            { etiqueta: 'Cuenta', valor: cuenta.numeroCuenta },
            { etiqueta: 'Saldo anterior', valor: moneda(movimiento.saldoAnterior) },
            { etiqueta: 'Saldo nuevo', valor: moneda(movimiento.saldoPosterior) },
          ],
        });
        this.deposito.reset({ cuentaId: String(cuenta.id), monto: '', descripcion: '' });
      },
      error: (error: unknown) => this.fallar(error),
    });
  }

  async retirar(): Promise<void> {
    const cuenta = this.cuentaRetiro();
    if (!this.validar(this.retiro, this.excedeRetiro()) || !cuenta) {
      return;
    }
    const valor = this.retiro.getRawValue();
    const monto = Number(valor.monto);
    const ok = await this.confirmacion.pedir({
      titulo: 'Confirmar retiro',
      mensaje: 'Revise los datos antes de registrar el retiro.',
      detalle: [
        { etiqueta: 'Cuenta', valor: cuenta.numeroCuenta },
        { etiqueta: 'Titular', valor: cuenta.clienteNombre },
        { etiqueta: 'Monto', valor: moneda(monto) },
        { etiqueta: 'Saldo después', valor: moneda(cuenta.saldo - monto) },
      ],
      confirmar: 'Registrar retiro',
    });
    if (!ok) {
      return;
    }
    this.enviar();
    this.api.retirar(cuenta.id, monto, valor.descripcion.trim()).subscribe({
      next: ({ movimiento }) => {
        this.terminar({
          titulo: 'Retiro registrado',
          referencia: `MOV-${movimiento.id}`,
          fecha: fecha(movimiento.fecha),
          monto: movimiento.monto,
          cuentaId: cuenta.id,
          filas: [
            { etiqueta: 'Cuenta', valor: cuenta.numeroCuenta },
            { etiqueta: 'Saldo anterior', valor: moneda(movimiento.saldoAnterior) },
            { etiqueta: 'Saldo nuevo', valor: moneda(movimiento.saldoPosterior) },
          ],
        });
        this.retiro.reset({ cuentaId: String(cuenta.id), monto: '', descripcion: '' });
      },
      error: (error: unknown) => this.fallar(error),
    });
  }

  async transferir(): Promise<void> {
    const origen = this.cuentaOrigen();
    const destino = this.cuentaDestino();
    if (!this.validar(this.transferencia, this.excedeTransferencia()) || !origen || !destino) {
      return;
    }
    const valor = this.transferencia.getRawValue();
    const monto = Number(valor.monto);
    const ok = await this.confirmacion.pedir({
      titulo: 'Confirmar transferencia',
      mensaje: 'Revise las cuentas y el monto antes de transferir.',
      detalle: [
        { etiqueta: 'Desde', valor: `${origen.numeroCuenta} · ${origen.clienteNombre}` },
        { etiqueta: 'Hacia', valor: `${destino.numeroCuenta} · ${destino.clienteNombre}` },
        { etiqueta: 'Monto', valor: moneda(monto) },
        { etiqueta: 'Saldo de origen después', valor: moneda(origen.saldo - monto) },
      ],
      confirmar: 'Transferir',
    });
    if (!ok) {
      return;
    }
    this.enviar();
    this.api.transferir(origen.id, destino.id, monto, valor.concepto.trim()).subscribe({
      next: (respuesta) => {
        this.terminar({
          titulo: 'Transferencia realizada',
          referencia: respuesta.transferencia.referencia,
          fecha: fecha(respuesta.transferencia.fecha),
          monto: respuesta.transferencia.monto,
          cuentaId: origen.id,
          filas: [
            { etiqueta: 'Cuenta origen', valor: origen.numeroCuenta },
            { etiqueta: 'Nuevo saldo de origen', valor: moneda(respuesta.movimientoOrigen.saldoPosterior) },
            { etiqueta: 'Cuenta destino', valor: destino.numeroCuenta },
            { etiqueta: 'Titular destino', valor: destino.clienteNombre },
          ],
        });
        this.transferencia.reset({ cuentaOrigenId: String(origen.id), cuentaDestinoId: '', monto: '', concepto: '' });
      },
      error: (error: unknown) => this.fallar(error),
    });
  }

  private buscar(id: string | undefined): Cuenta | null {
    return this.cuentas().find((cuenta) => String(cuenta.id) === String(id ?? '')) ?? null;
  }

  private validar(grupo: FormGroup, excedeSaldo = false): boolean {
    this.error.set('');
    if (grupo.invalid || excedeSaldo) {
      grupo.markAllAsTouched();
      setTimeout(() => document.querySelector<HTMLElement>('form [aria-invalid="true"]')?.focus());
      return false;
    }
    return true;
  }

  private enviar(): void {
    this.enviando.set(true);
    this.error.set('');
  }

  private terminar(comprobante: Comprobante): void {
    this.enviando.set(false);
    this.comprobante.set(comprobante);
    this.cargarCuentas(false);
  }

  private fallar(error: unknown): void {
    this.enviando.set(false);
    this.error.set(mensajeError(error));
    this.cargarCuentas(false);
  }

  private cargarCuentas(inicial: boolean): void {
    this.api.cuentas().subscribe({
      next: (lista) => {
        this.cuentas.set(lista);
        if (inicial) {
          this.descartarNoOperables();
          this.cargando.set(false);
        }
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  private descartarNoOperables(): void {
    const valida = (id: string) => !id || this.operables().some((cuenta) => String(cuenta.id) === id);
    if (!valida(this.deposito.controls.cuentaId.value)) {
      const cuenta = this.buscar(this.deposito.controls.cuentaId.value);
      this.error.set(`La cuenta ${cuenta?.numeroCuenta ?? ''} no puede operar porque está inactiva o su titular está inactivo.`.replace('  ', ' '));
      this.deposito.patchValue({ cuentaId: '' });
      this.retiro.patchValue({ cuentaId: '' });
      this.transferencia.patchValue({ cuentaOrigenId: '' });
    }
  }
}

function excede(monto: string | undefined, cuenta: Cuenta | null): boolean {
  const valor = Number(monto);
  return !!cuenta && Number.isFinite(valor) && valor > cuenta.saldo;
}
