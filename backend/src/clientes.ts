import { Router } from 'express';
import { RowDataPacket } from 'mysql2';
import { consultar, ejecutar } from './db';
import { ErrorApp, traducirDuplicado } from './errors';
import { bandera, codigoTemporal, dinero, enteroPositivo, envolver } from './http';
import { esquemaCliente, leerCuerpo } from './validacion';

type DatosCliente = {
  identificacion: string;
  nombres: string;
  apellidos: string;
  correo: string;
  fechaNacimiento?: string | null;
  telefono?: string | null;
  direccion?: string | null;
};

interface FilaCliente extends RowDataPacket {
  id: number;
  codigo: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  correo: string;
  direccion: string | null;
  activo: number;
  fecha_registro: string;
}

export interface ClienteDto {
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

export function aCliente(fila: FilaCliente): ClienteDto {
  return {
    id: fila.id,
    codigo: fila.codigo,
    identificacion: fila.identificacion,
    nombres: fila.nombres,
    apellidos: fila.apellidos,
    fechaNacimiento: fila.fecha_nacimiento,
    telefono: fila.telefono,
    correo: fila.correo,
    direccion: fila.direccion,
    activo: bandera(fila.activo),
    fechaRegistro: fila.fecha_registro,
  };
}

const SQL_CLIENTE = `
  SELECT id, codigo, identificacion, nombres, apellidos, fecha_nacimiento,
         telefono, correo, direccion, activo, fecha_registro
  FROM cliente
`;

export async function obtenerCliente(id: number): Promise<ClienteDto> {
  const filas = await consultar<FilaCliente>(`${SQL_CLIENTE} WHERE id = ?`, [id]);
  const fila = filas[0];
  if (!fila) {
    throw new ErrorApp(404, 'El cliente no existe.', 'CLIENTE_NO_ENCONTRADO');
  }
  return aCliente(fila);
}

async function guardar(datos: DatosCliente, idExistente?: number): Promise<ClienteDto> {
  const parametros = [
    datos.identificacion,
    datos.nombres,
    datos.apellidos,
    datos.fechaNacimiento ?? null,
    datos.telefono ?? null,
    datos.correo,
    datos.direccion ?? null,
  ];
  try {
    if (idExistente) {
      await ejecutar(
        `UPDATE cliente
         SET identificacion = ?, nombres = ?, apellidos = ?, fecha_nacimiento = ?,
             telefono = ?, correo = ?, direccion = ?
         WHERE id = ?`,
        [...parametros, idExistente],
      );
      return obtenerCliente(idExistente);
    }
    const temporal = codigoTemporal('TMP');
    const resultado = await ejecutar(
      `INSERT INTO cliente (
         codigo, identificacion, nombres, apellidos, fecha_nacimiento, telefono, correo, direccion
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [temporal, ...parametros],
    );
    const codigo = `CLI-${String(resultado.insertId).padStart(4, '0')}`;
    await ejecutar('UPDATE cliente SET codigo = ? WHERE id = ?', [codigo, resultado.insertId]);
    return obtenerCliente(resultado.insertId);
  } catch (error) {
    traducirDuplicado(error);
  }
}

export const routerClientes = Router();

routerClientes.get(
  '/',
  envolver(async (req, res) => {
    const q = String(req.query.q || '').trim();
    const filas = await consultar<FilaCliente>(
      `${SQL_CLIENTE}
       WHERE (? = '' OR CONCAT(codigo, ' ', identificacion, ' ', nombres, ' ', apellidos, ' ', correo) LIKE ?)
       ORDER BY id DESC`,
      [q, `%${q}%`],
    );
    res.json(filas.map(aCliente));
  }),
);

routerClientes.get(
  '/:id',
  envolver(async (req, res) => {
    res.json(await obtenerCliente(enteroPositivo(req.params.id, 'El cliente')));
  }),
);

routerClientes.post(
  '/',
  envolver(async (req, res) => {
    const datos = leerCuerpo(esquemaCliente, req.body);
    const cliente = await guardar(datos);
    res.status(201).json(cliente);
  }),
);

routerClientes.put(
  '/:id',
  envolver(async (req, res) => {
    const id = enteroPositivo(req.params.id, 'El cliente');
    await obtenerCliente(id);
    const datos = leerCuerpo(esquemaCliente, req.body);
    res.json(await guardar(datos, id));
  }),
);

async function cambiarActivo(id: number, activo: boolean): Promise<ClienteDto> {
  const actual = await obtenerCliente(id);
  if (actual.activo === activo) {
    throw new ErrorApp(
      400,
      activo ? 'El cliente ya está activo.' : 'El cliente ya está desactivado.',
      activo ? 'CLIENTE_YA_ACTIVO' : 'CLIENTE_YA_INACTIVO',
    );
  }
  await ejecutar('UPDATE cliente SET activo = ? WHERE id = ?', [activo ? 1 : 0, id]);
  return obtenerCliente(id);
}

routerClientes.patch(
  '/:id/desactivar',
  envolver(async (req, res) => {
    res.json(await cambiarActivo(enteroPositivo(req.params.id, 'El cliente'), false));
  }),
);

routerClientes.patch(
  '/:id/activar',
  envolver(async (req, res) => {
    res.json(await cambiarActivo(enteroPositivo(req.params.id, 'El cliente'), true));
  }),
);

routerClientes.delete(
  '/:id',
  envolver(async (req, res) => {
    const cliente = await cambiarActivo(enteroPositivo(req.params.id, 'El cliente'), false);
    res.json({ mensaje: 'Cliente desactivado. El historial se conserva.', cliente });
  }),
);

export async function resumenClientes(): Promise<{ activos: number; inactivos: number }> {
  const filas = await consultar<RowDataPacket & { activos: number; inactivos: number }>(
    `SELECT
       SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) AS activos,
       SUM(CASE WHEN activo = 0 THEN 1 ELSE 0 END) AS inactivos
     FROM cliente`,
  );
  return {
    activos: dinero(filas[0]?.activos),
    inactivos: dinero(filas[0]?.inactivos),
  };
}
