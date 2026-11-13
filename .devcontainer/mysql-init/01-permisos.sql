-- La imagen de MySQL ya crea banco_academico y el usuario banco_app.
-- Las pruebas Jest usan además banco_academico_test.
CREATE DATABASE IF NOT EXISTS banco_academico_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON `banco_academico_test`.* TO 'banco_app'@'%';
FLUSH PRIVILEGES;
