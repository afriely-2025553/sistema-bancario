import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Cuenta, Movimiento, esEntrada, etiquetaTipo, fecha, hoyIso, moneda, montoConSigno } from '../core/modelos';
import { mensajeError } from '../core/texto-error';
import { Paginador, paginar } from '../ui/paginador';

@Component({
  selector: 'app-movimientos',
  imports: [ReactiveFormsModule, RouterLink, Paginador],
  templateUrl: './movimientos.html',
})
export class Movimientos {
  private readonly api = inject(Api);
  private readonly fb = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);
  readonly moneda = moneda;
  readonly fecha = fecha;
  readonly etiquetaTipo = etiquetaTipo;
  readonly esEntrada = esEntrada;
  readonly montoConSigno = montoConSigno;
  readonly hoy = hoyIso();
  readonly cuentas = signal<Cuenta[]>([]);
  readonly movimientos = signal<Movimiento[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly errorFechas = signal('');
  readonly pagina = signal(1);
  readonly tipo = signal('');
  readonly filtros = this.fb.nonNullable.group({
    cuentaId: [this.ruta.snapshot.queryParamMap.get('cuentaId') ?? ''],
    tipo: [''],
    desde: [''],
    hasta: [''],
  });
  readonly filtrados = computed(() => {
    const tipo = this.tipo();
    if (!tipo) return this.movimientos();
    if (tipo === 'transferencia') return this.movimientos().filter((m) => m.tipo.startsWith('transferencia'));
    return this.movimientos().filter((m) => m.tipo === tipo);
  });
  readonly visibles = computed(() => paginar(this.filtrados(), this.pagina(), 15));
  readonly entradas = computed(() => this.filtrados().filter((m) => esEntrada(m.tipo)).reduce((t, m) => t + m.monto, 0));
  readonly salidas = computed(() => this.filtrados().filter((m) => !esEntrada(m.tipo)).reduce((t, m) => t + m.monto, 0));

  constructor() {
    this.api.cuentas().subscribe({
      next: (lista) => this.cuentas.set(lista),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
    this.cargar();
  }

  cargar(): void {
    const valor = this.filtros.getRawValue();
    this.errorFechas.set('');
    if (valor.desde && valor.hasta && valor.desde > valor.hasta) {
      this.errorFechas.set('La fecha inicial no puede ser posterior a la final.');
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    this.tipo.set(valor.tipo);
    this.pagina.set(1);
    this.api
      .movimientos(valor.cuentaId ? Number(valor.cuentaId) : undefined, valor.desde || undefined, valor.hasta || undefined)
      .subscribe({
        next: (lista) => {
          this.movimientos.set(lista);
          this.cargando.set(false);
        },
        error: (error: unknown) => {
          this.error.set(mensajeError(error));
          this.cargando.set(false);
        },
      });
  }

  limpiar(): void {
    this.filtros.reset({ cuentaId: '', tipo: '', desde: '', hasta: '' });
    this.cargar();
  }
}
