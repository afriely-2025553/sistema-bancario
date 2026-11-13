export interface UsuarioSesion {
  id: number;
  nombreUsuario: string;
  rol: 'administrador' | 'cajero';
  nombreCompleto: string;
}

export interface RespuestaLogin {
  token: string;
  usuario: UsuarioSesion;
}

export interface Cliente {
  id: number;
  codigo: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null;
  telefono: string | null;
  correo: string;
  direccion: string | null;
  activo: boolean;
  fechaRegistro: string;
}

export interface TipoCuenta {
  id: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface Cuenta {
  id: number;
  numeroCuenta: string;
  clienteId: number;
  clienteCodigo: string;
  clienteNombre: string;
  clienteActivo: boolean;
  tipoCuentaId: number;
  tipoCuenta: string;
  saldo: number;
  estado: 'activa' | 'inactiva';
  fechaApertura: string;
}

export interface Movimiento {
  id: number;
  cuentaId: number;
  numeroCuenta: string;
  transferenciaId: number | null;
  referencia: string | null;
  cuentaContraparte: string | null;
  usuarioId: number | null;
  tipo: 'deposito' | 'retiro' | 'transferencia_salida' | 'transferencia_entrada';
  monto: number;
  saldoAnterior: number;
  saldoPosterior: number;
  descripcion: string | null;
  fecha: string;
}

export interface TransferenciaResultado {
  transferencia: {
    id: number;
    referencia: string;
    cuentaOrigenId: number;
    numeroCuentaOrigen: string;
    cuentaDestinoId: number;
    numeroCuentaDestino: string;
    monto: number;
    concepto: string | null;
    fecha: string;
  };
  movimientoOrigen: Movimiento;
  movimientoDestino: Movimiento;
}

export interface Reporte {
  periodo: { desde: string | null; hasta: string | null };
  depositos: { cantidad: number; monto: number };
  retiros: { cantidad: number; monto: number };
  transferencias: { cantidad: number; monto: number };
  cuentas: { activas: number; inactivas: number; saldoTotal: number };
  clientes: { activos: number; inactivos: number };
  ultimasOperaciones: Movimiento[];
}

export interface Consulta {
  criterio: string;
  clientes: Cliente[];
  cuentas: Cuenta[];
}

const FORMATO_MONEDA = new Intl.NumberFormat('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Monto en quetzales con separador de miles y dos decimales: «Q 1,500.00». */
export function moneda(valor: number | null | undefined): string {
  return `Q\u00a0${FORMATO_MONEDA.format(Number(valor ?? 0))}`;
}

/** Fecha «dd/mm/aaaa» u «dd/mm/aaaa hh:mm» (24 h) a partir de «AAAA-MM-DD[ HH:MM:SS]» o ISO. */
export function fecha(valor: string | null | undefined, conHora = true): string {
  if (!valor) {
    return '—';
  }
  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(valor);
  if (!partes) {
    return valor;
  }
  const [, anio, mes, dia, hora, minuto] = partes;
  const base = `${dia}/${mes}/${anio}`;
  return conHora && hora ? `${base} ${hora}:${minuto}` : base;
}

export function soloFecha(valor: string | null | undefined): string {
  return fecha(valor, false);
}

export function hoyIso(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

export function etiquetaTipo(tipo: Movimiento['tipo']): string {
  const etiquetas: Record<Movimiento['tipo'], string> = {
    deposito: 'Depósito',
    retiro: 'Retiro',
    transferencia_salida: 'Transferencia enviada',
    transferencia_entrada: 'Transferencia recibida',
  };
  return etiquetas[tipo];
}

/** Depósitos y transferencias recibidas suman al saldo; retiros y enviadas restan. */
export function esEntrada(tipo: Movimiento['tipo']): boolean {
  return tipo === 'deposito' || tipo === 'transferencia_entrada';
}

export function montoConSigno(movimiento: Movimiento): string {
  return `${esEntrada(movimiento.tipo) ? '+' : '−'}${moneda(movimiento.monto)}`;
}

export function etiquetaRol(rol: UsuarioSesion['rol']): string {
  return rol === 'administrador' ? 'Administrador' : 'Cajero';
}

export function nombreCliente(cliente: Pick<Cliente, 'nombres' | 'apellidos'>): string {
  return `${cliente.nombres} ${cliente.apellidos}`;
}

export function operable(cuenta: Cuenta): boolean {
  return cuenta.estado === 'activa' && cuenta.clienteActivo;
}

/** Minúsculas y sin tildes, para comparar búsquedas. */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Fecha y hora local actuales en formato «AAAA-MM-DD HH:MM». */
export function ahoraLocal(): string {
  const ahora = new Date();
  const hora = String(ahora.getHours()).padStart(2, '0');
  const minuto = String(ahora.getMinutes()).padStart(2, '0');
  return `${hoyIso()} ${hora}:${minuto}`;
}

/** «1 operación», «3 operaciones». */
export function plural(cantidad: number, singular: string, varios: string): string {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`;
}
