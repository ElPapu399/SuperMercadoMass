import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Importamos el archivo local JSON para fallback
import usuariosFallback from "./usuarios.json" with { type: "json" };

// Cargamos variables de entorno
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "super_secreto_mass_inventory_control_2026";

// Configuración y estado de la base de datos
let pool = null;
let dbConnected = false;

// Función para sembrar lotes iniciales si la tabla está vacía
async function autoSeedLotes(dbPool) {
    try {
        const [rows] = await dbPool.query("SELECT COUNT(*) as count FROM lotes");
        if (rows[0].count === 0) {
            console.log("🌱 [DB] Sembrando lotes iniciales...");
            const [productos] = await dbPool.query("SELECT id, sku, stock_actual FROM productos");
            
            const lotesSemilla = {
                'PROD001': { lote: 'L-GLO01', fecha: '2026-08-15' },
                'PROD002': { lote: 'L-YOG02', fecha: '2026-07-01' }, // Crítico (5 días desde 2026-06-26)
                'PROD003': { lote: 'L-COC03', fecha: '2026-12-10' },
                'PROD004': { lote: 'L-MAT04', fecha: '2026-06-20' }, // Vencido (hace 6 días)
                'PROD005': { lote: 'L-BOL05', fecha: '2029-12-31' }
            };

            for (const prod of productos) {
                const seed = lotesSemilla[prod.sku] || { lote: `L-${prod.sku}`, fecha: '2026-09-30' };
                await dbPool.query(
                    "INSERT INTO lotes (id_producto, numero_lote, fecha_vencimiento, cantidad_ingresada, cantidad_disponible) VALUES (?, ?, ?, ?, ?)",
                    [prod.id, seed.lote, seed.fecha, prod.stock_actual, prod.stock_actual]
                );
            }
            console.log("✅ [DB] Lotes sembrados con éxito");
        }
    } catch (err) {
        console.error("❌ Error al sembrar lotes iniciales:", err);
    }
}

// Datos Mock para modo Fallback
let mockCategorias = [
    { id: 1, nombre: "Lácteos", descripcion: "Productos derivados de la leche" },
    { id: 2, nombre: "Bebidas", descripcion: "Gaseosas, aguas, jugos y refrescos" },
    { id: 3, fontAwesomeIcon: "", nombre: "Limpieza", descripcion: "Productos de limpieza e higiene" }
];

let mockProveedores = [
    { id: 1, nombre: "Distribuidora Gloria S.A.", contacto: "Juan Pérez", telefono: "999888777", email: "contacto@gloria.pe", direccion: "Av. La Marina 123, Lima" },
    { id: 2, nombre: "Corporación Lindley S.A.", contacto: "María Gómez", telefono: "999111222", email: "ventas@lindley.pe", direccion: "Av. República de Panamá 456, Lima" },
    { id: 3, nombre: "Alicorp S.A.A.", contacto: "Carlos Plaza", telefono: "999333444", email: "servicio@alicorp.pe", direccion: "Av. Argentina 789, Callao" }
];

let mockProductos = [
    { id: 1, codigo: "PROD001", nombre: "Leche Gloria Entera UHT 1L", categoria: "Lácteos", id_categoria: 1, precio_compra: 3.50, precio: 4.90, stock: 120, stockMinimo: 30, unidad_medida: "Unidades", proveedor: "Distribuidora Gloria S.A.", id_proveedor: 1, fechaVencimiento: "2026-08-15" },
    { id: 2, codigo: "PROD002", nombre: "Yogurt Gloria de Fresa 1L", categoria: "Lácteos", id_categoria: 1, precio_compra: 5.20, precio: 7.20, stock: 18, stockMinimo: 12, unidad_medida: "Unidades", proveedor: "Distribuidora Gloria S.A.", id_proveedor: 1, fechaVencimiento: "2026-07-01" },
    { id: 3, codigo: "PROD003", nombre: "Gaseosa Coca-Cola Original 3L", categoria: "Bebidas", id_categoria: 2, precio_compra: 8.50, precio: 11.50, stock: 50, stockMinimo: 15, unidad_medida: "Unidades", proveedor: "Corporación Lindley S.A.", id_proveedor: 2, fechaVencimiento: "2026-12-10" },
    { id: 4, codigo: "PROD004", nombre: "Agua Mineral San Mateo Sin Gas 2.5L", categoria: "Bebidas", id_categoria: 2, precio_compra: 2.00, precio: 3.20, stock: 80, stockMinimo: 20, unidad_medida: "Unidades", proveedor: "Corporación Lindley S.A.", id_proveedor: 2, fechaVencimiento: "2026-06-20" },
    { id: 5, codigo: "PROD005", nombre: "Detergente Bolívar Flores de Limón 800g", categoria: "Limpieza", id_categoria: 3, precio_compra: 7.00, precio: 9.90, stock: 35, stockMinimo: 8, unidad_medida: "Unidades", proveedor: "Alicorp S.A.A.", id_proveedor: 3, fechaVencimiento: "2029-12-31" }
];

// Función para verificar y migrar la tabla productos para soporte de borrado lógico
async function verifyAndMigrateSchema(dbPool) {
    try {
        const [cols] = await dbPool.query("SHOW COLUMNS FROM productos LIKE 'activo'");
        if (cols.length === 0) {
            console.log("⚙️ [DB] Modificando tabla 'productos' para añadir borrado lógico...");
            await dbPool.query("ALTER TABLE productos ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1");
            console.log("✅ [DB] Columna 'activo' agregada exitosamente a la tabla 'productos'");
        }
    } catch (err) {
        console.error("❌ [DB Migration Error] Error al verificar/migrar base de datos:", err.message);
    }
}

// Intentamos establecer la conexión con MySQL
try {
    if (process.env.DB_HOST && process.env.DB_USER) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME || "supermercado_mass",
            port: parseInt(process.env.DB_PORT || "3306", 10),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // Probamos la conexión
        const connection = await pool.getConnection();
        console.log("✅ [DB] Conexión establecida exitosamente con MySQL");
        connection.release();
        dbConnected = true;

        // Sembrar lotes si es necesario
        await autoSeedLotes(pool);

        // Verificar y migrar base de datos
        await verifyAndMigrateSchema(pool);
    } else {
        console.warn("⚠️ [DB] No se detectaron credenciales de MySQL. Usando 'usuarios.json' por defecto.");
    }
} catch (error) {
    console.error("❌ [DB Error] Error al intentar conectar con MySQL:", error.message);
    console.warn("⚠️ [DB Warning] Iniciando en modo local. Las credenciales se validarán contra 'usuarios.json'.");
    dbConnected = false;
}

// ==========================================
// ENDPOINTS DE LA API
// ==========================================

// Endpoint para el listado de usuarios (con soporte para MySQL / Fallback)
app.get("/usuarios", async (req, res) => {
    try {
        if (dbConnected) {
            const [rows] = await pool.query("SELECT id, email AS usuario, nombre, rol FROM usuarios");
            return res.json(rows);
        } else {
            // Mapeamos los datos locales para no exponer la contraseña en este endpoint genérico
            const safeUsers = usuariosFallback.map(u => ({
                id: u.id,
                usuario: u.usuario,
                nombre: u.usuario === "admin" ? "Administrador General" : "Operador Local",
                rol: u.usuario === "admin" ? "administrador" : "operador"
            }));
            return res.json(safeUsers);
        }
    } catch (err) {
        console.error("Error al obtener usuarios:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
});

// Endpoint de Login Seguro con generación de JWT
app.post("/api/login", async (req, res) => {
    const { usuario, password } = req.body;

    // Validación básica de campos
    if (!usuario || !password) {
        return res.status(400).json({
            success: false,
            message: "Por favor, complete todos los campos"
        });
    }

    try {
        let userRecord = null;

        if (dbConnected) {
            // 1. Intentar validar contra MySQL
            const [rows] = await pool.query("SELECT id, email AS usuario, password_hash AS password, nombre, rol FROM usuarios WHERE email = ? LIMIT 1", [usuario]);
            if (rows.length > 0) {
                userRecord = rows[0];
            }
        } else {
            // 2. Fallback a usuarios.json local
            userRecord = usuariosFallback.find(u => u.usuario.toLowerCase() === usuario.toLowerCase());
        }

        // Si no se encuentra el usuario
        if (!userRecord) {
            return res.status(401).json({
                success: false,
                message: "Usuario o contraseña incorrectos"
            });
        }

        // Comprobación de contraseña
        const isMatch = (password === userRecord.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Usuario o contraseña incorrectos"
            });
        }

        // Generar JWT Token
        const payload = {
            id: userRecord.id,
            usuario: userRecord.usuario,
            nombre: userRecord.nombre || (userRecord.usuario === "admin" ? "Administrador General" : "Operador Local"),
            rol: userRecord.rol || (userRecord.usuario === "admin" ? "administrador" : "operador")
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });

        return res.json({
            success: true,
            message: "Autenticación exitosa",
            token,
            user: {
                id: payload.id,
                usuario: payload.usuario,
                nombre: payload.nombre,
                rol: payload.rol
            }
        });

    } catch (err) {
        console.error("Error en proceso de login:", err);
        return res.status(500).json({
            success: false,
            message: "Error interno del servidor en el proceso de autenticación"
        });
    }
});

// Endpoint para validar el token y obtener datos de sesión
app.get("/api/auth/verify", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ authenticated: false, message: "Token no proporcionado" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.json({ authenticated: true, user: decoded });
    } catch (error) {
        return res.status(401).json({ authenticated: false, message: "Token inválido o expirado" });
    }
});

// ==========================================
// ENDPOINTS PARA LA GESTIÓN DE INVENTARIO
// ==========================================

// Endpoint para obtener categorías
app.get("/api/categorias", async (req, res) => {
    try {
        if (dbConnected) {
            const [rows] = await pool.query("SELECT id, nombre, descripcion FROM categorias ORDER BY nombre ASC");
            return res.json(rows);
        } else {
            return res.json(mockCategorias);
        }
    } catch (err) {
        console.error("Error al obtener categorías:", err);
        return res.status(500).json({ error: "Error interno al obtener categorías" });
    }
});

// Endpoint para obtener proveedores
app.get("/api/proveedores", async (req, res) => {
    try {
        if (dbConnected) {
            const [rows] = await pool.query("SELECT id, nombre, contacto, telefono, email, direccion FROM proveedores ORDER BY nombre ASC");
            return res.json(rows);
        } else {
            return res.json(mockProveedores);
        }
    } catch (err) {
        console.error("Error al obtener proveedores:", err);
        return res.status(500).json({ error: "Error interno al obtener proveedores" });
    }
});

// Endpoint para obtener todos los productos activos con sus detalles y vencimiento
app.get("/api/productos", async (req, res) => {
    try {
        if (dbConnected) {
            const query = `
                SELECT 
                    p.id,
                    p.sku AS codigo,
                    p.nombre,
                    c.nombre AS categoria,
                    p.id_categoria,
                    p.precio_compra,
                    p.precio_venta AS precio,
                    p.stock_actual AS stock,
                    p.stock_minimo AS stockMinimo,
                    p.unidad_medida,
                    prov.nombre AS proveedor,
                    p.id_proveedor,
                    (SELECT MIN(l.fecha_vencimiento) 
                     FROM lotes l 
                     WHERE l.id_producto = p.id AND l.cantidad_disponible > 0) AS fechaVencimiento
                FROM productos p
                LEFT JOIN categorias c ON p.id_categoria = c.id
                LEFT JOIN proveedores prov ON p.id_proveedor = prov.id
                WHERE p.activo = 1
                ORDER BY p.id DESC
            `;
            const [rows] = await pool.query(query);
            
            const formatted = rows.map(row => {
                if (row.fechaVencimiento) {
                    const d = new Date(row.fechaVencimiento);
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    row.fechaVencimiento = `${year}-${month}-${day}`;
                } else {
                    row.fechaVencimiento = "";
                }
                // Convert values to correct types
                row.precio_compra = parseFloat(row.precio_compra || 0);
                row.precio = parseFloat(row.precio || 0);
                row.stock = parseInt(row.stock || 0, 10);
                row.stockMinimo = parseInt(row.stockMinimo || 0, 10);
                return row;
            });
            return res.json(formatted);
        } else {
            return res.json(mockProductos.filter(p => p.activo !== false));
        }
    } catch (err) {
        console.error("Error al obtener productos:", err);
        return res.status(500).json({ error: "Error interno al obtener productos" });
    }
});

// Endpoint para crear un nuevo producto con validación de SKU único activo
app.post("/api/productos", async (req, res) => {
    const {
        nombre,
        sku,
        id_categoria,
        precio_compra,
        precio_venta,
        stock_actual,
        stock_minimo,
        unidad_medida,
        id_proveedor,
        fecha_vencimiento,
        numero_lote
    } = req.body;

    if (!nombre || !sku || precio_compra === undefined || precio_venta === undefined || stock_actual === undefined) {
        return res.status(400).json({ success: false, message: "Campos obligatorios faltantes" });
    }

    try {
        if (dbConnected) {
            // Verificar si el SKU ya existe en algún producto activo
            const [existing] = await pool.query("SELECT id FROM productos WHERE sku = ? AND activo = 1", [sku]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: `El código SKU ${sku} ya está registrado para un producto activo` });
            }

            // Insertar el producto
            const [result] = await pool.query(
                `INSERT INTO productos 
                 (nombre, sku, id_categoria, precio_compra, precio_venta, stock_actual, stock_minimo, unidad_medida, id_proveedor, activo) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                    nombre,
                    sku,
                    id_categoria ? parseInt(id_categoria) : null,
                    parseFloat(precio_compra),
                    parseFloat(precio_venta),
                    parseInt(stock_actual),
                    parseInt(stock_minimo) || 0,
                    unidad_medida || "Unidades",
                    id_proveedor ? parseInt(id_proveedor) : null
                ]
            );

            const newId = result.insertId;

            // Si hay fecha de vencimiento, crear lote correspondiente
            if (fecha_vencimiento) {
                const loteNum = numero_lote || `LOTE-${sku}`;
                await pool.query(
                    `INSERT INTO lotes 
                     (id_producto, numero_lote, fecha_vencimiento, cantidad_ingresada, cantidad_disponible) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [newId, loteNum, fecha_vencimiento, parseInt(stock_actual), parseInt(stock_actual)]
                );
            }

            // Registrar movimiento inicial
            await pool.query(
                `INSERT INTO movimientos 
                 (id_producto, tipo, cantidad, observaciones) 
                 VALUES (?, 'ENTRADA', ?, 'Registro inicial de producto')`,
                [newId, parseInt(stock_actual)]
            );

            // Obtener el producto creado con todos sus datos
            const [newProdRows] = await pool.query(
                `SELECT 
                    p.id,
                    p.sku AS codigo,
                    p.nombre,
                    c.nombre AS categoria,
                    p.id_categoria,
                    p.precio_compra,
                    p.precio_venta AS precio,
                    p.stock_actual AS stock,
                    p.stock_minimo AS stockMinimo,
                    p.unidad_medida,
                    prov.nombre AS proveedor,
                    p.id_proveedor,
                    ? AS fechaVencimiento
                 FROM productos p
                 LEFT JOIN categorias c ON p.id_categoria = c.id
                 LEFT JOIN proveedores prov ON p.id_proveedor = prov.id
                 WHERE p.id = ? LIMIT 1`,
                [fecha_vencimiento || "", newId]
            );

            const created = newProdRows[0];
            created.precio_compra = parseFloat(created.precio_compra);
            created.precio = parseFloat(created.precio);
            created.stock = parseInt(created.stock);
            created.stockMinimo = parseInt(created.stockMinimo);

            return res.status(201).json({ success: true, product: created });
        } else {
            // Modo Fallback local
            const existing = mockProductos.some(p => p.codigo.toLowerCase() === sku.toLowerCase() && p.activo !== false);
            if (existing) {
                return res.status(400).json({ success: false, message: `El código SKU ${sku} ya existe en un producto activo` });
            }

            const newId = mockProductos.length > 0 ? Math.max(...mockProductos.map(p => p.id)) + 1 : 1;
            const categoryObj = mockCategorias.find(c => c.id === parseInt(id_categoria));
            const providerObj = mockProveedores.find(p => p.id === parseInt(id_proveedor));

            const newProduct = {
                id: newId,
                codigo: sku,
                nombre,
                id_categoria: id_categoria ? parseInt(id_categoria) : null,
                categoria: categoryObj ? categoryObj.nombre : "Sin Categoría",
                precio_compra: parseFloat(precio_compra),
                precio: parseFloat(precio_venta),
                stock: parseInt(stock_actual),
                stockMinimo: parseInt(stock_minimo) || 0,
                unidad_medida: unidad_medida || "Unidades",
                id_proveedor: id_proveedor ? parseInt(id_proveedor) : null,
                proveedor: providerObj ? providerObj.nombre : "Sin Proveedor",
                fechaVencimiento: fecha_vencimiento || "",
                activo: true
            };

            mockProductos.unshift(newProduct);
            return res.status(201).json({ success: true, product: newProduct });
        }
    } catch (err) {
        console.error("Error al crear producto:", err);
        return res.status(500).json({ error: "Error interno al crear producto" });
    }
});

// Endpoint para editar un producto
app.put("/api/productos/:id", async (req, res) => {
    const { id } = req.params;
    const {
        nombre,
        sku,
        id_categoria,
        precio_compra,
        precio_venta,
        stock_actual,
        stock_minimo,
        unidad_medida,
        id_proveedor
    } = req.body;

    if (!nombre || !sku || precio_compra === undefined || precio_venta === undefined || stock_actual === undefined) {
        return res.status(400).json({ success: false, message: "Campos obligatorios faltantes" });
    }

    try {
        if (dbConnected) {
            // Verificar si el SKU ya existe en otro producto activo
            const [existing] = await pool.query("SELECT id FROM productos WHERE sku = ? AND id != ? AND activo = 1", [sku, id]);
            if (existing.length > 0) {
                return res.status(400).json({ success: false, message: `El código SKU ${sku} ya está en uso por otro producto activo` });
            }

            // Actualizar producto
            await pool.query(
                `UPDATE productos SET 
                    nombre = ?, 
                    sku = ?, 
                    id_categoria = ?, 
                    precio_compra = ?, 
                    precio_venta = ?, 
                    stock_actual = ?, 
                    stock_minimo = ?, 
                    unidad_medida = ?, 
                    id_proveedor = ?
                 WHERE id = ?`,
                [
                    nombre,
                    sku,
                    id_categoria ? parseInt(id_categoria) : null,
                    parseFloat(precio_compra),
                    parseFloat(precio_venta),
                    parseInt(stock_actual),
                    parseInt(stock_minimo) || 0,
                    unidad_medida || "Unidades",
                    id_proveedor ? parseInt(id_proveedor) : null,
                    id
                ]
            );

            // Obtener el producto actualizado con todos sus datos
            const [updatedRows] = await pool.query(
                `SELECT 
                    p.id,
                    p.sku AS codigo,
                    p.nombre,
                    c.nombre AS categoria,
                    p.id_categoria,
                    p.precio_compra,
                    p.precio_venta AS precio,
                    p.stock_actual AS stock,
                    p.stock_minimo AS stockMinimo,
                    p.unidad_medida,
                    prov.nombre AS proveedor,
                    p.id_proveedor,
                    (SELECT MIN(l.fecha_vencimiento) 
                     FROM lotes l 
                     WHERE l.id_producto = p.id AND l.cantidad_disponible > 0) AS fechaVencimiento
                 FROM productos p
                 LEFT JOIN categorias c ON p.id_categoria = c.id
                 LEFT JOIN proveedores prov ON p.id_proveedor = prov.id
                 WHERE p.id = ? LIMIT 1`,
                [id]
            );

            if (updatedRows.length === 0) {
                return res.status(404).json({ success: false, message: "Producto no encontrado" });
            }

            const updated = updatedRows[0];
            if (updated.fechaVencimiento) {
                const d = new Date(updated.fechaVencimiento);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                updated.fechaVencimiento = `${year}-${month}-${day}`;
            } else {
                updated.fechaVencimiento = "";
            }
            updated.precio_compra = parseFloat(updated.precio_compra);
            updated.precio = parseFloat(updated.precio);
            updated.stock = parseInt(updated.stock);
            updated.stockMinimo = parseInt(updated.stockMinimo);

            return res.json({ success: true, product: updated });
        } else {
            // Modo Fallback local
            const existing = mockProductos.some(p => p.codigo.toLowerCase() === sku.toLowerCase() && p.id !== parseInt(id) && p.activo !== false);
            if (existing) {
                return res.status(400).json({ success: false, message: `El código SKU ${sku} ya está en uso localmente` });
            }

            const prodIdx = mockProductos.findIndex(p => p.id === parseInt(id));
            if (prodIdx === -1) {
                return res.status(404).json({ success: false, message: "Producto no encontrado" });
            }

            const categoryObj = mockCategorias.find(c => c.id === parseInt(id_categoria));
            const providerObj = mockProveedores.find(p => p.id === parseInt(id_proveedor));

            const updatedProduct = {
                ...mockProductos[prodIdx],
                codigo: sku,
                nombre,
                id_categoria: id_categoria ? parseInt(id_categoria) : null,
                categoria: categoryObj ? categoryObj.nombre : "Sin Categoría",
                precio_compra: parseFloat(precio_compra),
                precio: parseFloat(precio_venta),
                stock: parseInt(stock_actual),
                stockMinimo: parseInt(stock_minimo) || 0,
                unidad_medida: unidad_medida || "Unidades",
                id_proveedor: id_proveedor ? parseInt(id_proveedor) : null,
                proveedor: providerObj ? providerObj.nombre : "Sin Proveedor"
            };

            mockProductos[prodIdx] = updatedProduct;
            return res.json({ success: true, product: updatedProduct });
        }
    } catch (err) {
        console.error("Error al actualizar producto:", err);
        return res.status(500).json({ error: "Error interno al actualizar producto" });
    }
});

// Endpoint para eliminar un producto (eliminación lógica con chequeo de movimientos y liberación de SKU)
app.delete("/api/productos/:id", async (req, res) => {
    const { id } = req.params;
    try {
        if (dbConnected) {
            // 1. Verificar si el producto tiene movimientos asociados
            const [movements] = await pool.query("SELECT COUNT(*) AS count FROM movimientos WHERE id_producto = ?", [id]);
            if (movements[0].count > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "No se puede eliminar el producto porque tiene movimientos de inventario asociados" 
                });
            }

            // 2. Realizar eliminación lógica (activo = 0 y renombrar SKU para liberar el código)
            const timestamp = Math.floor(Date.now() / 1000);
            await pool.query(
                `UPDATE productos SET 
                    activo = 0,
                    sku = CONCAT(sku, '-deleted-', ?)
                 WHERE id = ?`,
                [timestamp, id]
            );
            return res.json({ success: true, message: "Producto eliminado exitosamente" });
        } else {
            // Fallback local: Simulamos que los ID del 1 al 5 tienen movimientos iniciales sembrados
            if (parseInt(id) <= 5) {
                return res.status(400).json({ 
                    success: false, 
                    message: "No se puede eliminar el producto porque tiene movimientos de inventario asociados" 
                });
            }

            const index = mockProductos.findIndex(p => p.id === parseInt(id));
            if (index === -1) {
                return res.status(404).json({ success: false, message: "Producto no encontrado localmente" });
            }

            mockProductos[index].activo = false;
            // Liberar SKU en el mock
            mockProductos[index].codigo = `${mockProductos[index].codigo}-deleted-${Math.floor(Date.now() / 1000)}`;
            return res.json({ success: true, message: "Producto eliminado correctamente" });
        }
    } catch (err) {
        console.error("Error al eliminar producto:", err);
        return res.status(500).json({ error: "Error interno al eliminar producto" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend en puerto ${PORT} funcionando`);
});
