import { Injectable, signal } from '@angular/core';

export interface Aviso {
  id: number;
  tipo: 'ok' | 'error' | 'info';
  texto: string;
}

/** Mensajes breves que sobreviven a la navegación (por ejemplo, «Cliente registrado»). */
@Injectable({ providedIn: 'root' })
export class Avisos {
  readonly lista = signal<Aviso[]>([]);
  private siguiente = 1;

  mostrar(texto: string, tipo: Aviso['tipo'] = 'ok'): void {
    const id = this.siguiente++;
    this.lista.update((actual) => [...actual, { id, tipo, texto }]);
    setTimeout(() => this.cerrar(id), 6000);
  }

  cerrar(id: number): void {
    this.lista.update((actual) => actual.filter((aviso) => aviso.id !== id));
  }
}
