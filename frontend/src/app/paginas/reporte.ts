import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { Movimiento, Reporte, ahoraLocal, esEntrada, etiquetaTipo, fecha, hoyIso, moneda, montoConSigno, plural, soloFecha } from '../core/modelos';
import { mensajeError } from '../core/texto-error';
import { Paginador, paginar } from '../ui/paginador';

@Component({
  selector: 'app-reporte',
  imports: [ReactiveFormsModule, RouterLink, Paginador],
  templateUrl: './reporte.html',
})
export class ReportePagina {
  private readonly api = inject(Api);
  private readonly fb = inject(FormBuilder);
  readonly moneda = moneda;
  readonly fecha = fecha;
  readonly soloFecha = soloFecha;
  readonly etiquetaTipo = etiquetaTipo;
  readonly esEntrada = esEntrada;
  readonly montoConSigno = montoConSigno;
  readonly plural = plural;
  readonly hoy = hoyIso();
  readonly reporte = signal<Reporte | null>(null);
  readonly movimientos = signal<Movimiento[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly errorFechas = signal('');
  readonly pagina = signal(1);
  readonly generado = signal('');
  readonly filtros = this.fb.nonNullable.group({ desde: [''], hasta: [''] });
  readonly imprimiendo = signal(false);
  readonly visibles = computed(() => (this.imprimiendo() ? this.movimientos() : paginar(this.movimientos(), this.pagina(), 15)));
  readonly periodo = computed(() => {
    const datos = this.reporte();
    if (!datos || (!datos.periodo.desde && !datos.periodo.hasta)) {
      return 'Todo el historial';
    }
    const desde = datos.periodo.desde ? soloFecha(datos.periodo.desde) : 'el inicio';
    const hasta = datos.periodo.hasta ? soloFecha(datos.periodo.hasta) : 'hoy';
    return `Del ${desde} al ${hasta}`;
  });

  constructor() {
    this.cargar();
  }

  rapido(opcion: 'mes' | 'todo'): void {
    if (opcion === 'todo') {
      this.filtros.reset({ desde: '', hasta: '' });
    } else {
      this.filtros.setValue({ desde: `${this.hoy.slice(0, 8)}01`, hasta: this.hoy });
    }
    this.cargar();
  }

  imprimir(): void {
    this.imprimiendo.set(true);
    setTimeout(() => {
      window.print();
      this.imprimiendo.set(false);
    });
  }

  cargar(): void {
    const valor = this.filtros.getRawValue();
    this.errorFechas.set('');
    if (valor.desde && valor.hasta && valor.desde > valor.hasta) {
      this.errorFechas.set('La fecha inicial no puede ser posterior a la final.');
      return;
    }
    const desde = valor.desde || undefined;
    const hasta = valor.hasta || undefined;
    this.cargando.set(true);
    this.error.set('');
    this.pagina.set(1);
    forkJoin({ reporte: this.api.reporte(desde, hasta), movimientos: this.api.movimientos(undefined, desde, hasta) }).subscribe({
      next: ({ reporte, movimientos }) => {
        this.reporte.set(reporte);
        this.movimientos.set(movimientos);
        this.generado.set(fecha(ahoraLocal()));
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }
}
