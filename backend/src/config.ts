import dotenv from 'dotenv';

dotenv.config();

export interface Configuracion {
  puerto: number;
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  jwtSecreto: string;
  jwtExpira: string;
}

export function configuracion(): Configuracion {
  return {
    puerto: Number(process.env.PORT || 3000),
    db: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'banco_app',
      password: process.env.DB_PASSWORD || 'BancoFicticio123!',
      database: process.env.DB_NAME || 'banco_academico',
    },
    jwtSecreto: process.env.JWT_SECRET || 'clave-ficticia-academica-sistema-bancario',
    jwtExpira: process.env.JWT_EXPIRES_IN || '8h',
  };
}
