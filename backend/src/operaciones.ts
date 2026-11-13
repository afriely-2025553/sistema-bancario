import { Router } from 'express';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { enTransaccion } from './db';
import { ErrorApp } from './errors';
import { bandera, dinero, envolver } from './http';
import { aCentavos, leerCuerpo, leerMonto } from './validacion';
import { z } from 'zod';

interface CuentaBloqueada extends RowDataPacket {
  id: number;
  numero_cuenta: string;
  saldo: string;
  estado: 'activa' | 'inactiva';
  cliente_activo: number;
}

export interface MovimientoDto {
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

const esquemaOperacion = z.object({
  cuentaId: z
    .number({ required_error: 'La cuenta es obligatoria.', invalid_type_error: 'La cuenta es obligatoria.' })
    .int()
    .positive('La cuenta es obligatoria.'),
  monto: z.unknown(),
  descripcion: z.union([z.string().trim().max(255, 'La descripción admite 255 caracteres.'), z.literal(''), z.null()]).optional(),
});

async function bloquearCuenta(conexion: PoolConnection, id: number): Promise<CuentaBloqueada> {
  const [filas] = await conexion.query<CuentaBloqueada[]>(
    `SELECT c.id, c.numero_cuenta, c.saldo, c.estado, cl.activo AS cliente_activo
     FROM cuenta c
     INNER JOIN cliente cl ON cl.id = c.cliente_id
     WHERE c.id = ?
     FOR UPDATE`,
    [id],
  );
  const cuenta = filas[0];
  if (!cuenta) {
    throw new ErrorApp(404, 'La cuenta no existe.', 'CUENTA_NO_ENCONTRADA');
  }
  return cuenta;
}

function exigirOperable(cuenta: CuentaBloqueada): void {
  if (cuenta.estado !== 'activa') {
    throw new ErrorApp(400, 'La cuenta está inactiva y no puede operar.', 'CUENTA_INACTIVA');
  }
  if (!bandera(cuenta.cliente_activo)) {
    throw new ErrorApp(400, 'El cliente está inactivo y sus cuentas no pueden operar.', 'CLIENTE_INACTIVO');
  }
}

async function insertarMovimiento(
  conexion: PoolConnection,
  datos: {
    cuentaId: number;
    transferenciaId: number | null;
    usuarioId: number;
    tipo: MovimientoDto['tipo'];
    monto: string;
    saldoAnterior: string;
    saldoPosterior: string;
    descripcion: string | null;
  },
): Promise<number> {
  const [resultado] = await conexion.query<ResultSetHeader>(
    `INSERT INTO movimiento (
       cuenta_id, transferencia_id, usuario_id, tipo, monto,
       saldo_anterior, saldo_posterior, descripcion
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.cuentaId,
      datos.transferenciaId,
      datos.usuarioId,
      datos.tipo,
      datos.monto,
      datos.saldoAnterior,
      datos.saldoPosterior,
      datos.descripcion,
    ],
  );
  return resultado.insertId;
}

async function leerMovimiento(conexion: PoolConnection, id: number): Promise<MovimientoDto> {
  const [filas] = await conexion.query<RowDataPacket[]>(
    `SELECT m.id, m.cuenta_id, c.numero_cuenta, m.transferencia_id, t.referencia,
            CASE
              WHEN m.tipo = 'transferencia_salida' THEN dest.numero_cuenta
              WHEN m.tipo = 'transferencia_entrada' THEN orig.numero_cuenta
              ELSE NULL
            END AS cuenta_contraparte,
            m.usuario_id, m.tipo, m.monto, m.saldo_anterior, m.saldo_posterior,
            m.descripcion, m.fecha
     FROM movimiento m
     INNER JOIN cuenta c ON c.id = m.cuenta_id
     LEFT JOIN transferencia t ON t.id = m.transferencia_id
     LEFT JOIN cuenta orig ON orig.id = t.cuenta_origen_id
     LEFT JOIN cuenta dest ON dest.id = t.cuenta_destino_id
     WHERE m.id = ?`,
    [id],
  );
  const fila = filas[0];
  if (!fila) {
    throw new ErrorApp(500, 'No se pudo leer el movimiento recién creado.', 'MOVIMIENTO_NO_LEIDO');
  }
  return {
    id: fila.id,
    cuentaId: fila.cuenta_id,
    numeroCuenta: fila.numero_cuenta,
    transferenciaId: fila.transferencia_id,
    referencia: fila.referencia,
    cuentaContraparte: fila.cuenta_contraparte,
    usuarioId: fila.usuario_id,
    tipo: fila.tipo,
    monto: dinero(fila.monto),
    saldoAnterior: dinero(fila.saldo_anterior),
    saldoPosterior: dinero(fila.saldo_posterior),
    descripcion: fila.descripcion,
    fecha: fila.fecha,
  };
}

async function aplicarSaldo(
  conexion: PoolConnection,
  cuenta: CuentaBloqueada,
  monto: string,
  signo: 1 | -1,
  usuarioId: number,
  tipo: 'deposito' | 'retiro',
  descripcion: string | null,
): Promise<MovimientoDto> {
  exigirOperable(cuenta);
  const anterior = aCentavos(cuenta.saldo);
  const delta = aCentavos(monto);
  const posterior = anterior + signo * delta;
  if (posterior < 0) {
    throw new ErrorApp(400, 'El retiro supera el saldo disponible.', 'SALDO_INSUFICIENTE');
  }
  const saldoAnterior = (anterior / 100).toFixed(2);
  const saldoPosterior = (posterior / 100).toFixed(2);
  await conexion.query('UPDATE cuenta SET saldo = ? WHERE id = ?', [saldoPosterior, cuenta.id]);
  const movimientoId = await insertarMovimiento(conexion, {
    cuentaId: cuenta.id,
    transferenciaId: null,
    usuarioId,
    tipo,
    monto,
    saldoAnterior,
    saldoPosterior,
    descripcion,
  });
  return leerMovimiento(conexion, movimientoId);
}

export const routerDepositos = Router();
export const routerRetiros = Router();

routerDepositos.post(
  '/',
  envolver(async (req, res) => {
    const datos = leerCuerpo(esquemaOperacion, req.body);
    const monto = leerMonto(datos.monto);
    const descripcion = datos.descripcion ? datos.descripcion : 'Depósito en ventanilla';
    const movimiento = await enTransaccion(async (conexion) => {
      const cuenta = await bloquearCuenta(conexion, datos.cuentaId);
      return aplicarSaldo(conexion, cuenta, monto, 1, req.usuario!.id, 'deposito', descripcion);
    });
    res.status(201).json({ movimiento });
  }),
);

routerRetiros.post(
  '/',
  envolver(async (req, res) => {
    const datos = leerCuerpo(esquemaOperacion, req.body);
    const monto = leerMonto(datos.monto);
    const descripcion = datos.descripcion ? datos.descripcion : 'Retiro en ventanilla';
    const movimiento = await enTransaccion(async (conexion) => {
      const cuenta = await bloquearCuenta(conexion, datos.cuentaId);
      return aplicarSaldo(conexion, cuenta, monto, -1, req.usuario!.id, 'retiro', descripcion);
    });
    res.status(201).json({ movimiento });
  }),
);
