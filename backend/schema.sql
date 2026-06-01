-- Script de inicialización para la base de datos de Supermercado Mass

-- 1. Crear la base de datos (puedes cambiar el nombre si lo deseas)
CREATE DATABASE IF NOT EXISTS supermercado_mass;
USE supermercado_mass;

-- 2. Crear la tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    rol VARCHAR(50) DEFAULT 'operador',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insertar usuarios iniciales
-- Nota: En un entorno productivo real las contraseñas deberían estar encriptadas (ej. con bcrypt).
-- Para este sprint inicial de inventario interno, se mantendrán las credenciales correspondientes a usuarios.json.
INSERT INTO usuarios (usuario, password, nombre, rol) VALUES
('admin', '1234', 'Administrador General', 'administrador')
ON DUPLICATE KEY UPDATE password='1234', nombre='Administrador General', rol='administrador';

INSERT INTO usuarios (usuario, password, nombre, rol) VALUES
('pablo', '1235', 'Pablo Gómez', 'operador')
ON DUPLICATE KEY UPDATE password='1235', nombre='Pablo Gómez', rol='operador';
