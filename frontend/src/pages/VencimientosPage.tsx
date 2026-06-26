import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTriangleExclamation, 
  faRotateRight,
  faCalendarDays
} from "@fortawesome/free-solid-svg-icons";
import Layout from "../components/Layout";

interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  id_categoria: number | null;
  precio_compra: number;
  precio: number;
  stock: number;
  stockMinimo: number;
  unidad_medida: string;
  proveedor: string;
  id_proveedor: number | null;
  fechaVencimiento: string;
}

export default function VencimientosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("http://localhost:3001/api/productos");
      if (!response.ok) throw new Error("Error al obtener la lista de productos");
      const prodsData = await response.json();
      setProductos(prodsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // Expiration Calculations
  const vencimientoProximo = productos.filter(p => {
    if (!p.fechaVencimiento) return false;
    const hoy = new Date();
    const vencimiento = new Date(p.fechaVencimiento);
    const diferenciaDias = (vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
    return diferenciaDias >= 0 && diferenciaDias <= 15;
  }).length;

  const vencidos = productos.filter(p => {
    if (!p.fechaVencimiento) return false;
    const hoy = new Date();
    const vencimiento = new Date(p.fechaVencimiento);
    const diferenciaDias = (vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
    return diferenciaDias < 0;
  }).length;

  // getVencimientoBadge helper removed

  return (
    <Layout>
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm animate-fadeIn">
          <svg className="animate-spin h-10 w-10 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h3 className="text-base font-bold text-slate-700">Cargando vencimientos...</h3>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-16 bg-red-50 rounded-3xl border border-red-200 p-8 shadow-sm animate-fadeIn">
          <FontAwesomeIcon icon={faTriangleExclamation} className="text-4xl text-red-500 mb-3" />
          <h3 className="text-lg font-bold text-red-950">Error al cargar datos</h3>
          <p className="text-sm text-red-800 mt-1 mb-6">{error}</p>
          <button
            onClick={fetchData}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
            Intentar de nuevo
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-8 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 mb-2">Auditoría de Frescura y Fechas de Caducidad</h3>
            <p className="text-xs text-slate-400 mb-6">Listado de productos organizados por nivel de urgencia de vencimiento en almacén</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Caja de Vencidos */}
              <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100">
                <h4 className="font-extrabold text-red-950 text-sm flex items-center gap-2 mb-3">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-600" />
                  Mercadería Vencida (Retiro Inmediato)
                </h4>
                <span className="text-2xl font-black text-red-600">{vencidos}</span>
                <p className="text-xs text-red-800 mt-1">
                  Productos cuya fecha de consumo preferente ya expiró. Representa merma contable y debe ser dada de baja de las góndolas.
                </p>
              </div>

              {/* Caja de Críticos */}
              <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100">
                <h4 className="font-extrabold text-orange-950 text-sm flex items-center gap-2 mb-3">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-orange-500" />
                  Vencimiento Crítico (Menos de 7 días)
                </h4>
                <span className="text-2xl font-black text-orange-600">{vencimientoProximo}</span>
                <p className="text-xs text-orange-800 mt-1">
                  Alimentos o perecibles próximos a vencer. Se recomienda aplicar descuentos promocionales o reubicar en exhibición destacada.
                </p>
              </div>
            </div>

            {/* Tabla de Alertas */}
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Producto</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Restante</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha de Expiración</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Estado Alerta</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {productos
                    .filter(p => p.fechaVencimiento)
                    .map((p) => {
                      const hoy = new Date();
                      const venc = new Date(p.fechaVencimiento);
                      const diffTime = venc.getTime() - hoy.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      let badgeColor = "bg-green-100 text-green-800";
                      let statusText = "Vigente";

                      if (diffDays < 0) {
                        badgeColor = "bg-red-100 text-red-800 font-bold";
                        statusText = "EXPIRED";
                      } else if (diffDays <= 7) {
                        badgeColor = "bg-orange-100 text-orange-800 font-bold animate-pulse";
                        statusText = "CRITICAL";
                      } else if (diffDays <= 30) {
                        badgeColor = "bg-yellow-100 text-yellow-800";
                        statusText = "SÓLO DIAS";
                      }

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">
                            {p.codigo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                            {p.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-700">
                            {p.stock}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-mono">
                            {p.fechaVencimiento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-xs">
                            <span className={`px-2.5 py-1 inline-flex leading-5 rounded-lg ${badgeColor}`}>
                              {statusText} ({diffDays < 0 ? "Vencido" : `${diffDays} días`})
                            </span>
                          </td>
                        </tr>
                      );
                    })}

                  {productos.filter(p => p.fechaVencimiento).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                        No hay productos registrados con lotes de fecha de vencimiento activa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
