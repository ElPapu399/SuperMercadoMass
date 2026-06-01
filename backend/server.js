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
            const [rows] = await pool.query("SELECT id, usuario, nombre, rol FROM usuarios");
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
            const [rows] = await pool.query("SELECT * FROM usuarios WHERE usuario = ? LIMIT 1", [usuario]);
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
        // En producción se compararía un hash bcrypt (ej: bcrypt.compareSync(password, userRecord.password))
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

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend en puerto ${PORT} funcionando`);
});