import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { Confirmacion } from './confirmacion';

@Component({
  selector: 'app-dialogo-confirmacion',
  template: `
    <dialog #dialogo class="dialogo" aria-labelledby="dialogo-titulo" aria-describedby="dialogo-mensaje" (cancel)="responder(false, $event)">
      @if (confirmacion.actual(); as solicitud) {
        <div class="dialogo-cuerpo">
          <h2 id="dialogo-titulo">{{ solicitud.titulo }}</h2>
          <p id="dialogo-mensaje">{{ solicitud.mensaje }}</p>
          @if (solicitud.detalle?.length) {
            <dl class="datos">
              @for (fila of solicitud.detalle; track fila.etiqueta) {
                <div><dt>{{ fila.etiqueta }}</dt><dd>{{ fila.valor }}</dd></div>
              }
            </dl>
          }
        </div>
        <div class="dialogo-pie">
          <button type="button" class="boton secundario" (click)="responder(false)" autofocus>Cancelar</button>
          <button type="button" class="boton" [class.peligro]="solicitud.peligro" (click)="responder(true)">{{ solicitud.confirmar }}</button>
        </div>
      }
    </dialog>
  `,
})
export class DialogoConfirmacion {
  readonly confirmacion = inject(Confirmacion);
  private readonly dialogo = viewChild.required<ElementRef<HTMLDialogElement>>('dialogo');

  constructor() {
    effect(() => {
      const elemento = this.dialogo().nativeElement;
      if (this.confirmacion.actual()) {
        if (!elemento.open) {
          elemento.showModal();
        }
      } else if (elemento.open) {
        elemento.close();
      }
    });
  }

  responder(respuesta: boolean, evento?: Event): void {
    evento?.preventDefault();
    this.confirmacion.responder(respuesta);
  }
}
