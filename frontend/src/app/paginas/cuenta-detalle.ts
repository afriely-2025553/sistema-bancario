import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Api } from '../core/api';
import { Cuenta, Movimiento, esEntrada, etiquetaTipo, fecha, moneda, montoConSigno, operable, plural, soloFecha } from '../core/modelos';
import { mensajeError } from '../core/texto-error';
import { Avisos } from '../ui/avisos';
import { Confirmacion } from '../ui/confirmacion';
import { Paginador, paginar } from '../ui/paginador';

@Component({
  selector: 'app-cuenta-detalle',
  imports: [RouterLink, Paginador],
  templateUrl: './cuenta-detalle.html',
})
export class CuentaDetalle {
  private readonly api = inject(Api);
  private readonly ruta = inject(ActivatedRoute);
  private readonly avisos = inject(Avisos);
  private readonly confirmacion = inject(Confirmacion);
  readonly moneda = moneda;
  readonly fecha = fecha;
  readonly soloFecha = soloFecha;
  readonly etiquetaTipo = etiquetaTipo;
  readonly esEntrada = esEntrada;
  readonly montoConSigno = montoConSigno;
  readonly operable = operable;
  readonly plural = plural;
  readonly cuenta = signal<Cuenta | null>(null);
  readonly movimientos = signal<Movimiento[]>([]);
  readonly cargando = signal(true);
  readonly procesando = signal(false);
  readonly error = signal('');
  readonly pagina = signal(1);
  readonly visibles = computed(() => paginar(this.movimientos(), this.pagina()));
  private readonly id = Number(this.ruta.snapshot.paramMap.get('id'));

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    forkJoin({ cuenta: this.api.cuenta(this.id), movimientos: this.api.movimientos(this.id) }).subscribe({
      next: ({ cuenta, movimientos }) => {
        this.cuenta.set(cuenta);
        this.movimientos.set(movimientos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }

  async cambiarEstado(): Promise<void> {
    const cuenta = this.cuenta();
    if (!cuenta) {
      return;
    }
    const nuevo = cuenta.estado === 'activa' ? 'inactiva' : 'activa';
    const confirmado = await this.confirmacion.pedir({
      titulo: nuevo === 'inactiva' ? 'Desactivar cuenta' : 'Activar cuenta',
      mensaje:
        nuevo === 'inactiva'
          ? 'La cuenta no podrá recibir depósitos, retiros ni transferencias hasta que se active de nuevo. El saldo y el historial se conservan.'
          : 'La cuenta podrá operar de nuevo.',
      detalle: [
        { etiqueta: 'Cuenta', valor: cuenta.numeroCuenta },
        { etiqueta: 'Saldo', valor: moneda(cuenta.saldo) },
      ],
      confirmar: nuevo === 'inactiva' ? 'Desactivar' : 'Activar',
      peligro: nuevo === 'inactiva',
    });
    if (!confirmado) {
      return;
    }
    this.procesando.set(true);
    this.api.cambiarEstado(cuenta.id, nuevo).subscribe({
      next: (actualizada) => {
        this.cuenta.set(actualizada);
        this.procesando.set(false);
        this.avisos.mostrar(nuevo === 'inactiva' ? 'Cuenta desactivada.' : 'Cuenta activada.');
      },
      error: (error: unknown) => {
        this.procesando.set(false);
        this.avisos.mostrar(mensajeError(error), 'error');
      },
    });
  }
}
