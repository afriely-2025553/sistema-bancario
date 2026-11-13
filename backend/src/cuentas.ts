import { Router } from 'express';
import { RowDataPacket } from 'mysql2';
import { consultar, ejecutar } from './db';
import { ErrorApp } from './errors';
import { bandera, codigoTemporal, dinero, enteroPositivo, envolver } from './http';
import { esquemaCuentaNueva, esquemaEstadoCuenta, leerCuerpo } from './validacion';

interface FilaCuenta extends RowDataPacket {
  id: number;
  numero_cuenta: string;
  cliente_id: number;
  cliente_codigo: string;
  cliente_nombre: string;
  cliente_activo: number;
  tipo_cuenta_id: number;
  tipo_cuenta: string;
  saldo: string;
  estado: 'activa' | 'inactiva';
  fecha_apertura: string;
}

export interface CuentaDto {
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

const SQL_CUENTA = `
  SELECT c.id, c.numero_cuenta, c.cliente_id, cl.codigo AS cliente_codigo,
         CONCAT(cl.nombres, ' ', cl.apellidos) AS cliente_nombre,
         cl.activo AS cliente_activo, c.tipo_cuenta_id, tc.nombre AS tipo_cuenta,
         c.saldo, c.estado, c.fecha_apertura
  FROM cuenta c
  INNER JOIN cliente cl ON cl.id = c.cliente_id
  INNER JOIN tipo_cuenta tc ON tc.id = c.tipo_cuenta_id
`;

export function aCuenta(fila: FilaCuenta): CuentaDto {
  return {
    id: fila.id,
    numeroCuenta: fila.numero_cuenta,
    clienteId: fila.cliente_id,
    clienteCodigo: fila.cliente_codigo,
    clienteNombre: fila.cliente_nombre,
    clienteActivo: bandera(fila.cliente_activo),
    tipoCuentaId: fila.tipo_cuenta_id,
    tipoCuenta: fila.tipo_cuenta,
    saldo: dinero(fila.saldo),
    estado: fila.estado,
    fechaApertura: fila.fecha_apertura,
  };
}

export async function obtenerCuenta(id: number): Promise<CuentaDto> {
  const filas = await consultar<FilaCuenta>(`${SQL_CUENTA} WHERE c.id = ?`, [id]);
  const fila = filas[0];
  if (!fila) {
    throw new ErrorApp(404, 'La cuenta no existe.', 'CUENTA_NO_ENCONTRADA');
  }
  return aCuenta(fila);
}

export const routerCuentas = Router();

routerCuentas.get(
  '/',
  envolver(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const clienteId = req.query.clienteId ? enteroPositivo(String(req.query.clienteId), 'El cliente') : null;
    const filas = await consultar<FilaCuenta>(
      `${SQL_CUENTA}
       WHERE (? IS NULL OR c.cliente_id = ?)
         AND (? = '' OR CONCAT(c.numero_cuenta, ' ', cl.codigo, ' ', cl.nombres, ' ', cl.apellidos, ' ', cl.identificacion) LIKE ?)
       ORDER BY c.id DESC`,
      [clienteId, clienteId, q, `%${q}%`],
    );
    res.json(filas.map(aCuenta));
  }),
);

routerCuentas.get(
  '/:id',
  envolver(async (req, res) => {
    res.json(await obtenerCuenta(enteroPositivo(req.params.id, 'La cuenta')));
  }),
);

routerCuentas.get(
  '/:id/saldo',
  envolver(async (req, res) => {
    const cuenta = await obtenerCuenta(enteroPositivo(req.params.id, 'La cuenta'));
    res.json({
      cuentaId: cuenta.id,
      numeroCuenta: cuenta.numeroCuenta,
      clienteNombre: cuenta.clienteNombre,
      saldo: cuenta.saldo,
      estado: cuenta.estado,
    });
  }),
);

routerCuentas.post(
  '/',
  envolver(async (req, res) => {
    const datos = leerCuerpo(esquemaCuentaNueva, req.body);
    const clientes = await consultar<RowDataPacket & { activo: number }>(
      'SELECT id, activo FROM cliente WHERE id = ?',
      [datos.clienteId],
    );
    if (!clientes[0]) {
      throw new ErrorApp(404, 'El cliente no existe.', 'CLIENTE_NO_ENCONTRADO');
    }
    if (!bandera(clientes[0].activo)) {
      throw new ErrorApp(400, 'No se puede abrir una cuenta a un cliente desactivado.', 'CLIENTE_INACTIVO');
    }
    const tipos = await consultar<RowDataPacket & { activo: number }>(
      'SELECT id, activo FROM tipo_cuenta WHERE id = ?',
      [datos.tipoCuentaId],
    );
    if (!tipos[0] || !bandera(tipos[0].activo)) {
      throw new ErrorApp(400, 'El tipo de cuenta no está disponible.', 'TIPO_CUENTA_INVALIDO');
    }
    const temporal = codigoTemporal('TMP');
    const resultado = await ejecutar(
      `INSERT INTO cuenta (numero_cuenta, cliente_id, tipo_cuenta_id, saldo, estado)
       VALUES (?, ?, ?, 0.00, 'activa')`,
      [temporal, datos.clienteId, datos.tipoCuentaId],
    );
    const numero = `100-${String(resultado.insertId).padStart(8, '0')}`;
    await ejecutar('UPDATE cuenta SET numero_cuenta = ? WHERE id = ?', [numero, resultado.insertId]);
    res.status(201).json(await obtenerCuenta(resultado.insertId));
  }),
);

routerCuentas.patch(
  '/:id/estado',
  envolver(async (req, res) => {
    const id = enteroPositivo(req.params.id, 'La cuenta');
    await obtenerCuenta(id);
    const datos = leerCuerpo(esquemaEstadoCuenta, req.body);
    await ejecutar('UPDATE cuenta SET estado = ? WHERE id = ?', [datos.estado, id]);
    res.json(await obtenerCuenta(id));
  }),
);

export const routerTiposCuenta = Router();

routerTiposCuenta.get(
  '/',
  envolver(async (_req, res) => {
    const filas = await consultar<RowDataPacket & { id: number; nombre: string; descripcion: string; activo: number }>(
      'SELECT id, nombre, descripcion, activo FROM tipo_cuenta ORDER BY id',
    );
    res.json(
      filas.map((fila) => ({
        id: fila.id,
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        activo: bandera(fila.activo),
      })),
    );
  }),
);
