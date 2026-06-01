import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import logoMass from "../assets/massLogo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEye, 
  faEyeSlash, 
  faUser, 
  faLock,
  faBoxesStacked,
  faTriangleExclamation,
  faChartPie,
  faEnvelope
} from '@fortawesome/free-solid-svg-icons';
import '../index.css';

export default function HomeLogin() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usuarioError, setUsuarioError] = useState("");

  // Validación de formato de email utilizando expresión regular estándar
  const validarEmail = (email: string) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  };

  const handleUsuarioChange = (val: string) => {
    setUsuario(val);
    setUsuarioError("");
    setError("");

    // Si el usuario intenta escribir un email (contiene @), validamos el formato sobre la marcha
    if (val.includes("@")) {
      if (!validarEmail(val)) {
        setUsuarioError("Formato de correo electrónico inválido");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUsuarioError("");

    // 1. Validaciones básicas en el Front-end
    if (!usuario || !password) {
      setError("Por favor, complete todos los campos obligatorios");
      return;
    }

    // 2. Validación estricta si es formato de correo
    if (usuario.includes("@") && !validarEmail(usuario)) {
      setUsuarioError("Debe ingresar un correo electrónico válido");
      return;
    }

    try {
      setLoading(true);

      // Conectamos con el backend API REST
      const response = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ usuario, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Credenciales incorrectas");
      }

      // Guardamos la sesión en localStorage
      localStorage.setItem("mass_session_token", data.token);
      localStorage.setItem("mass_session_user", JSON.stringify(data.user));

      console.log("✅ Autenticación exitosa:", data.user);
      
      // Redirección al dashboard principal
      navigate("/homeInventario");

    } catch (err: any) {
      console.error("Error al iniciar sesión:", err.message);
      setError(err.message || "No se pudo conectar con el servidor de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      
      {/* Fondo Decorativo de Gradiente Abstracto */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] rounded-full bg-yellow-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[70%] rounded-full bg-orange-600/15 blur-[150px]"></div>
      </div>

      {/* Cabecera / Logo */}
      <div className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10 relative">
        <img
          src={logoMass}
          alt="Logo MASS"
          className="h-14 w-auto object-contain hover:scale-105 transition-transform duration-300"
        />
        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-slate-400 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/50 uppercase">
          Portal de Personal Interno
        </span>
      </div>

      {/* Sección Principal Dual */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center z-10 relative">
        
        {/* Lado Izquierdo: Información del Sistema */}
        <div className="lg:col-span-7 text-left space-y-8">
          <div>
            <span className="px-3.5 py-1.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-950 font-extrabold text-xs tracking-wider rounded-xl uppercase leading-none inline-block shadow-sm">
              Sistema de Gestión Interna
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mt-4 tracking-tight leading-none">
              Mass <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Inventory Control</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base md:text-lg mt-5 leading-relaxed max-w-xl">
              Plataforma digital interna para operadores y administradores de Supermercado Mass. Diseñado para centralizar la auditoría de stock, control de frescura y reportes de almacén.
            </p>
          </div>

          {/* Tarjetas Informativas Premium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Tarjeta 1 */}
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 border border-slate-700/40 hover:border-yellow-400/30 transition-all duration-300 hover:translate-y-[-2px] group">
              <div className="p-3 bg-yellow-400/10 text-yellow-400 rounded-xl w-fit group-hover:bg-yellow-400 group-hover:text-slate-950 transition-colors">
                <FontAwesomeIcon icon={faBoxesStacked} className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-sm mt-4">Control de Existencias</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Supervisión de stock mínimo, alertas automatizadas y reabastecimiento en tiempo real.
              </p>
            </div>

            {/* Tarjeta 2 */}
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 border border-slate-700/40 hover:border-orange-500/30 transition-all duration-300 hover:translate-y-[-2px] group">
              <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl w-fit group-hover:bg-orange-500 group-hover:text-slate-950 transition-colors">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-sm mt-4">Gestión de Vencimientos</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Control de fechas críticas de alimentos frescos para minimizar mermas y asegurar calidad.
              </p>
            </div>

            {/* Tarjeta 3 */}
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 border border-slate-700/40 hover:border-blue-400/30 transition-all duration-300 hover:translate-y-[-2px] group">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit group-hover:bg-blue-50/90 group-hover:text-slate-950 transition-colors">
                <FontAwesomeIcon icon={faChartPie} className="text-lg" />
              </div>
              <h3 className="font-bold text-white text-sm mt-4">Auditoría y Reportes</h3>
              <p className="text-slate-400 text-xs mt-2 leading-relaxed">
                Visualización instantánea de resúmenes de almacén y rendimiento de inventario por categoría.
              </p>
            </div>
          </div>
        </div>

        {/* Lado Derecho: Formulario de Login Centrado (Glassmorphism) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden">
            
            {/* Detalle decorativo de color en la parte superior del formulario */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-extrabold text-white">Ingreso al Portal</h2>
              <p className="text-slate-400 text-xs mt-1.5">Ingrese sus credenciales de seguridad asignadas</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Campo Usuario / Correo */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <FontAwesomeIcon icon={usuario.includes("@") ? faEnvelope : faUser} />
                  </span>
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => handleUsuarioChange(e.target.value)}
                    placeholder="Ej: admin o usuario@mass.pe"
                    className={`w-full bg-slate-950/80 border text-slate-100 rounded-xl py-3 px-4 pl-10.5 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm placeholder:text-slate-600 ${
                      usuarioError ? "border-red-500 focus:ring-red-500" : "border-slate-700"
                    }`}
                  />
                </div>
                {usuarioError && (
                  <span className="text-[11px] text-red-400 mt-1 block font-medium">
                    {usuarioError}
                  </span>
                )}
              </div>

              {/* Campo Contraseña */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Contraseña de Seguridad
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <FontAwesomeIcon icon={faLock} />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-950/80 border border-slate-700 text-slate-100 rounded-xl py-3 px-4 pl-10.5 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all text-sm placeholder:text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              {/* Bloque de Error General */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs font-medium leading-relaxed">
                  ⚠️ {error}
                </div>
              )}

              {/* Botón de Ingreso */}
              <button
                type="submit"
                disabled={loading || !!usuarioError}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 py-3.5 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-orange-500/10 text-sm cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Validando Credenciales...
                  </span>
                ) : (
                  "INGRESAR AL SISTEMA"
                )}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-700/50 pt-5 text-center">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Este portal está estrictamente reservado para fines operativos internos. El uso indebido o el acceso no autorizado está sujeto a auditorías de seguridad informática.
              </p>
            </div>

          </div>
        </div>

      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}