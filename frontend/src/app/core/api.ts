import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Cliente,
  Consulta,
  Cuenta,
  Movimiento,
  Reporte,
  RespuestaLogin,
  TipoCuenta,
  TransferenciaResultado,
} from './modelos';

// Ruta relativa: en desarrollo el proxy de Angular (proxy.conf.json) la envía al backend del puerto 3000.
const BASE = '/api';

@Injectable({ providedIn: 'root' })
export class Api {
  private readonly http = inject(HttpClient);

  login(nombreUsuario: string, contrasena: string): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${BASE}/auth/login`, { nombreUsuario, contrasena });
  }

  logout(): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${BASE}/auth/logout`, {});
  }

  clientes(q = ''): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${BASE}/clientes`, { params: { q } });
  }

  cliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${BASE}/clientes/${id}`);
  }

  crearCliente(datos: Partial<Cliente>): Observable<Cliente> {
    return this.http.post<Cliente>(`${BASE}/clientes`, datos);
  }

  actualizarCliente(id: number, datos: Partial<Cliente>): Observable<Cliente> {
    return this.http.put<Cliente>(`${BASE}/clientes/${id}`, datos);
  }

  desactivarCliente(id: number): Observable<Cliente> {
    return this.http.patch<Cliente>(`${BASE}/clientes/${id}/desactivar`, {});
  }

  activarCliente(id: number): Observable<Cliente> {
    return this.http.patch<Cliente>(`${BASE}/clientes/${id}/activar`, {});
  }

  tiposCuenta(): Observable<TipoCuenta[]> {
    return this.http.get<TipoCuenta[]>(`${BASE}/tipos-cuenta`);
  }

  cuentas(q = '', clienteId?: number): Observable<Cuenta[]> {
    let params = new HttpParams().set('q', q);
    if (clienteId) {
      params = params.set('clienteId', String(clienteId));
    }
    return this.http.get<Cuenta[]>(`${BASE}/cuentas`, { params });
  }

  cuenta(id: number): Observable<Cuenta> {
    return this.http.get<Cuenta>(`${BASE}/cuentas/${id}`);
  }

  crearCuenta(clienteId: number, tipoCuentaId: number): Observable<Cuenta> {
    return this.http.post<Cuenta>(`${BASE}/cuentas`, { clienteId, tipoCuentaId });
  }

  cambiarEstado(id: number, estado: 'activa' | 'inactiva'): Observable<Cuenta> {
    return this.http.patch<Cuenta>(`${BASE}/cuentas/${id}/estado`, { estado });
  }

  depositar(cuentaId: number, monto: number, descripcion: string): Observable<{ movimiento: Movimiento }> {
    return this.http.post<{ movimiento: Movimiento }>(`${BASE}/depositos`, { cuentaId, monto, descripcion });
  }

  retirar(cuentaId: number, monto: number, descripcion: string): Observable<{ movimiento: Movimiento }> {
    return this.http.post<{ movimiento: Movimiento }>(`${BASE}/retiros`, { cuentaId, monto, descripcion });
  }

  transferir(
    cuentaOrigenId: number,
    cuentaDestinoId: number,
    monto: number,
    concepto: string,
  ): Observable<TransferenciaResultado> {
    return this.http.post<TransferenciaResultado>(`${BASE}/transferencias`, {
      cuentaOrigenId,
      cuentaDestinoId,
      monto,
      concepto,
    });
  }

  movimientos(cuentaId?: number, desde?: string, hasta?: string): Observable<Movimiento[]> {
    let params = new HttpParams();
    if (cuentaId) {
      params = params.set('cuentaId', String(cuentaId));
    }
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.http.get<Movimiento[]>(`${BASE}/movimientos`, { params });
  }

  consultar(q: string): Observable<Consulta> {
    return this.http.get<Consulta>(`${BASE}/consultas`, { params: { q } });
  }

  reporte(desde?: string, hasta?: string): Observable<Reporte> {
    let params = new HttpParams();
    if (desde) {
      params = params.set('desde', desde);
    }
    if (hasta) {
      params = params.set('hasta', hasta);
    }
    return this.http.get<Reporte>(`${BASE}/reportes/operaciones`, { params });
  }
}
