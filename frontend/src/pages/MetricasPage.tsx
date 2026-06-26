import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTriangleExclamation, 
  faRotateRight,
  faChartSimple,
  faCoins
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

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string;
}

export default function MetricasPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [resProds, resCats] = await Promise.all([
        fetch("http://localhost:3001/api/productos"),
        fetch("http://localhost:3001/api/categorias")
      ]);

      if (!resProds.ok) throw new Error("Error al obtener la lista de productos");
      const prodsData = await resProds.json();
      setProductos(prodsData);

      if (resCats.ok) {
        const catsData = await resCats.json();
        setCategorias(catsData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  // Calculations
  const stockBajo = productos.filter(p => p.stock <= p.stockMinimo).length;
  const sinStock = productos.filter(p => p.stock === 0).length;

  const valorTotalInventario = productos.reduce((sum, p) => sum + (p.stock * p.precio), 0);
  const costoTotalInventario = productos.reduce((sum, p) => sum + (p.stock * p.precio_compra), 0);
  const gananciaPotencial = valorTotalInventario - costoTotalInventario;
  const margenPromedio = valorTotalInventario > 0 ? (gananciaPotencial / valorTotalInventario) * 100 : 0;

  const metricasPorCategoria = categorias.map(cat => {
    const prods = productos.filter(p => p.id_categoria === cat.id || p.categoria === cat.nombre);
    const stock = prods.reduce((sum, p) => sum + p.stock, 0);
    const valorVenta = prods.reduce((sum, p) => sum + (p.stock * p.precio), 0);
    return {
      id: cat.id,
      nombre: cat.nombre,
      prodsCount: prods.length,
      stockTotal: stock,
      valorVentaTotal: valorVenta
    };
  }).sort((a, b) => b.valorVentaTotal - a.valorVentaTotal);

  const topValuedProducts = [...productos]
    .map(p => ({
      ...p,
      valorTotal: p.stock * p.precio
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 5);

  return (
    <Layout>
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm animate-fadeIn">
          <svg className="animate-spin h-10 w-10 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <h3 className="text-base font-bold text-slate-700">Cargando métricas...</h3>
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
          {/* Grilla Superior de Valorización Financiera */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Costo de Adquisición</span>
                <h4 className="text-3xl font-black text-slate-900 mt-2">
                  S/ {costoTotalInventario.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-4 border-t border-slate-100 pt-3">
                Capital total invertido en mercadería activa.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Valor de Venta Estimado</span>
                <h4 className="text-3xl font-black text-slate-900 mt-2">
                  S/ {valorTotalInventario.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-4 border-t border-slate-100 pt-3">
                Retorno total en caja esperado.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ganancia Estimada</span>
                <h4 className="text-3xl font-black text-emerald-600 mt-2">
                  S/ {gananciaPotencial.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h4>
              </div>
              <p className="text-xs text-emerald-600 font-bold mt-4 border-t border-slate-100 pt-3">
                Margen bruto: S/ {gananciaPotencial > 0 ? `+${gananciaPotencial.toFixed(2)}` : "S/ 0.00"}
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Margen de Ganancia Promedio</span>
                <h4 className="text-3xl font-black text-blue-600 mt-2">
                  {margenPromedio.toFixed(1)}%
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-4 border-t border-slate-100 pt-3">
                Porcentaje de utilidad bruta sobre el total.
              </p>
            </div>
          </div>

          {/* Dos Columnas: Distribución por Categorías y Top Productos */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Distribución por Categorías */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faChartSimple} className="text-orange-500" />
                Distribución Financiera por Categorías
              </h3>

              <div className="space-y-6">
                {metricasPorCategoria.map((cat, index) => {
                  const porcentaje = valorTotalInventario > 0 
                    ? (cat.valorVentaTotal / valorTotalInventario) * 100 
                    : 0;

                  const colors = [
                    "bg-blue-600",
                    "bg-amber-500",
                    "bg-emerald-500",
                    "bg-purple-500",
                    "bg-rose-500"
                  ];
                  const colorBar = colors[index % colors.length];

                  return (
                    <div key={cat.id} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold text-slate-800">{cat.nombre}</span>
                        <span className="font-mono text-slate-500">
                          S/ {cat.valorVentaTotal.toLocaleString("es-PE", { maximumFractionDigits: 0 })} ({porcentaje.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${colorBar} transition-all duration-1000`} 
                          style={{ width: `${porcentaje}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>{cat.prodsCount} productos en catálogo</span>
                        <span>Stock total: {cat.stockTotal} unidades</span>
                      </div>
                    </div>
                  );
                })}

                {metricasPorCategoria.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">No hay datos por clasificar.</p>
                )}
              </div>
            </div>

            {/* Inventario de Alto Valor */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faCoins} className="text-emerald-500" />
                Productos de Mayor Valorización
              </h3>

              <div className="divide-y divide-slate-100">
                {topValuedProducts.map((p, idx) => (
                  <div key={p.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <span className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight truncate max-w-[200px]">
                          {p.nombre}
                        </h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {p.codigo} · {p.stock} uds · S/ {p.precio.toFixed(2)} c/u
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">
                        S/ {(p.stock * p.precio).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}

                {topValuedProducts.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-6">No hay productos en inventario.</p>
                )}
              </div>
            </div>
          </div>

          {/* Rotación y Estados Especiales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                Sin Existencias (Quiebres de Stock)
              </h4>
              <p className="text-3xl font-black text-red-600">{sinStock}</p>
              <p className="text-xs text-slate-400 mt-2">Productos que tienen actualmente stock 0 y requieren compra inmediata.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                Bajos de Stock (Punto de Reorden)
              </h4>
              <p className="text-3xl font-black text-orange-600">{stockBajo}</p>
              <p className="text-xs text-slate-400 mt-2">Productos en o por debajo de su stock mínimo de seguridad.</p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                En Stock Seguro
              </h4>
              <p className="text-3xl font-black text-emerald-600">{productos.length - stockBajo}</p>
              <p className="text-xs text-slate-400 mt-2">Productos cuyos niveles exceden el umbral mínimo asignado.</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
