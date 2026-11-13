import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Reporte, etiquetaTipo, fecha, moneda } from '../core/modelos';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
})
export class Inicio {
  private readonly api = inject(Api);
  readonly moneda = moneda;
  readonly fecha = fecha;
  readonly etiquetaTipo = etiquetaTipo;
  readonly reporte = signal<Reporte | null>(null);
  readonly error = signal('');

  constructor() {
    this.api.reporte().subscribe({
      next: (datos) => this.reporte.set(datos),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }
}
