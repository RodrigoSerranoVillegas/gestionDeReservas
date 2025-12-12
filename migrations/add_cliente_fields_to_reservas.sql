-- Agregar campos de cliente directamente a la tabla reservas
-- Esto permite almacenar datos de clientes no registrados sin relacionarlos por correo
-- Ejecutar este script en phpMyAdmin o tu cliente MySQL

USE gestionDeReservas;

-- Verificar si las columnas ya existen (ejecuta esto primero para verificar)
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'gestionDeReservas' 
  AND TABLE_NAME = 'reservas' 
  AND COLUMN_NAME IN ('cliente_nombre', 'cliente_telefono', 'cliente_email');

-- Si las columnas NO existen, ejecuta estos comandos:
ALTER TABLE reservas 
ADD COLUMN cliente_nombre VARCHAR(100) NULL COMMENT 'Nombre del cliente almacenado directamente en la reserva' AFTER observaciones;

ALTER TABLE reservas 
ADD COLUMN cliente_telefono VARCHAR(20) NULL COMMENT 'Teléfono del cliente almacenado directamente en la reserva' AFTER cliente_nombre;

ALTER TABLE reservas 
ADD COLUMN cliente_email VARCHAR(100) NULL COMMENT 'Email del cliente almacenado directamente en la reserva' AFTER cliente_telefono;

-- Si obtienes error de que las columnas ya existen, verifica con:
-- DESCRIBE reservas;

