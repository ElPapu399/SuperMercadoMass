import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faRightFromBracket, 
  faBoxesStacked, 
  faTriangleExclamation, 
  faCalendarDays, 
  faMagnifyingGlass,
  faPlus,
  faCircleUser,
  faRotateRight,
  faChevronDown
} from "@fortawesome/free-solid-svg-icons";
import logoMass from "../assets/massLogo.png";
import Footer from "../components/Footer";

interface UserSession {
  id: number;
  usuario: string;
  nombre: string;
  rol: string;
}

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  stock: number;
  stockMinimo: number;
  precio: number;
  fechaVencimiento: string;
}

const PRODUCTOS_INICIALES: Producto[] = [
  { id: "1", codigo: "P001", nombre: "Leche Gloria Entera UHT 1L", categoria: "Lácteos", stock: 120, stockMinimo: 30, precio: 4.90, fechaVencimiento: "2026-08-15" },
  { id: "2", codigo: "P002", nombre: "Arroz Costeño Extra Superior 5kg", categoria: "Abarrotes", stock: 8, stockMinimo: 15, precio: 22.50, fechaVencimiento: "2027-01-10" },
  { id: "3", codigo: "P003", nombre: "Atún Real en Trozos de Aceite 170g", categoria: "Conservas", stock: 45, stockMinimo: 10, precio: 6.50, fechaVencimiento: "2026-06-15" },
  { id: "4", codigo: "P004", nombre: "Yogurt Gloria de Fresa 1L", categoria: "Lácteos", stock: 18, stockMinimo: 12, precio: 7.20, fechaVencimiento: "2026-06-03" },
  { id: "5", codigo: "P005", nombre: "Fideos Don Vittorio Spaguetti 950g", categoria: "Abarrotes", stock: 80, stockMinimo: 20, precio: 4.50, fechaVencimiento: "2027-03-20" },
  { id: "6", codigo: "P006", nombre: "Aceite Primor Premium 1L", categoria: "Abarrotes", stock: 5, stockMinimo: 10, precio: 11.80, fechaVencimiento: "2026-11-05" },
  { id: "7", codigo: "P007", nombre: "Detergente Bolívar Flores de Limón 800g", categoria: "Limpieza", stock: 35, stockMinimo: 8, precio: 9.90, fechaVencimiento: "2029-12-31" }
];

export default function HomeInventario() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("Todos");
  const [productos, setProductos] = useState<Producto[]>(PRODUCTOS_INICIALES);
  
  // Cargar sesión del usuario desde localStorage al montar el componente
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

  // Cálculos estadísticos interactivos
  const totalProductos = productos.length;
  
  const stockBajo = productos.filter(p => p.stock <= p.stockMinimo).length;
  
  const vencimientoProximo = productos.filter(p => {
    const hoy = new Date();
    const vencimiento = new Date(p.fechaVencimiento);
    const diferenciaDias = (vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
    return diferenciaDias >= 0 && diferenciaDias <= 15; // Próximos 15 días
  }).length;

  const valorTotalInventario = productos.reduce((sum, p) => sum + (p.stock * p.precio), 0);

  // Filtrado de productos basado en búsqueda y categoría
  const productosFiltrados = productos.filter(p => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = filterCategoria === "Todos" || p.categoria === filterCategoria;
    
    return matchesSearch && matchesCategory;
  });

  const categorias = ["Todos", ...Array.from(new Set(productos.map(p => p.categoria)))];

  // Helper para verificar días de vencimiento
  const getVencimientoBadge = (fecha: string) => {
    const hoy = new Date();
    const venc = new Date(fecha);
    const diffTime = venc.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
          Vencido ({fecha})
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 animate-pulse">
          Crítico: {diffDays} días ({fecha})
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
          Próximo ({fecha})
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          Vigente ({fecha})
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-200 to-orange-400 text-slate-800 flex flex-col">
      {/* Navbar Superior Premium */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logoMass} alt="Logo Mass" className="h-24 w-auto object-contain" />
            <div className="h-8 w-px bg-slate-300 hidden sm:block"></div>
            <span className="text-xl font-bold tracking-tight text-slate-900 hidden sm:block">
              Inventory Control
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-100 hover:bg-slate-200/80 transition-colors py-2 px-4 rounded-xl border border-slate-200">
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
              className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center gap-2 border border-red-200 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              title="Cerrar Sesión"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Banner de Bienvenida */}
        <div className="bg-gradient-to-r from-blue-800 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-12 translate-x-12">
            <FontAwesomeIcon icon={faBoxesStacked} className="text-[200px] text-white" />
          </div>
          <div className="max-w-2xl relative z-10">
            <span className="px-3 py-1 bg-yellow-400 text-slate-950 text-xs font-bold uppercase rounded-full leading-none tracking-wider mb-4 inline-block">
              Portal Interno
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold mb-2 tracking-tight">
              ¡Bienvenido al Control de Stock, {user?.nombre}!
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Supervisa las existencias en tiempo real, administra fechas de vencimiento de alimentos y genera reportes de inventario al instante para mantener la operatividad óptima del supermercado.
            </p>
          </div>
        </div>

        {/* Módulos / Estadísticas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Total Stock */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 flex items-center gap-5">
            <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
              <FontAwesomeIcon icon={faBoxesStacked} className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Productos Totales</p>
              <h3 className="text-[25px] font-bold text-slate-900 mt-1">{totalProductos}</h3>
              <p className="text-xs text-blue-600 font-medium mt-1">Registrados en sistema</p>
            </div>
          </div>

          {/* Card 2: Stock Crítico */}
          <div className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 flex items-center gap-5 ${stockBajo > 0 ? "border-l-4 border-l-orange-500" : ""}`}>
            <div className={`p-4 rounded-xl ${stockBajo > 0 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-600"}`}>
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Bajo Mínimo</p>
              <h3 className="text-[25px] font-bold text-slate-900 mt-1">{stockBajo}</h3>
              <p className={`text-xs font-medium mt-1 ${stockBajo > 0 ? "text-orange-600 font-semibold" : "text-slate-50"}`}>
                {stockBajo > 0 ? "Requiere reabastecimiento" : "Niveles en regla"}
              </p>
            </div>
          </div>

          {/* Card 3: Vencimiento Próximo */}
          <div className={`bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 flex items-center gap-5 ${vencimientoProximo > 0 ? "border-l-4 border-l-red-500" : ""}`}>
            <div className={`p-4 rounded-xl ${vencimientoProximo > 0 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-50 text-slate-600"}`}>
              <FontAwesomeIcon icon={faCalendarDays} className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimientos Próximos</p>
              <h3 className="text-[25px] font-bold text-slate-900 mt-1">{vencimientoProximo}</h3>
              <p className={`text-xs font-medium mt-1 ${vencimientoProximo > 0 ? "text-red-600 font-semibold" : "text-slate-50"}`}>
                {vencimientoProximo > 0 ? "Menos de 15 días restantes" : "Sin alertas inmediatas"}
              </p>
            </div>
          </div>

          {/* Card 4: Valor de Inventario */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 flex items-center gap-5">
            <div className="p-4 rounded-xl bg-green-50 text-green-600">
              <span className="text-2xl font-extrabold">S/</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor Estimado</p>
              <h3 className="text-[20px] font-bold text-slate-900 mt-1">S/ {valorTotalInventario.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-xs text-green-600 font-medium mt-1">Precio venta al público</p>
            </div>
          </div>
        </div>

        {/* Panel de Tabla de Inventario y Controles */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Cabecera del Panel */}
          <div className="p-6 sm:p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Control de Existencias</h2>
              <p className="text-xs text-slate-500 mt-0.5">Visualización y filtrado de productos en inventario</p>
            </div>
            
            {/* Buscador y Filtros */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] sm:flex-initial">
                <input
                  type="text"
                  placeholder="Buscar por código, nombre o categoría..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-800 rounded-xl py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all"
                />
                <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              </div>

              {/* Selector de Categorías */}
              <div className="relative">
                <select
                  value={filterCategoria}
                  onChange={(e) => setFilterCategoria(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-300 text-slate-800 rounded-xl py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all cursor-pointer font-medium"
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat === "Todos" ? "Todas las Categorías" : cat}</option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
              </div>

              {/* Botón de Reset / Actualizar */}
              <button
                onClick={() => { setSearchTerm(""); setFilterCategoria("Todos"); setProductos(PRODUCTOS_INICIALES); }}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                title="Restablecer filtros"
              >
                <FontAwesomeIcon icon={faRotateRight} />
              </button>
            </div>
          </div>

          {/* Tabla de Productos Responsiva */}
          <div className="overflow-x-auto">
            {productosFiltrados.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Categoría</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Precio</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Vencimiento</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {productosFiltrados.map((prod) => {
                    const esBajoStock = prod.stock <= prod.stockMinimo;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-slate-600">
                          {prod.codigo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                          {prod.nombre}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {prod.categoria}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <span className={`px-3 py-1 rounded-lg font-bold ${esBajoStock ? "bg-orange-100 text-orange-800" : "bg-slate-100 text-slate-800"}`}>
                            {prod.stock} / <span className="text-slate-400 font-normal text-xs">min {prod.stockMinimo}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-900">
                          S/ {prod.precio.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          {getVencimientoBadge(prod.fechaVencimiento)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-semibold">
                          {esBajoStock ? (
                            <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-lg bg-red-100 text-red-800 uppercase">
                              Reabastecer
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 inline-flex text-[10px] leading-5 font-bold rounded-lg bg-green-100 text-green-800 uppercase">
                              Disponible
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16 px-4">
                <FontAwesomeIcon icon={faBoxesStacked} className="text-5xl text-slate-300 mb-4 animate-bounce" />
                <h3 className="text-lg font-bold text-slate-900">No se encontraron productos</h3>
                <p className="text-sm text-slate-500 mt-1">Intenta ajustando tu término de búsqueda o filtros.</p>
              </div>
            )}
          </div>
          
          {/* Footer del Panel */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <p>Mostrando {productosFiltrados.length} de {productos.length} productos registrados</p>
            <p className="hidden sm:block">Filtros Activos: Búsqueda "{searchTerm || 'Ninguna'}", Categoría "{filterCategoria}"</p>
          </div>

        </div>

      </main>
    </div>
  );
}
