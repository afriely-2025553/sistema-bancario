# Documento inicial — Sistema bancario académico

| Dato | Valor |
| --- | --- |
| Institución | ____________ |
| Curso / Área | Taller 2 |
| Grado y sección | ____________ |
| Docente | ____________ |
| Estudiante | ____________ |
| Modalidad | Trabajo individual |
| Fecha de inicio | ____________ |
| Fecha de entrega | ____________ |
| Repositorio | ____________ |

## 1. Descripción del problema

Una entidad financiera de carácter académico necesita practicar, en un entorno controlado, el registro de clientes, la apertura de cuentas y las operaciones de depósito, retiro y transferencia. Hoy ese ejercicio se hace de forma dispersa: no hay un único lugar donde quede el saldo, el historial y la persona que operó el sistema. El resultado es que no se puede demostrar si una operación respetó el saldo disponible, si la cuenta estaba activa o si el movimiento quedó registrado.

El problema que resuelve este proyecto es construir un sistema bancario **exclusivamente educativo** que simule esas operaciones con **datos ficticios**. No administra dinero real, no se conecta a una entidad financiera real y no debe cargarse con documentos, contraseñas, tarjetas ni saldos verdaderos.

## 2. Propósito

- Recorrer un ciclo de desarrollo acotado: problema, requerimientos, diseño, construcción, pruebas y documentación.
- Integrar una interfaz web, una API REST y una base de datos relacional.
- Aplicar operaciones de alta, consulta, modificación y desactivación, más transacciones simuladas.
- Exigir validaciones, control de acceso, manejo de errores y pruebas repetibles.
- Dejar el trabajo en Git, con avances separados por fase.
- Documentar el sistema de modo que pueda explicarse de forma individual.

## 3. Alcance

El sistema incluye, como mínimo, los módulos siguientes.

| Módulo | Funcionalidad mínima |
| --- | --- |
| Autenticación | Inicio de sesión, cierre de sesión y validación de credenciales ficticias. |
| Clientes | Registrar, consultar, modificar y desactivar clientes. |
| Cuentas | Crear cuentas, consultar saldo, actualizar estado y asociar la cuenta a un cliente. |
| Depósitos | Registrar depósitos y actualizar el saldo. |
| Retiros | Registrar retiros solo si hay saldo disponible. |
| Transferencias | Transferir entre dos cuentas y registrar la operación. |
| Movimientos | Consultar el historial de depósitos, retiros y transferencias. |
| Consultas | Buscar clientes y cuentas; consultar saldo y movimientos. |
| Reportes | Mostrar al menos un resumen de operaciones. |
| Validaciones | Campos obligatorios, datos válidos, saldos y reglas de negocio. |

## 4. Fuera de alcance

- Dinero, cuentas, tarjetas o credenciales reales.
- Integración con bancos, pasarelas de pago o burós de crédito.
- Intereses, comisiones, cheques, cajeros automáticos o banca en línea de clientes finales.
- Aplicación móvil nativa.
- Trabajo en equipo: el desarrollo es individual.

## 5. Objetivos

### 5.1 Objetivo general

Desarrollar un sistema bancario académico, con frontend, backend y base de datos, capaz de administrar clientes, cuentas y operaciones simuladas respetando reglas de negocio comprobables.

### 5.2 Objetivos específicos

1. Definir el problema, el alcance y los objetivos antes de programar.
2. Redactar requerimientos e historias de usuario con criterios de aceptación.
3. Diseñar la arquitectura, los casos de uso y los flujos principales.
4. Modelar e implementar en MySQL las entidades Cliente, Usuario, Cuenta, TipoCuenta, Movimiento y Transferencia.
5. Exponer una API REST con autenticación y las operaciones mínimas del sistema.
6. Construir una interfaz Angular para operar el sistema de punta a punta.
7. Verificar las pruebas P001 a P010 y dejar evidencia de los resultados.
8. Documentar instalación, uso, errores corregidos y el apoyo recibido de un asistente de IA.

## 6. Rol único

El trabajo es individual. No hay equipo ni reparto de roles entre varias personas. Quien entrega el proyecto asume, en una sola responsabilidad, el análisis, el diseño, la base de datos, el backend, el frontend, las pruebas y la documentación.

| Rol | Responsabilidad en este proyecto |
| --- | --- |
| Estudiante (rol único) | Problema, requerimientos, historias, arquitectura, modelo de datos, API, interfaz, pruebas, correcciones, manual y presentación. |

Los espacios de nombre, institución, docente, grado y fechas quedan en blanco para completarlos en la entrega institucional.

## 7. Restricciones

1. Solo información ficticia.
2. Tecnologías: Angular y TypeScript en el frontend; Node.js, TypeScript y Express en el backend; MySQL como base de datos; Postman para la API; Git para el historial.
3. Cada cuenta pertenece a un cliente.
4. Una cuenta inactiva no opera.
5. Depósitos, retiros y transferencias mayores que cero, con saldo suficiente y cuentas distintas en una transferencia.
6. Toda operación queda registrada con fecha, tipo, monto y cuentas involucradas.
7. La desactivación de un cliente es lógica: el registro no se borra.

## 8. Criterios de éxito

El sistema se considera logrado cuando:

- Una persona con credenciales de prueba inicia sesión y, si las credenciales fallan, ve un error.
- Puede registrar un cliente, crear una cuenta asociada y consultar el saldo.
- Un depósito aumenta el saldo, un retiro válido lo disminuye y un retiro mayor al saldo se rechaza.
- Una transferencia válida actualiza las dos cuentas y una transferencia a la misma cuenta se rechaza.
- Una cuenta inactiva no acepta operaciones.
- Las pruebas P001 a P010 pasan contra MySQL.
- La documentación y el repositorio permiten instalar y explicar el sistema.

## 9. Plan de trabajo de referencia

| Día | Trabajo | Evidencia |
| --- | --- | --- |
| 1 | Problema, alcance, rol y objetivos | Este documento |
| 2 | Requerimientos e historias de usuario | Mínimo 10 historias |
| 3 | Arquitectura, casos de uso y flujos | Diagramas |
| 4 | Diseño de base de datos | ERD y script SQL |
| 5 | Backend: estructura y CRUD inicial | API de clientes y cuentas |
| 6 | Autenticación, depósitos y retiros | Validaciones de saldo |
| 7 | Transferencias, movimientos y Postman | Colección y evidencias |
| 8 | Frontend | Interfaces conectadas a la API |
| 9 | Integración, pruebas y correcciones | Matriz de pruebas |
| 10 | README, manual, presentación y cierre | Entrega final |

## 10. Supuestos

- Habrá un servidor MySQL local accesible para quien evalúe el proyecto.
- Los usuarios del sistema son operadores (cajero y administrador), no los clientes bancarios.
- El cliente bancario no inicia sesión: lo atiende el operador autenticado.
- Los montos usan dos decimales y se muestran en quetzales (Q), con separador de miles.
