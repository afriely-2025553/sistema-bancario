import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { AuthService } from '../core/auth.service';
import { Reporte, esEntrada, etiquetaTipo, fecha, moneda, montoConSigno, plural } from '../core/modelos';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
})
export class Inicio {
  private readonly api = inject(Api);
  readonly auth = inject(AuthService);
  readonly moneda = moneda;
  readonly fecha = fecha;
  readonly etiquetaTipo = etiquetaTipo;
  readonly esEntrada = esEntrada;
  readonly montoConSigno = montoConSigno;
  readonly plural = plural;
  readonly reporte = signal<Reporte | null>(null);
  readonly cargando = signal(true);
  readonly error = signal('');

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.api.reporte().subscribe({
      next: (datos) => {
        this.reporte.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }
}
