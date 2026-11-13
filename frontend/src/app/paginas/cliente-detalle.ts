import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { Cliente, Cuenta, moneda, nombreCliente, soloFecha } from '../core/modelos';
import { mensajeError } from '../core/texto-error';
import { Avisos } from '../ui/avisos';
import { Confirmacion } from '../ui/confirmacion';

@Component({
  selector: 'app-cliente-detalle',
  imports: [RouterLink],
  templateUrl: './cliente-detalle.html',
})
export class ClienteDetalle {
  private readonly api = inject(Api);
  private readonly ruta = inject(ActivatedRoute);
  private readonly avisos = inject(Avisos);
  private readonly confirmacion = inject(Confirmacion);
  readonly moneda = moneda;
  readonly soloFecha = soloFecha;
  readonly nombreCliente = nombreCliente;
  readonly cliente = signal<Cliente | null>(null);
  readonly cuentas = signal<Cuenta[]>([]);
  readonly cargando = signal(true);
  readonly procesando = signal(false);
  readonly error = signal('');
  readonly activas = computed(() => this.cuentas().filter((cuenta) => cuenta.estado === 'activa').length);
  readonly saldoTotal = computed(() => this.cuentas().reduce((total, cuenta) => total + cuenta.saldo, 0));
  private readonly id = Number(this.ruta.snapshot.paramMap.get('id'));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({ cliente: this.api.cliente(this.id), cuentas: this.api.cuentas('', this.id) }).subscribe({
      next: ({ cliente, cuentas }) => {
        this.cliente.set(cliente);
        this.cuentas.set(cuentas);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  async cambiarActivo(): Promise<void> {
    const cliente = this.cliente();
    if (!cliente) {
      return;
    }
    const desactivar = cliente.activo;
    const activas = this.cuentas().filter((cuenta) => cuenta.estado === 'activa').length;
    const confirmado = await this.confirmacion.pedir({
      titulo: desactivar ? 'Desactivar cliente' : 'Activar cliente',
      mensaje: desactivar
        ? `${textoCuentas(activas)} La ficha y el historial se conservan.`
        : 'El cliente y sus cuentas activas podrán operar de nuevo.',
      detalle: [
        { etiqueta: 'Cliente', valor: nombreCliente(cliente) },
        { etiqueta: 'Código', valor: cliente.codigo },
      ],
      confirmar: desactivar ? 'Desactivar' : 'Activar',
      peligro: desactivar,
    });
    if (!confirmado) {
      return;
    }
    this.procesando.set(true);
    const solicitud = desactivar ? this.api.desactivarCliente(cliente.id) : this.api.activarCliente(cliente.id);
    solicitud.subscribe({
      next: () => {
        this.procesando.set(false);
        this.avisos.mostrar(desactivar ? 'Cliente desactivado.' : 'Cliente activado.');
        this.cargar();
      },
      error: (error: unknown) => {
        this.procesando.set(false);
        this.avisos.mostrar(mensajeError(error), 'error');
      },
    });
  }
}

function textoCuentas(activas: number): string {
  if (activas === 0) {
    return 'El cliente no tiene cuentas activas.';
  }
  if (activas === 1) {
    return 'Su cuenta activa no podrá operar mientras el cliente esté inactivo.';
  }
  return `Sus ${activas} cuentas activas no podrán operar mientras el cliente esté inactivo.`;
}
