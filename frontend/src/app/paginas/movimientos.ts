import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Cuenta, Movimiento, etiquetaTipo, fecha, moneda } from '../core/modelos';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-movimientos',
  imports: [ReactiveFormsModule],
  templateUrl: './movimientos.html',
})
export class Movimientos {
  private readonly api = inject(Api);
  private readonly fb = inject(FormBuilder);
  readonly moneda = moneda;
  readonly fecha = fecha;
  readonly etiquetaTipo = etiquetaTipo;
  readonly cuentas = signal<Cuenta[]>([]);
  readonly movimientos = signal<Movimiento[]>([]);
  readonly error = signal('');
  readonly filtros = this.fb.nonNullable.group({
    cuentaId: [''],
    desde: [''],
    hasta: [''],
  });

  constructor() {
    this.api.cuentas().subscribe({
      next: (lista) => this.cuentas.set(lista),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
    this.cargar();
  }

  cargar(): void {
    const valor = this.filtros.getRawValue();
    this.api
      .movimientos(valor.cuentaId ? Number(valor.cuentaId) : undefined, valor.desde || undefined, valor.hasta || undefined)
      .subscribe({
        next: (lista) => this.movimientos.set(lista),
        error: (error: unknown) => this.error.set(mensajeError(error)),
      });
  }
}
