import { Router } from 'express';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { consultar, enTransaccion } from './db';
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

const esquemaTransferencia = z.object({
  cuentaOrigenId: z
    .number({ required_error: 'La cuenta origen es obligatoria.', invalid_type_error: 'La cuenta origen es obligatoria.' })
    .int()
    .positive('La cuenta origen es obligatoria.'),
  cuentaDestinoId: z
    .number({ required_error: 'La cuenta destino es obligatoria.', invalid_type_error: 'La cuenta destino es obligatoria.' })
    .int()
    .positive('La cuenta destino es obligatoria.'),
  monto: z.unknown(),
  concepto: z.union([z.string().trim().max(255, 'El concepto admite 255 caracteres.'), z.literal(''), z.null()]).optional(),
});

export interface TransferenciaDto {
  id: number;
  referencia: string;
  cuentaOrigenId: number;
  numeroCuentaOrigen: string;
  cuentaDestinoId: number;
  numeroCuentaDestino: string;
  monto: number;
  concepto: string | null;
  fecha: string;
  usuarioId: number | null;
}

export async function transferir(
  origenId: number,
  destinoId: number,
  monto: string,
  concepto: string | null,
  usuarioId: number,
): Promise<{ transferencia: TransferenciaDto; movimientoOrigen: MovimientoDto; movimientoDestino: MovimientoDto }> {
  if (origenId === destinoId) {
    throw new ErrorApp(400, 'No se puede transferir hacia la misma cuenta.', 'MISMA_CUENTA');
  }
  return enTransaccion(async (conexion) => {
    const primero = Math.min(origenId, destinoId);
    const segundo = Math.max(origenId, destinoId);
    const bloqueadaA = await bloquearCuenta(conexion, primero);
    const bloqueadaB = await bloquearCuenta(conexion, segundo);
    const origen = bloqueadaA.id === origenId ? bloqueadaA : bloqueadaB;
    const destino = bloqueadaA.id === destinoId ? bloqueadaA : bloqueadaB;
    exigirOperable(origen);
    exigirOperable(destino);
    const anteriorOrigen = aCentavos(origen.saldo);
    const anteriorDestino = aCentavos(destino.saldo);
    const delta = aCentavos(monto);
    if (anteriorOrigen < delta) {
      throw new ErrorApp(400, 'La cuenta origen no tiene saldo suficiente.', 'SALDO_INSUFICIENTE');
    }
    const saldoOrigen = ((anteriorOrigen - delta) / 100).toFixed(2);
    const saldoDestino = ((anteriorDestino + delta) / 100).toFixed(2);
    await conexion.query('UPDATE cuenta SET saldo = ? WHERE id = ?', [saldoOrigen, origen.id]);
    await conexion.query('UPDATE cuenta SET saldo = ? WHERE id = ?', [saldoDestino, destino.id]);
    const temporal = `TMP${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
    const [alta] = await conexion.query<ResultSetHeader>(
      `INSERT INTO transferencia (
         cuenta_origen_id, cuenta_destino_id, usuario_id, monto, referencia, concepto
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [origen.id, destino.id, usuarioId, monto, temporal, concepto],
    );
    const referencia = `TRF-${String(alta.insertId).padStart(8, '0')}`;
    await conexion.query('UPDATE transferencia SET referencia = ? WHERE id = ?', [referencia, alta.insertId]);
    const salidaId = await insertarMovimiento(conexion, {
      cuentaId: origen.id,
      transferenciaId: alta.insertId,
      usuarioId,
      tipo: 'transferencia_salida',
      monto,
      saldoAnterior: (anteriorOrigen / 100).toFixed(2),
      saldoPosterior: saldoOrigen,
      descripcion: concepto ? `Salida: ${concepto}` : `Salida por ${referencia}`,
    });
    const entradaId = await insertarMovimiento(conexion, {
      cuentaId: destino.id,
      transferenciaId: alta.insertId,
      usuarioId,
      tipo: 'transferencia_entrada',
      monto,
      saldoAnterior: (anteriorDestino / 100).toFixed(2),
      saldoPosterior: saldoDestino,
      descripcion: concepto ? `Entrada: ${concepto}` : `Entrada por ${referencia}`,
    });
    const [filas] = await conexion.query<RowDataPacket[]>(
      `SELECT t.id, t.referencia, t.cuenta_origen_id, o.numero_cuenta AS numero_origen,
              t.cuenta_destino_id, d.numero_cuenta AS numero_destino, t.monto, t.concepto,
              t.fecha, t.usuario_id
       FROM transferencia t
       INNER JOIN cuenta o ON o.id = t.cuenta_origen_id
       INNER JOIN cuenta d ON d.id = t.cuenta_destino_id
       WHERE t.id = ?`,
      [alta.insertId],
    );
    const fila = filas[0];
    return {
      transferencia: {
        id: fila.id,
        referencia: fila.referencia,
        cuentaOrigenId: fila.cuenta_origen_id,
        numeroCuentaOrigen: fila.numero_origen,
        cuentaDestinoId: fila.cuenta_destino_id,
        numeroCuentaDestino: fila.numero_destino,
        monto: dinero(fila.monto),
        concepto: fila.concepto,
        fecha: fila.fecha,
        usuarioId: fila.usuario_id,
      },
      movimientoOrigen: await leerMovimiento(conexion, salidaId),
      movimientoDestino: await leerMovimiento(conexion, entradaId),
    };
  });
}

export async function operarCuenta(
  cuentaId: number,
  monto: string,
  tipo: 'deposito' | 'retiro',
  descripcion: string,
  usuarioId: number,
): Promise<MovimientoDto> {
  return enTransaccion(async (conexion) => {
    const cuenta = await bloquearCuenta(conexion, cuentaId);
    return aplicarSaldo(conexion, cuenta, monto, tipo === 'deposito' ? 1 : -1, usuarioId, tipo, descripcion);
  });
}

export const routerDepositos = Router();
export const routerRetiros = Router();
export const routerTransferencias = Router();

routerDepositos.post(
  '/',
  envolver(async (req, res) => {
    const datos = leerCuerpo(esquemaOperacion, req.body);
    const monto = leerMonto(datos.monto);
    const descripcion = datos.descripcion ? datos.descripcion : 'Depósito en ventanilla';
    const movimiento = await operarCuenta(datos.cuentaId, monto, 'deposito', descripcion, req.usuario!.id);
    res.status(201).json({ movimiento });
  }),
);

routerRetiros.post(
  '/',
  envolver(async (req, res) => {
    const datos = leerCuerpo(esquemaOperacion, req.body);
    const monto = leerMonto(datos.monto);
    const descripcion = datos.descripcion ? datos.descripcion : 'Retiro en ventanilla';
    const movimiento = await operarCuenta(datos.cuentaId, monto, 'retiro', descripcion, req.usuario!.id);
    res.status(201).json({ movimiento });
  }),
);

routerTransferencias.get(
  '/',
  envolver(async (_req, res) => {
    const filas = await consultar<RowDataPacket>(
      `SELECT t.id, t.referencia, t.cuenta_origen_id, o.numero_cuenta AS numero_origen,
              t.cuenta_destino_id, d.numero_cuenta AS numero_destino, t.monto, t.concepto,
              t.fecha, t.usuario_id
       FROM transferencia t
       INNER JOIN cuenta o ON o.id = t.cuenta_origen_id
       INNER JOIN cuenta d ON d.id = t.cuenta_destino_id
       ORDER BY t.fecha DESC, t.id DESC
       LIMIT 200`,
    );
    res.json(
      filas.map((fila) => ({
        id: fila.id,
        referencia: fila.referencia,
        cuentaOrigenId: fila.cuenta_origen_id,
        numeroCuentaOrigen: fila.numero_origen,
        cuentaDestinoId: fila.cuenta_destino_id,
        numeroCuentaDestino: fila.numero_destino,
        monto: dinero(fila.monto),
        concepto: fila.concepto,
        fecha: fila.fecha,
        usuarioId: fila.usuario_id,
      })),
    );
  }),
);

routerTransferencias.post(
  '/',
  envolver(async (req, res) => {
    const datos = leerCuerpo(esquemaTransferencia, req.body);
    const monto = leerMonto(datos.monto);
    const concepto = datos.concepto ? datos.concepto : null;
    const resultado = await transferir(datos.cuentaOrigenId, datos.cuentaDestinoId, monto, concepto, req.usuario!.id);
    res.status(201).json(resultado);
  }),
);
