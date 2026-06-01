# Mass Inventory Control - Frontend 🛒💻

Este es el cliente web (SPA) para el sistema de control de existencias de **Supermercado Mass**. Está construido con tecnologías modernas y estructurado para ofrecer una experiencia de usuario rápida, premium y completamente responsiva.

---

## 🛠️ Tecnologías Utilizadas

* **React 19** - Librería para la interfaz de usuario.
* **TypeScript** - Tipado estático para un código libre de errores en compilación.
* **Vite** - Bundler de última generación ultrarrápido.
* **TailwindCSS v4** - Estilos modernos basados en componentes y variables CSS.
* **React Router v7** - Enrutador dinámico y protección de rutas privadas.
* **FontAwesome** - Set de íconos vectoriales premium para micro-interacciones.

---

## ⚡ Guía de Inicio

### 1. Requisitos Previos
Asegúrate de tener instalado **Node.js** y **pnpm** (gestor de paquetes recomendado).

### 2. Instalación de Dependencias
Ejecuta desde esta carpeta:
```bash
pnpm install
```

### 3. Ejecutar en Modo Desarrollo
Inicia el servidor de desarrollo de Vite:
```bash
pnpm start
```
La aplicación estará disponible por defecto en [http://localhost:5173/](http://localhost:5173/).

---

## 🔒 Rutas y Seguridad del Cliente

* **`/` (HomeLogin):** Landing page de bienvenida interna y formulario de acceso seguro. Cuenta con:
  - Botón para revelar contraseñas.
  - Validación dinámica de nombre de usuario y formato de email.
  - Conexión a la API del backend.
* **`/homeInventario` (Dashboard):** Vista protegida por el componente `ProtectedRoute`. Requiere la presencia de un token JWT en el `localStorage` del navegador. Si no se detecta la sesión, la ruta redirige automáticamente al portal de login `/`.
* **Cierre de Sesión Seguro:** Al presionar "Cerrar Sesión", la aplicación limpia de inmediato las llaves `mass_session_token` y `mass_session_user` del `localStorage` y devuelve al usuario a la página de ingreso.

> [!NOTE]
> Para ver las instrucciones detalladas del proyecto completo (incluyendo el levantamiento de la base de datos MySQL y la API REST del backend), por favor consulta el [README.md principal de la raíz](file:///c:/Users/warsh/Programacion/SuperMercadoMass/README.md).
