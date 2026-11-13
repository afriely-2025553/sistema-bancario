import { Component, computed, input, model } from '@angular/core';

@Component({
  selector: 'app-paginador',
  template: `
    @if (total() > tamano()) {
      <nav class="paginador" aria-label="Paginación">
        <span>Mostrando {{ desde() }}–{{ hasta() }} de {{ total() }}</span>
        <div class="grupo-acciones">
          <button type="button" class="boton secundario pequeno" [disabled]="pagina() === 1" (click)="pagina.set(pagina() - 1)">Anterior</button>
          <span class="nowrap" aria-live="polite">Página {{ pagina() }} de {{ paginas() }}</span>
          <button type="button" class="boton secundario pequeno" [disabled]="pagina() === paginas()" (click)="pagina.set(pagina() + 1)">Siguiente</button>
        </div>
      </nav>
    }
  `,
})
export class Paginador {
  readonly total = input.required<number>();
  readonly tamano = input(10);
  readonly pagina = model(1);
  readonly paginas = computed(() => Math.max(1, Math.ceil(this.total() / this.tamano())));
  readonly desde = computed(() => (this.total() === 0 ? 0 : (this.pagina() - 1) * this.tamano() + 1));
  readonly hasta = computed(() => Math.min(this.total(), this.pagina() * this.tamano()));
}

/** Corta una lista a la página indicada. */
export function paginar<T>(lista: T[], pagina: number, tamano = 10): T[] {
  const inicio = (pagina - 1) * tamano;
  return lista.slice(inicio, inicio + tamano);
}
