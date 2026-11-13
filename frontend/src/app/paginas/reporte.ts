import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Api } from '../core/api';
import { Movimiento, Reporte, etiquetaTipo, fecha, moneda } from '../core/modelos';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-reporte',
  imports: [ReactiveFormsModule],
  templateUrl: './reporte.html',
})
export class ReportePagina {
  private readonly api = inject(Api);
  private readonly fb = inject(FormBuilder);
  readonly moneda = moneda;
  readonly fecha = fecha;
  readonly etiquetaTipo = etiquetaTipo;
  readonly reporte = signal<Reporte | null>(null);
  readonly movimientos = signal<Movimiento[]>([]);
  readonly error = signal('');
  readonly filtros = this.fb.nonNullable.group({ desde: [''], hasta: [''] });

  constructor() {
    this.cargar();
  }

  cargar(): void {
    const valor = this.filtros.getRawValue();
    const desde = valor.desde || undefined;
    const hasta = valor.hasta || undefined;
    this.api.reporte(desde, hasta).subscribe({
      next: (datos) => this.reporte.set(datos),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
    this.api.movimientos(undefined, desde, hasta).subscribe({
      next: (lista) => this.movimientos.set(lista),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }
}
