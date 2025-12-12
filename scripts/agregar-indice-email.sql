-- Script para agregar índice único en email si no existe
-- Ejecuta este script manualmente en phpMyAdmin o MySQL si necesitas el índice único

-- Verificar si el índice ya existe antes de crearlo
-- Si la tabla usuarios ya tiene un índice único en email, este script fallará con un error
-- que puedes ignorar (significa que ya existe)

-- Para MySQL 5.7+
ALTER TABLE `usuarios` 
ADD UNIQUE INDEX `email_unique` (`email`);

-- Si el índice ya existe, verás un error como:
-- "Duplicate key name 'email_unique'"
-- Esto es normal y significa que el índice ya está creado.
