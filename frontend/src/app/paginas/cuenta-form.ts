import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Cliente, TipoCuenta } from '../core/modelos';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-cuenta-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cuenta-form.html',
})
export class CuentaForm {
  private readonly api = inject(Api);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly clientes = signal<Cliente[]>([]);
  readonly tipos = signal<TipoCuenta[]>([]);
  readonly error = signal('');
  readonly enviando = signal(false);
  readonly formulario = this.fb.nonNullable.group({
    clienteId: ['', Validators.required],
    tipoCuentaId: ['', Validators.required],
  });

  constructor() {
    this.api.clientes().subscribe({
      next: (lista) => this.clientes.set(lista.filter((cliente) => cliente.activo)),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
    this.api.tiposCuenta().subscribe({
      next: (lista) => this.tipos.set(lista.filter((tipo) => tipo.activo)),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.error.set('Seleccione el cliente y el tipo de cuenta.');
      return;
    }
    const valor = this.formulario.getRawValue();
    this.enviando.set(true);
    this.api.crearCuenta(Number(valor.clienteId), Number(valor.tipoCuentaId)).subscribe({
      next: (cuenta) => {
        this.enviando.set(false);
        void this.router.navigate(['/cuentas', cuenta.id]);
      },
      error: (error: unknown) => {
        this.enviando.set(false);
        this.error.set(mensajeError(error));
      },
    });
  }
}
