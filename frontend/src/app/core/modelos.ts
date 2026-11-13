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

export function moneda(valor: number): string {
  const texto = new Intl.NumberFormat('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
  return `Q ${texto}`;
}

export function fecha(valor: string | null | undefined): string {
  if (!valor) {
    return '—';
  }
  const normalizada = valor.includes('T') ? valor : valor.replace(' ', 'T');
  const instante = new Date(normalizada);
  if (Number.isNaN(instante.getTime())) {
    return valor;
  }
  const conHora = valor.length > 10;
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: conHora ? 'short' : undefined,
  }).format(instante);
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

export function etiquetaRol(rol: UsuarioSesion['rol']): string {
  return rol === 'administrador' ? 'Administrador' : 'Cajero';
}
