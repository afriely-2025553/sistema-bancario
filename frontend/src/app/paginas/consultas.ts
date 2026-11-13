import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Consulta, moneda } from '../core/modelos';
import { mensajeError } from '../core/texto-error';

@Component({
  selector: 'app-consultas',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './consultas.html',
})
export class Consultas {
  private readonly api = inject(Api);
  private readonly fb = inject(FormBuilder);
  readonly moneda = moneda;
  readonly resultado = signal<Consulta | null>(null);
  readonly error = signal('');
  readonly formulario = this.fb.nonNullable.group({
    q: ['', Validators.required],
  });

  buscar(): void {
    const q = this.formulario.getRawValue().q.trim();
    if (!q) {
      this.error.set('Escriba un texto para consultar.');
      return;
    }
    this.error.set('');
    this.api.consultar(q).subscribe({
      next: (datos) => this.resultado.set(datos),
      error: (error: unknown) => this.error.set(mensajeError(error)),
    });
  }
}
