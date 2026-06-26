import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faRightFromBracket, 
  faCircleUser, 
  faInbox, 
  faChartSimple, 
  faBell, 
  faWarehouse
} from "@fortawesome/free-solid-svg-icons";
import logoMass from "../assets/massLogo.png";
import Footer from "./Footer";

interface UserSession {
  id: number;
  usuario: string;
  nombre: string;
  rol: string;
}

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<UserSession | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem("mass_session_user");
    if (userString) {
      try {
        setUser(JSON.parse(userString));
      } catch (e) {
        console.error("Error al parsear el usuario", e);
        handleLogout();
      }
    } else {
      handleLogout();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("mass_session_token");
    localStorage.removeItem("mass_session_user");
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Navbar Superior Premium */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logoMass} alt="Logo Mass" className="h-20 w-auto object-contain" />
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <span className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">
              Control de Almacén
            </span>
          </div>

          {/* User profile & controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 transition-colors py-2 px-4 rounded-xl border border-slate-200">
              <FontAwesomeIcon icon={faCircleUser} className="text-slate-600 text-xl" />
              <div className="text-left hidden md:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">
                  {user?.nombre || "Cargando..."}
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase leading-none mt-0.5">
                  {user?.rol === "administrador" ? "Administrador" : "Operador"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center gap-2 border border-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              title="Cerrar Sesión"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
      </header>

      {/* Main Wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Banner de Bienvenida */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-800 to-slate-950 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-md mb-8 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-12 translate-x-12">
            <FontAwesomeIcon icon={faWarehouse} className="text-[220px] text-white" />
          </div>
          <div className="max-w-2xl relative z-10">
            <span className="px-3.5 py-1 bg-yellow-400 text-slate-950 text-xs font-black uppercase rounded-lg tracking-wider mb-4 inline-block">
              Portal Interno
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 tracking-tight text-white">
              ¡Bienvenido al Control de Stock!
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Supervisa las existencias en tiempo real, administra la frescura de los alimentos perecibles y audita la valorización total de tu local comercial.
            </p>
          </div>
        </div>

        {/* NAVEGACIÓN Y MENÚ DE PESTAÑAS (Rutas Separadas) */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-2 bg-slate-100/80 p-1.5 rounded-2xl">
          <button
            onClick={() => navigate("/homeInventario")}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
              isActive("/homeInventario")
                ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <FontAwesomeIcon icon={faInbox} />
            <span>Lista de Productos</span>
          </button>

          <button
            onClick={() => navigate("/metricas")}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
              isActive("/metricas")
                ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <FontAwesomeIcon icon={faChartSimple} />
            <span>Métricas & Valoración</span>
          </button>

          <button
            onClick={() => navigate("/vencimientos")}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
              isActive("/vencimientos")
                ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <FontAwesomeIcon icon={faBell} />
            <span>Control de Vencimientos</span>
          </button>
        </div>

        {/* Contenido Dinámico de la Página */}
        {children}

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
