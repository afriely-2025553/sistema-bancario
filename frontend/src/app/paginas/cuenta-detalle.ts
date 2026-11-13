import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Cuenta, Movimiento, etiquetaTipo, fecha, moneda } from '../core/modelos';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-cuenta-detalle',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cuenta-detalle.html',
})
export class CuentaDetalle {
  private readonly api = inject(Api);
  private readonly ruta = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly moneda = moneda;
  readonly fecha = fecha;
  readonly etiquetaTipo = etiquetaTipo;
  readonly cuenta = signal<Cuenta | null>(null);
  readonly movimientos = signal<Movimiento[]>([]);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly estado = this.fb.nonNullable.group({ valor: ['activa' as 'activa' | 'inactiva'] });

  constructor() {
    this.cargar(Number(this.ruta.snapshot.paramMap.get('id')));
  }

  guardarEstado(): void {
    const actual = this.cuenta();
    if (!actual) {
      return;
    }
    this.api.cambiarEstado(actual.id, this.estado.getRawValue().valor).subscribe({
      next: (cuenta) => {
        this.cuenta.set(cuenta);
        this.mensaje.set('Estado actualizado.');
      },
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }

  private cargar(id: number): void {
    this.api.cuenta(id).subscribe({
      next: (cuenta) => {
        this.cuenta.set(cuenta);
        this.estado.patchValue({ valor: cuenta.estado });
      },
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
    this.api.movimientos(id).subscribe({
      next: (lista) => this.movimientos.set(lista),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }
}
