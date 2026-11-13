import { Injectable, signal } from '@angular/core';
import { RespuestaLogin, UsuarioSesion } from './modelos';

const CLAVE_TOKEN = 'banco.token';
const CLAVE_USUARIO = 'banco.usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly usuario = signal<UsuarioSesion | null>(this.leerUsuario());

  autenticado(): boolean {
    return !!this.token();
  }

  token(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  entrar(respuesta: RespuestaLogin): void {
    localStorage.setItem(CLAVE_TOKEN, respuesta.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
    this.usuario.set(respuesta.usuario);
  }

  salir(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuario.set(null);
  }

  private leerUsuario(): UsuarioSesion | null {
    const texto = localStorage.getItem(CLAVE_USUARIO);
    if (!texto || !localStorage.getItem(CLAVE_TOKEN)) {
      return null;
    }
    try {
      return JSON.parse(texto) as UsuarioSesion;
    } catch {
      return null;
    }
  }
}
