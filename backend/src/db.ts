import mysql, { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { configuracion } from './config';

let pool: Pool | null = null;

export function obtenerPool(): Pool {
  if (!pool) {
    const db = configuracion().db;
    pool = mysql.createPool({
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.password,
      database: db.database,
      waitForConnections: true,
      connectionLimit: 10,
      decimalNumbers: false,
      dateStrings: true,
      timezone: 'Z',
    });
  }
  return pool;
}

export async function consultar<T extends RowDataPacket>(
  sql: string,
  parametros: unknown[] = [],
): Promise<T[]> {
  const [filas] = await obtenerPool().query<T[]>(sql, parametros);
  return filas;
}

export async function ejecutar(sql: string, parametros: unknown[] = []): Promise<ResultSetHeader> {
  const [resultado] = await obtenerPool().query<ResultSetHeader>(sql, parametros);
  return resultado;
}

export async function enTransaccion<T>(trabajo: (conexion: PoolConnection) => Promise<T>): Promise<T> {
  const conexion = await obtenerPool().getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await trabajo(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function cerrarPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
