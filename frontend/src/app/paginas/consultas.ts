import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Api } from '../core/api';
import { Consulta, moneda, nombreCliente } from '../core/modelos';
import { mensajeError } from '../core/texto-error';
import { errorDe } from '../ui/validacion';

@Component({
  selector: 'app-consultas',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './consultas.html',
})
export class Consultas {
  private readonly api = inject(Api);
  private readonly fb = inject(FormBuilder);
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly moneda = moneda;
  readonly nombreCliente = nombreCliente;
  readonly ejemplos = ['CLI-0001', '100-00000002', 'López', '2501000030101'];
  readonly resultado = signal<Consulta | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly formulario = this.fb.nonNullable.group({
    q: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    const q = this.ruta.snapshot.queryParamMap.get('q');
    if (q) {
      this.formulario.setValue({ q });
      this.buscar();
    }
  }

  errorTexto(): string {
    return errorDe(this.formulario.controls.q, {
      required: 'Escriba lo que desea buscar.',
      minlength: 'Escriba al menos 2 caracteres.',
    });
  }

  usarEjemplo(texto: string): void {
    this.formulario.setValue({ q: texto });
    this.buscar();
  }

  limpiar(): void {
    this.formulario.reset({ q: '' });
    this.resultado.set(null);
    this.error.set('');
    void this.router.navigate([], { queryParams: {} });
  }

  buscar(): void {
    this.formulario.controls.q.setValue(this.formulario.controls.q.value.trim());
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const q = this.formulario.getRawValue().q;
    this.error.set('');
    this.cargando.set(true);
    void this.router.navigate([], { queryParams: { q }, replaceUrl: true });
    this.api.consultar(q).subscribe({
      next: (datos) => {
        this.resultado.set(datos);
        this.cargando.set(false);
      },
      error: (error: unknown) => {
        this.error.set(mensajeError(error));
        this.cargando.set(false);
      },
    });
  }
}
