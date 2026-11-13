import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Cuenta, moneda } from '../core/modelos';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-cuentas',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cuentas.html',
})
export class Cuentas {
  private readonly api = inject(Api);
  private readonly fb = inject(FormBuilder);
  readonly moneda = moneda;
  readonly cuentas = signal<Cuenta[]>([]);
  readonly error = signal('');
  readonly busqueda = this.fb.nonNullable.group({ q: [''] });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.api.cuentas(this.busqueda.getRawValue().q.trim()).subscribe({
      next: (lista) => this.cuentas.set(lista),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }
}
