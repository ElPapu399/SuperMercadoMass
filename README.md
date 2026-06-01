# Mass Inventory Control 🛒📦

Portal digital interno y sistema de control de existencias para **Supermercado Mass** (Lima, Perú). Este software ha sido desarrollado específicamente para el personal operativo, administradores e inspectores de tienda, permitiéndoles auditar los niveles de stock, gestionar fechas críticas de vencimiento de alimentos y acceder de forma segura mediante un login centralizado.

---

## 🏗️ Arquitectura y Tecnologías

El proyecto se estructura bajo un modelo desacoplado (Frontend & Backend):

* **Frontend (Cliente):** React 19 + TypeScript + Vite + TailwindCSS v4 + FontAwesome.
* **Backend (Servidor/API):** Node.js (ES Modules) + Express + JWT (autenticación) + `dotenv` (gestión de variables).
* **Almacenamiento (Base de datos):** 
  - **MySQL** (producción/desarrollo local).
  - **JSON Local Fallback (`usuarios.json`)** (mecanismo de respaldo inteligente y automático si la base de datos MySQL no se encuentra conectada o activa en el entorno).

---

## 📂 Estructura del Workspace

```text
SuperMercadoMass/
├── backend/                  # API REST en Node.js
│   ├── .env                  # Archivo de variables de entorno activas (generado)
│   ├── .env.example          # Plantilla de variables de entorno
│   ├── package.json          # Dependencias y scripts del servidor
│   ├── schema.sql            # Script para inicializar la base de datos en MySQL
│   ├── server.js             # Punto de entrada de la API Express (JWT, MySQL, Fallback)
│   └── usuarios.json         # Base de datos local JSON (de respaldo)
└── frontend/                 # Aplicación SPA en React
    ├── package.json          # Dependencias y scripts de desarrollo
    ├── src/
    │   ├── components/       # Componentes reutilizables (Footer, ProtectedRoute)
    │   ├── pages/            # Páginas principales (HomeLogin, HomeInventario)
    │   ├── App.tsx           # Configuración de enrutador y protección de vistas
    │   └── main.tsx          # Punto de entrada de la aplicación React
    └── index.html
```

---

## ⚡ Guía de Inicio Rápido

Sigue estos pasos para arrancar ambos servicios de inmediato.

### ⚙️ Requisitos Previos
1. **Node.js** (versión 18 o superior recomendada).
2. **pnpm** (recomendado para consistencia con los archivos de bloqueo `pnpm-lock.yaml`). Instálalo ejecutando:
   ```bash
   npm install -g pnpm
   ```

---

### 🟢 PASO 1: Levantar el Backend (Puerto 3001)

El servidor Express se encarga del login, validación de sesiones y listado de usuarios.

1. Abre tu terminal y dirígete al directorio `backend`:
   ```bash
   cd backend
   ```
2. Instala las dependencias:
   ```bash
   pnpm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   node server.js
   ```
   * **💡 Nota de Resiliencia:** Si la conexión a MySQL no está activa, el servidor mostrará una advertencia en la consola y **se adaptará de inmediato para usar `usuarios.json`**. El backend funcionará perfectamente al instante con las siguientes credenciales:
     * **Usuario:** `admin` | **Contraseña:** `1234`
     * **Usuario:** `pablo` | **Contraseña:** `1235`

---

### 🔵 PASO 2: Levantar el Frontend (Puerto 5173)

El frontend contiene la landing page premium con tarjetas de información, validación en tiempo real y el dashboard de stock protegido.

1. En una **nueva ventana/pestaña de la terminal**, dirígete a `frontend`:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   pnpm install
   ```
3. Levanta el servidor de desarrollo:
   ```bash
   pnpm start
   ```
4. Abre [http://localhost:5173/](http://localhost:5173/) en tu navegador.

---

## 🗄️ Configuración de MySQL (Opcional)

Si deseas conectar el backend a una base de datos MySQL real para verificar las credenciales y cumplir con el flujo completo de base de datos:

1. **Importa la estructura:** Ejecuta el archivo [schema.sql](file:///c:/Users/warsh/Programacion/SuperMercadoMass/backend/schema.sql) en tu gestor de base de datos MySQL (phpMyAdmin, Workbench, o CLI) para crear la base de datos `supermercado_mass` y la tabla `usuarios` poblada.
2. **Crear archivo de entorno:** En la carpeta `backend/`, duplica el archivo `.env.example` y cámbiale el nombre a `.env`.
3. **Configura el entorno:** Abre el nuevo archivo [backend/.env](file:///c:/Users/warsh/Programacion/SuperMercadoMass/backend/.env) y asegúrate de que los valores coincidan con tu servidor MySQL:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_contraseña_aqui
   DB_NAME=supermercado_mass
   DB_PORT=3306
   ```
4. **Reinicia el backend**: Al ejecutar `node server.js`, verás el mensaje: `✅ [DB] Conexión establecida exitosamente con MySQL`. El sistema pasará a validar los logins directamente contra tu tabla de base de datos.

---

## 🔒 Detalles de Seguridad Implementados

* **JWT (JSON Web Tokens):** Las sesiones se firman con un token seguro en el backend al realizar login exitoso y se configuran con expiración de 8 horas.
* **LocalStorage:** El token JWT y el perfil de usuario se almacenan en el navegador para mantener la persistencia.
* **Componente de Ruta Protegida:** Si intentas forzar el acceso a `http://localhost:5173/homeInventario` sin tener una sesión activa en `localStorage`, la app te redirigirá automáticamente a la landing page principal.
* **Validación Dinámica:** En el login, si el usuario incluye un `@`, se aplica una validación estricta por expresión regular para garantizar que sea un correo electrónico válido, previniendo errores antes de mandar datos a la API.
