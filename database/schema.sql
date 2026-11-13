-- Esquema del sistema bancario académico.
-- Usar únicamente con datos ficticios.
-- Ejecutar sobre la base ya seleccionada, por ejemplo:
--   mysql -u banco_app -p banco_academico < database/schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS movimiento;
DROP TABLE IF EXISTS transferencia;
DROP TABLE IF EXISTS cuenta;
DROP TABLE IF EXISTS usuario;
DROP TABLE IF EXISTS cliente;
DROP TABLE IF EXISTS tipo_cuenta;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE tipo_cuenta (
  id INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_tipo_cuenta_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cliente (
  id INT NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(20) NOT NULL,
  identificacion VARCHAR(30) NOT NULL,
  nombres VARCHAR(80) NOT NULL,
  apellidos VARCHAR(80) NOT NULL,
  fecha_nacimiento DATE NULL,
  telefono VARCHAR(20) NULL,
  correo VARCHAR(150) NOT NULL,
  direccion VARCHAR(255) NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cliente_codigo (codigo),
  UNIQUE KEY uk_cliente_identificacion (identificacion),
  UNIQUE KEY uk_cliente_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuario (
  id INT NOT NULL AUTO_INCREMENT,
  nombre_usuario VARCHAR(50) NOT NULL,
  contrasena_hash VARCHAR(255) NOT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  rol ENUM('administrador', 'cajero') NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuario_nombre (nombre_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cuenta (
  id INT NOT NULL AUTO_INCREMENT,
  numero_cuenta VARCHAR(20) NOT NULL,
  cliente_id INT NOT NULL,
  tipo_cuenta_id INT NOT NULL,
  saldo DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  estado ENUM('activa', 'inactiva') NOT NULL DEFAULT 'activa',
  fecha_apertura DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cuenta_numero (numero_cuenta),
  KEY idx_cuenta_cliente (cliente_id),
  KEY idx_cuenta_tipo (tipo_cuenta_id),
  CONSTRAINT fk_cuenta_cliente FOREIGN KEY (cliente_id) REFERENCES cliente (id),
  CONSTRAINT fk_cuenta_tipo FOREIGN KEY (tipo_cuenta_id) REFERENCES tipo_cuenta (id),
  CONSTRAINT ck_cuenta_saldo CHECK (saldo >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE transferencia (
  id INT NOT NULL AUTO_INCREMENT,
  cuenta_origen_id INT NOT NULL,
  cuenta_destino_id INT NOT NULL,
  usuario_id INT NULL,
  monto DECIMAL(15,2) NOT NULL,
  referencia VARCHAR(40) NOT NULL,
  concepto VARCHAR(255) NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_transferencia_referencia (referencia),
  KEY idx_transferencia_origen (cuenta_origen_id),
  KEY idx_transferencia_destino (cuenta_destino_id),
  KEY idx_transferencia_usuario (usuario_id),
  CONSTRAINT fk_transferencia_origen FOREIGN KEY (cuenta_origen_id) REFERENCES cuenta (id),
  CONSTRAINT fk_transferencia_destino FOREIGN KEY (cuenta_destino_id) REFERENCES cuenta (id),
  CONSTRAINT fk_transferencia_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  CONSTRAINT ck_transferencia_monto CHECK (monto > 0),
  CONSTRAINT ck_transferencia_cuentas CHECK (cuenta_origen_id <> cuenta_destino_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE movimiento (
  id INT NOT NULL AUTO_INCREMENT,
  cuenta_id INT NOT NULL,
  transferencia_id INT NULL,
  usuario_id INT NULL,
  tipo ENUM('deposito', 'retiro', 'transferencia_salida', 'transferencia_entrada') NOT NULL,
  monto DECIMAL(15,2) NOT NULL,
  saldo_anterior DECIMAL(15,2) NOT NULL,
  saldo_posterior DECIMAL(15,2) NOT NULL,
  descripcion VARCHAR(255) NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimiento_cuenta_fecha (cuenta_id, fecha),
  KEY idx_movimiento_transferencia (transferencia_id),
  KEY idx_movimiento_usuario (usuario_id),
  CONSTRAINT fk_movimiento_cuenta FOREIGN KEY (cuenta_id) REFERENCES cuenta (id),
  CONSTRAINT fk_movimiento_transferencia FOREIGN KEY (transferencia_id) REFERENCES transferencia (id),
  CONSTRAINT fk_movimiento_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  CONSTRAINT ck_movimiento_monto CHECK (monto > 0),
  CONSTRAINT ck_movimiento_saldos CHECK (saldo_anterior >= 0 AND saldo_posterior >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
