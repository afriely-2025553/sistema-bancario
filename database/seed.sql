-- Datos ficticios de demostración. No corresponden a personas ni a dinero reales.
-- Contraseñas de práctica (también documentadas en el README):
--   cajero / Cajero123!
--   administrador / Admin123!

SET NAMES utf8mb4;

INSERT INTO tipo_cuenta (id, nombre, descripcion, activo) VALUES
  (1, 'Ahorro', 'Cuenta ficticia de ahorro para prácticas de saldo.', 1),
  (2, 'Monetaria', 'Cuenta ficticia monetaria para depósitos y transferencias.', 1),
  (3, 'Ahorro programado', 'Tipo inactivo, reservado para no ofrecerse en aperturas nuevas.', 0);

INSERT INTO cliente (
  id, codigo, identificacion, nombres, apellidos, fecha_nacimiento,
  telefono, correo, direccion, activo, fecha_registro
) VALUES
  (1, 'CLI-0001', 'DPI-FICT-1002001', 'Cliente', 'Ficticio 001', '1990-04-12', '55501001', 'cliente001@correo-ficticio.test', 'Calle Ficticia 101', 1, '2026-11-01 08:00:00'),
  (2, 'CLI-0002', 'DPI-FICT-1002002', 'Cliente', 'Ficticio 002', '1985-11-03', '55501002', 'cliente002@correo-ficticio.test', 'Avenida Simulada 202', 1, '2026-11-01 08:05:00'),
  (3, 'CLI-0003', 'DPI-FICT-1002003', 'Cliente', 'Ficticio 003', '2001-01-20', '55501003', 'cliente003@correo-ficticio.test', 'Boulevard Academico 303', 1, '2026-11-01 08:10:00'),
  (4, 'CLI-0004', 'DPI-FICT-1002004', 'Cliente', 'Ficticio 004', '1978-07-30', '55501004', 'cliente004@correo-ficticio.test', 'Pasaje de Prueba 404', 0, '2026-11-01 08:15:00');

INSERT INTO usuario (
  id, nombre_usuario, contrasena_hash, nombre_completo, rol, activo, fecha_creacion
) VALUES
  (1, 'cajero', '$2b$10$/Uj/h.dkplcwD95mJWSfdOynP8Q/TnHPlTUKjw90J.iO5yUu2KqT6', 'Usuario cajero ficticio', 'cajero', 1, '2026-11-01 07:00:00'),
  (2, 'administrador', '$2b$10$oYSKiEXhEA0xs.MMzaSlK.zwvszZcRWL8hZciYxD8gVYwVg6ieOGe', 'Usuario administrador ficticio', 'administrador', 1, '2026-11-01 07:05:00'),
  (3, 'cajero.inactivo', '$2b$10$/Uj/h.dkplcwD95mJWSfdOynP8Q/TnHPlTUKjw90J.iO5yUu2KqT6', 'Usuario cajero inactivo ficticio', 'cajero', 0, '2026-11-01 07:10:00');

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
  (1, 2, 3, 1, 199.50, 'TRF-00000001', 'Traslado ficticio de práctica', '2026-11-04 11:30:00');

INSERT INTO movimiento (
  id, cuenta_id, transferencia_id, usuario_id, tipo, monto,
  saldo_anterior, saldo_posterior, descripcion, fecha
) VALUES
  (1, 1, NULL, 1, 'deposito', 2000.00, 0.00, 2000.00, 'Depósito ficticio de apertura', '2026-11-03 10:00:00'),
  (2, 1, NULL, 1, 'retiro', 500.00, 2000.00, 1500.00, 'Retiro ficticio en ventanilla', '2026-11-03 15:00:00'),
  (3, 2, NULL, 1, 'deposito', 1000.00, 0.00, 1000.00, 'Depósito ficticio inicial', '2026-11-03 10:15:00'),
  (4, 3, NULL, 1, 'deposito', 50.50, 0.00, 50.50, 'Depósito ficticio inicial', '2026-11-03 10:20:00'),
  (5, 2, 1, 1, 'transferencia_salida', 199.50, 1000.00, 800.50, 'Salida por TRF-00000001', '2026-11-04 11:30:00'),
  (6, 3, 1, 1, 'transferencia_entrada', 199.50, 50.50, 250.00, 'Entrada por TRF-00000001', '2026-11-04 11:30:00'),
  (7, 5, NULL, 1, 'deposito', 3200.75, 0.00, 3200.75, 'Depósito ficticio inicial', '2026-11-05 09:00:00'),
  (8, 6, NULL, 1, 'deposito', 100.00, 0.00, 100.00, 'Depósito ficticio antes de inactivar la cuenta', '2026-11-05 09:30:00');
