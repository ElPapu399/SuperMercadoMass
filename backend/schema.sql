-- Script de inicialización para la base de datos de Supermercado Mass

-- 1. Crear la base de datos si no existe y usarla
CREATE DATABASE IF NOT EXISTS supermercado_mass;
USE supermercado_mass;

-- 2. Limpieza de tablas previas (en orden inverso de dependencia para evitar conflictos de claves foráneas)
DROP TABLE IF EXISTS movimientos;
DROP TABLE IF EXISTS lotes;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS proveedores;
DROP TABLE IF EXISTS categorias;
DROP TABLE IF EXISTS usuarios;

-- 3. Crear la tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'operador',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crear la tabla de categorías
CREATE TABLE categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

-- 5. Crear la tabla de proveedores
CREATE TABLE proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(50),
    email VARCHAR(100),
    direccion VARCHAR(255)
);

-- 6. Crear la tabla de productos
CREATE TABLE productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    id_categoria INT,
    precio_compra DECIMAL(10, 2) NOT NULL,
    precio_venta DECIMAL(10, 2) NOT NULL,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 0,
    unidad_medida VARCHAR(50) NOT NULL DEFAULT 'Unidades',
    id_proveedor INT,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE SET NULL,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id) ON DELETE SET NULL
);

-- 7. Crear la tabla de lotes
CREATE TABLE lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    numero_lote VARCHAR(50) NOT NULL,
    fecha_vencimiento DATE,
    cantidad_ingresada INT NOT NULL,
    cantidad_disponible INT NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE
);

-- 8. Crear la tabla de movimientos de inventario
CREATE TABLE movimientos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- e.g., 'ENTRADA', 'SALIDA', 'AJUSTE'
    cantidad INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT,
    id_lote INT,
    observaciones TEXT,
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (id_lote) REFERENCES lotes(id) ON DELETE SET NULL
);

-- =========================================================================
-- DATOS SEMILLA
-- =========================================================================

-- Insertar datos semilla: Usuarios
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador General', 'admin', 'admin123', 'administrador');

-- Insertar datos semilla: Categorías (Lácteos, Bebidas, Limpieza)
INSERT INTO categorias (nombre, descripcion) VALUES
('Lácteos', 'Productos derivados de la leche y lácteos diversos'),
('Bebidas', 'Gaseosas, aguas, jugos y bebidas refrescantes'),
('Limpieza', 'Productos para el aseo del hogar e higiene');

-- Insertar datos semilla: Proveedores (para asociar a los productos)
INSERT INTO proveedores (nombre, contacto, telefono, email, direccion) VALUES
('Distribuidora Gloria S.A.', 'Juan Pérez', '999888777', 'contacto@gloria.pe', 'Av. La Marina 123, Lima'),
('Corporación Lindley S.A.', 'María Gómez', '999111222', 'ventas@lindley.pe', 'Av. República de Panamá 456, Lima'),
('Alicorp S.A.A.', 'Carlos Plaza', '999333444', 'servicio@alicorp.pe', 'Av. Argentina 789, Callao');

-- Insertar datos semilla: Productos (5 ejemplos)
INSERT INTO productos (nombre, sku, id_categoria, precio_compra, precio_venta, stock_actual, stock_minimo, unidad_medida, id_proveedor) VALUES
('Leche Gloria Entera UHT 1L', 'PROD001', 1, 3.50, 4.90, 120, 30, 'Unidades', 1),
('Yogurt Gloria de Fresa 1L', 'PROD002', 1, 5.20, 7.20, 18, 12, 'Unidades', 1),
('Gaseosa Coca-Cola Original 3L', 'PROD003', 2, 8.50, 11.50, 50, 15, 'Unidades', 2),
('Agua Mineral San Mateo Sin Gas 2.5L', 'PROD004', 2, 2.00, 3.20, 80, 20, 'Unidades', 2),
('Detergente Bolívar Flores de Limón 800g', 'PROD005', 3, 7.00, 9.90, 35, 8, 'Unidades', 3);
