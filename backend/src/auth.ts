import { NextFunction, Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { configuracion } from './config';
import { consultar } from './db';
import { ErrorApp } from './errors';
import { bandera, envolver } from './http';
import { leerCuerpo } from './validacion';
import { z } from 'zod';

export interface UsuarioToken {
  id: number;
  nombreUsuario: string;
  rol: 'administrador' | 'cajero';
  nombreCompleto: string;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

interface FilaUsuario extends RowDataPacket {
  id: number;
  nombre_usuario: string;
  contrasena_hash: string;
  nombre_completo: string;
  rol: 'administrador' | 'cajero';
  activo: number;
}

const esquemaLogin = z.object({
  nombreUsuario: z.string({ required_error: 'El usuario es obligatorio.' }).trim().min(1, 'El usuario es obligatorio.'),
  contrasena: z.string({ required_error: 'La contraseña es obligatoria.' }).min(1, 'La contraseña es obligatoria.'),
});

function firmar(usuario: UsuarioToken): string {
  const opciones: jwt.SignOptions = {
    expiresIn: configuracion().jwtExpira as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(usuario, configuracion().jwtSecreto, opciones);
}

export function exigirAuth(req: Request, _res: Response, next: NextFunction): void {
  const encabezado = req.header('authorization') || '';
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7).trim() : '';
  if (!token) {
    next(new ErrorApp(401, 'Debe iniciar sesión.', 'NO_AUTENTICADO'));
    return;
  }
  try {
    const payload = jwt.verify(token, configuracion().jwtSecreto) as UsuarioToken;
    if (!payload.id || !payload.nombreUsuario || !payload.rol) {
      throw new Error('token incompleto');
    }
    req.usuario = {
      id: payload.id,
      nombreUsuario: payload.nombreUsuario,
      rol: payload.rol,
      nombreCompleto: payload.nombreCompleto,
    };
    next();
  } catch {
    next(new ErrorApp(401, 'La sesión no es válida o expiró.', 'SESION_INVALIDA'));
  }
}

export const routerAuth = Router();

routerAuth.post(
  '/login',
  envolver(async (req, res) => {
    const datos = leerCuerpo(esquemaLogin, req.body);
    const filas = await consultar<FilaUsuario>(
      `SELECT id, nombre_usuario, contrasena_hash, nombre_completo, rol, activo
       FROM usuario WHERE nombre_usuario = ?`,
      [datos.nombreUsuario],
    );
    const usuario = filas[0];
    const coincide =
      usuario && bandera(usuario.activo)
        ? await bcrypt.compare(datos.contrasena, usuario.contrasena_hash)
        : false;
    if (!usuario || !coincide) {
      throw new ErrorApp(401, 'Usuario o contraseña incorrectos.', 'CREDENCIALES_INVALIDAS');
    }
    const publico: UsuarioToken = {
      id: usuario.id,
      nombreUsuario: usuario.nombre_usuario,
      rol: usuario.rol,
      nombreCompleto: usuario.nombre_completo,
    };
    res.json({ token: firmar(publico), usuario: publico });
  }),
);

routerAuth.get(
  '/yo',
  exigirAuth,
  envolver(async (req, res) => {
    res.json({ usuario: req.usuario });
  }),
);

routerAuth.post('/logout', exigirAuth, (_req, res) => {
  res.json({
    mensaje: 'Sesión cerrada. Descarte el token en el navegador; el servidor no lo vuelve a exigir.',
  });
});
