import { Injectable, signal } from '@angular/core';

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje: string;
  detalle?: { etiqueta: string; valor: string }[];
  confirmar: string;
  peligro?: boolean;
}

interface Solicitud extends OpcionesConfirmacion {
  resolver: (respuesta: boolean) => void;
}

/** Reemplaza window.confirm por un diálogo accesible y con el resumen de la acción. */
@Injectable({ providedIn: 'root' })
export class Confirmacion {
  readonly actual = signal<Solicitud | null>(null);

  pedir(opciones: OpcionesConfirmacion): Promise<boolean> {
    this.actual()?.resolver(false);
    return new Promise((resolver) => this.actual.set({ ...opciones, resolver }));
  }

  responder(respuesta: boolean): void {
    const solicitud = this.actual();
    this.actual.set(null);
    solicitud?.resolver(respuesta);
  }
}
