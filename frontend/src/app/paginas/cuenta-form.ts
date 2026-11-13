import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { Cliente, TipoCuenta, nombreCliente } from '../core/modelos';
import { mensajeError } from '../core/texto-error';
import { Avisos } from '../ui/avisos';
import { errorDe } from '../ui/validacion';

@Component({
  selector: 'app-cuenta-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cuenta-form.html',
})
export class CuentaForm {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly avisos = inject(Avisos);
  private readonly fb = inject(FormBuilder);
  readonly nombreCliente = nombreCliente;
  readonly clientes = signal<Cliente[]>([]);
  readonly tipos = signal<TipoCuenta[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly enviando = signal(false);
  readonly formulario = this.fb.nonNullable.group({
    clienteId: [this.ruta.snapshot.queryParamMap.get('clienteId') ?? '', Validators.required],
    tipoCuentaId: ['', Validators.required],
  });
  private readonly valores = toSignal(this.formulario.valueChanges, { initialValue: this.formulario.getRawValue() });
  readonly tipoElegido = computed(() => this.tipos().find((tipo) => String(tipo.id) === String(this.valores().tipoCuentaId)) ?? null);
  readonly clienteElegido = computed(() => this.clientes().find((cliente) => String(cliente.id) === String(this.valores().clienteId)) ?? null);

  constructor() {
    forkJoin({ clientes: this.api.clientes(), tipos: this.api.tiposCuenta() }).subscribe({
      next: ({ clientes, tipos }) => {
        this.clientes.set(clientes.filter((cliente) => cliente.activo));
        this.tipos.set(tipos.filter((tipo) => tipo.activo));
        const elegido = this.formulario.controls.clienteId.value;
        if (elegido && !this.clientes().some((cliente) => String(cliente.id) === elegido)) {
          this.formulario.controls.clienteId.setValue('');
        }
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  errorCliente(): string {
    return errorDe(this.formulario.controls.clienteId, { required: 'Seleccione el cliente titular.' });
  }

  errorTipo(): string {
    return errorDe(this.formulario.controls.tipoCuentaId, { required: 'Seleccione el tipo de cuenta.' });
  }

  guardar(): void {
    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const valor = this.formulario.getRawValue();
    this.enviando.set(true);
    this.api.crearCuenta(Number(valor.clienteId), Number(valor.tipoCuentaId)).subscribe({
      next: (cuenta) => {
        this.enviando.set(false);
        this.avisos.mostrar(`Cuenta ${cuenta.numeroCuenta} abierta.`);
        void this.router.navigate(['/cuentas', cuenta.id]);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.error.set(mensajeError(error));
      },
    });
  }
}
