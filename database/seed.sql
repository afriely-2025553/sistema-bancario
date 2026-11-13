-- Datos de demostración. Las personas, los documentos y los saldos son inventados
-- (regla de negocio 10: solo información ficticia).
-- Credenciales de prueba (también documentadas en el README):
--   cajero / Cajero123!
--   administrador / Admin123!

SET NAMES utf8mb4;

INSERT INTO tipo_cuenta (id, nombre, descripcion, activo) VALUES
  (1, 'Ahorro', 'Cuenta de ahorro para depósitos y retiros frecuentes.', 1),
  (2, 'Monetaria', 'Cuenta monetaria para pagos y transferencias.', 1),
  (3, 'Ahorro programado', 'Producto descontinuado; no se ofrece en aperturas nuevas.', 0);

INSERT INTO cliente (
  id, codigo, identificacion, nombres, apellidos, fecha_nacimiento,
  telefono, correo, direccion, activo, fecha_registro
) VALUES
  (1, 'CLI-0001', '2501000010101', 'María Fernanda', 'López Castillo', '1990-04-12', '5550-1001', 'maria.lopez@correo.test', '6a. avenida 10-25, zona 1, Guatemala', 1, '2026-11-01 08:00:00'),
  (2, 'CLI-0002', '2501000020101', 'José Antonio', 'Pérez Morales', '1985-11-03', '5550-1002', 'jose.perez@correo.test', '12 calle 4-30, zona 10, Guatemala', 1, '2026-11-01 08:05:00'),
  (3, 'CLI-0003', '2501000030101', 'Ana Lucía', 'Ramírez Ortiz', '2001-01-20', '5550-1003', 'ana.ramirez@correo.test', '3a. avenida 2-15, zona 2, Mixco', 1, '2026-11-01 08:10:00'),
  (4, 'CLI-0004', '2501000040101', 'Carlos Eduardo', 'Méndez Soto', '1978-07-30', '5550-1004', 'carlos.mendez@correo.test', '8a. calle 5-40, zona 4, Villa Nueva', 0, '2026-11-01 08:15:00');

INSERT INTO usuario (
  id, nombre_usuario, contrasena_hash, nombre_completo, rol, activo, fecha_creacion
) VALUES
  (1, 'cajero', '$2b$10$/Uj/h.dkplcwD95mJWSfdOynP8Q/TnHPlTUKjw90J.iO5yUu2KqT6', 'Julia Herrera', 'cajero', 1, '2026-11-01 07:00:00'),
  (2, 'administrador', '$2b$10$oYSKiEXhEA0xs.MMzaSlK.zwvszZcRWL8hZciYxD8gVYwVg6ieOGe', 'Marco Salazar', 'administrador', 1, '2026-11-01 07:05:00'),
  (3, 'cajero.inactivo', '$2b$10$/Uj/h.dkplcwD95mJWSfdOynP8Q/TnHPlTUKjw90J.iO5yUu2KqT6', 'Pedro Cifuentes', 'cajero', 0, '2026-11-01 07:10:00');

INSERT INTO cuenta (
  id, numero_cuenta, cliente_id, tipo_cuenta_id, saldo, estado, fecha_apertura
) VALUES
  (1, '100-00000001', 1, 1, 1500.00, 'activa', '2026-11-02 09:00:00'),
  (2, '100-00000002', 1, 2, 800.50, 'activa', '2026-11-02 09:10:00'),
  (3, '100-00000003', 2, 1, 250.00, 'activa', '2026-11-02 09:20:00'),
  (4, '100-00000004', 2, 2, 0.00, 'inactiva', '2026-11-02 09:30:00'),
  (5, '100-00000005', 3, 1, 3200.75, 'activa', '2026-11-02 09:40:00'),
  (6, '100-00000006', 4, 1, 100.00, 'inactiva', '2026-11-02 09:50:00');

INSERT INTO transferencia (
  id, cuenta_origen_id, cuenta_destino_id, usuario_id, monto, referencia, concepto, fecha
) VALUES
  (1, 2, 3, 1, 199.50, 'TRF-00000001', 'Pago de alquiler', '2026-11-04 11:30:00');

INSERT INTO movimiento (
  id, cuenta_id, transferencia_id, usuario_id, tipo, monto,
  saldo_anterior, saldo_posterior, descripcion, fecha
) VALUES
  (1, 1, NULL, 1, 'deposito', 2000.00, 0.00, 2000.00, 'Depósito de apertura', '2026-11-03 10:00:00'),
  (2, 1, NULL, 1, 'retiro', 500.00, 2000.00, 1500.00, 'Retiro en ventanilla', '2026-11-03 15:00:00'),
  (3, 2, NULL, 1, 'deposito', 1000.00, 0.00, 1000.00, 'Depósito inicial', '2026-11-03 10:15:00'),
  (4, 3, NULL, 1, 'deposito', 50.50, 0.00, 50.50, 'Depósito inicial', '2026-11-03 10:20:00'),
  (5, 2, 1, 1, 'transferencia_salida', 199.50, 1000.00, 800.50, 'Salida: Pago de alquiler', '2026-11-04 11:30:00'),
  (6, 3, 1, 1, 'transferencia_entrada', 199.50, 50.50, 250.00, 'Entrada: Pago de alquiler', '2026-11-04 11:30:00'),
  (7, 5, NULL, 1, 'deposito', 3200.75, 0.00, 3200.75, 'Depósito inicial', '2026-11-05 09:00:00'),
  (8, 6, NULL, 1, 'deposito', 100.00, 0.00, 100.00, 'Depósito inicial', '2026-11-05 09:30:00');
