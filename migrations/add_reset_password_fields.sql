-- Agregar campos para recuperación de contraseña a la tabla usuarios
-- Ejecutar este script en phpMyAdmin o tu cliente MySQL

USE gestionDeReservas;

-- Verificar si las columnas ya existen (ejecuta esto primero para verificar)
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'gestionDeReservas' 
  AND TABLE_NAME = 'usuarios' 
  AND COLUMN_NAME IN ('resetPasswordToken', 'resetPasswordExpires', 'reset_password_token', 'reset_password_expires');

-- Si las columnas NO existen, ejecuta estos comandos:
-- Nota: Sequelize puede usar camelCase o snake_case dependiendo de la configuración
-- Agregamos ambas versiones para asegurar compatibilidad

-- Versión camelCase (si Sequelize mantiene los nombres originales)
ALTER TABLE usuarios 
ADD COLUMN resetPasswordToken VARCHAR(255) NULL AFTER estado;

ALTER TABLE usuarios 
ADD COLUMN resetPasswordExpires DATETIME NULL AFTER resetPasswordToken;

-- Si obtienes error de que las columnas ya existen, verifica con:
-- DESCRIBE usuarios;
