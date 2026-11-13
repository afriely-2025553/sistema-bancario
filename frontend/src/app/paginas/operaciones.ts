import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Api } from '../core/api';
import { Cuenta, moneda } from '../core/modelos';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-operaciones',
  imports: [ReactiveFormsModule],
  templateUrl: './operaciones.html',
})
export class Operaciones {
  private readonly api = inject(Api);
  private readonly ruta = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  readonly moneda = moneda;
  readonly cuentas = signal<Cuenta[]>([]);
  readonly pestana = signal<'deposito' | 'retiro' | 'transferencia'>('deposito');
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly deposito = this.fb.nonNullable.group({
    cuentaId: ['', Validators.required],
    monto: ['', [Validators.required, Validators.min(0.01)]],
    descripcion: [''],
  });
  readonly retiro = this.fb.nonNullable.group({
    cuentaId: ['', Validators.required],
    monto: ['', [Validators.required, Validators.min(0.01)]],
    descripcion: [''],
  });
  readonly transferencia = this.fb.nonNullable.group({
    cuentaOrigenId: ['', Validators.required],
    cuentaDestinoId: ['', Validators.required],
    monto: ['', [Validators.required, Validators.min(0.01)]],
    concepto: [''],
  });

  constructor() {
    const cuentaId = this.ruta.snapshot.queryParamMap.get('cuentaId') ?? '';
    if (cuentaId) {
      this.deposito.patchValue({ cuentaId });
      this.retiro.patchValue({ cuentaId });
      this.transferencia.patchValue({ cuentaOrigenId: cuentaId });
    }
    this.api.cuentas().subscribe({
      next: (lista) => this.cuentas.set(lista),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }

  depositar(): void {
    if (this.deposito.invalid) {
      this.deposito.markAllAsTouched();
      this.error.set('Indique la cuenta y un monto mayor que cero.');
      return;
    }
    const valor = this.deposito.getRawValue();
    this.error.set('');
    this.api.depositar(Number(valor.cuentaId), Number(valor.monto), valor.descripcion).subscribe({
      next: (respuesta) => {
        this.mensaje.set(`Depósito registrado. Saldo nuevo: ${moneda(respuesta.movimiento.saldoPosterior)}.`);
        this.deposito.patchValue({ monto: '', descripcion: '' });
        this.refrescar();
      },
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }

  retirar(): void {
    if (this.retiro.invalid) {
      this.retiro.markAllAsTouched();
      this.error.set('Indique la cuenta y un monto mayor que cero.');
      return;
    }
    const valor = this.retiro.getRawValue();
    this.error.set('');
    this.api.retirar(Number(valor.cuentaId), Number(valor.monto), valor.descripcion).subscribe({
      next: (respuesta) => {
        this.mensaje.set(`Retiro registrado. Saldo nuevo: ${moneda(respuesta.movimiento.saldoPosterior)}.`);
        this.retiro.patchValue({ monto: '', descripcion: '' });
        this.refrescar();
      },
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }

  transferir(): void {
    if (this.transferencia.invalid) {
      this.transferencia.markAllAsTouched();
      this.error.set('Complete origen, destino y monto.');
      return;
    }
    const valor = this.transferencia.getRawValue();
    this.error.set('');
    this.api
      .transferir(Number(valor.cuentaOrigenId), Number(valor.cuentaDestinoId), Number(valor.monto), valor.concepto)
      .subscribe({
        next: (respuesta) => {
          this.mensaje.set(
            `${respuesta.transferencia.referencia}: origen ${moneda(respuesta.movimientoOrigen.saldoPosterior)}, destino ${moneda(respuesta.movimientoDestino.saldoPosterior)}.`,
          );
          this.transferencia.patchValue({ monto: '', concepto: '' });
          this.refrescar();
        },
        error: (error: unknown) => this.error.set(mensajeError(error)),
      });
  }

  private refrescar(): void {
    this.api.cuentas().subscribe({
      next: (lista) => this.cuentas.set(lista),
    });
  }
}
