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
  faChevronDown,
  faTrash,
  faPen,
  faChartSimple,
  faBell,
  faCircleCheck,
  faCoins,
  faInbox,
  faWarehouse,
  faXmark,
  faChevronLeft,
  faChevronRight,
  faImage
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
  id: number;
  codigo: string; // SKU
  nombre: string;
  categoria: string;
  id_categoria: number | null;
  precio_compra: number;
  precio: number; // Precio Venta
  stock: number; // Stock Actual
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

interface Proveedor {
  id: number;
  nombre: string;
  contacto: string;
  telefono: string;
  email: string;
  direccion: string;
}

export default function HomeInventario() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  
  // API State
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<"inventario" | "metricas" | "alertas">("inventario");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("Todos");

  // Pagination (Punto 1 del Checklist)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Modals & Mode
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Producto | null>(null);
  const [editProduct, setEditProduct] = useState<Producto | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State (Punto 6 del Checklist)
  const [formData, setFormData] = useState({
    sku: "",
    nombre: "",
    id_categoria: "",
    precio_compra: "",
    precio_venta: "",
    stock_actual: "",
    stock_minimo: "10",
    unidad_medida: "Unidades",
    id_proveedor: "",
    fecha_vencimiento: "",
    numero_lote: ""
  });

  const [formError, setFormError] = useState("");

  // Helper for toast notifications
  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check login session & Load initial data
  useEffect(() => {
    const userString = localStorage.getItem("mass_session_user");
    if (userString) {
      try {
        setUser(JSON.parse(userString));
      } catch (e) {
        console.error("Error al parsear el usuario", e);
        handleLogout();
        return;
      }
    } else {
      handleLogout();
      return;
    }

    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const [resProds, resCats, resProvs] = await Promise.all([
        fetch("http://localhost:3001/api/productos"),
        fetch("http://localhost:3001/api/categorias"),
        fetch("http://localhost:3001/api/proveedores")
      ]);

      if (!resProds.ok) throw new Error("Error al obtener la lista de productos");
      
      const prodsData = await resProds.json();
      setProductos(prodsData);

      if (resCats.ok) {
        const catsData = await resCats.json();
        setCategorias(catsData);
      }

      if (resProvs.ok) {
        const provsData = await resProvs.json();
        setProveedores(provsData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo conectar con el servidor backend");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mass_session_token");
    localStorage.removeItem("mass_session_user");
    navigate("/");
  };

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCategoria]);

  // ----------------------------------------------------
  // CALCULOS DE METRICAS
  // ----------------------------------------------------
  const totalProductos = productos.length;
  const stockBajo = productos.filter(p => p.stock <= p.stockMinimo).length;
  
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

  const valorTotalInventario = productos.reduce((sum, p) => sum + (p.stock * p.precio), 0);
  const costoTotalInventario = productos.reduce((sum, p) => sum + (p.stock * p.precio_compra), 0);
  const gananciaPotencial = valorTotalInventario - costoTotalInventario;
  const margenPromedio = valorTotalInventario > 0 ? (gananciaPotencial / valorTotalInventario) * 100 : 0;
  const sinStock = productos.filter(p => p.stock === 0).length;

  // Filtrado de productos basado en búsqueda y categoría (Punto 4 del Checklist)
  const productosFiltrados = productos.filter(p => {
    const matchesSearch = 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.proveedor.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesCategory = filterCategoria === "Todos" || p.categoria === filterCategoria;
    
    return matchesSearch && matchesCategory;
  });

  // Paginación en cliente (Punto 1 del Checklist)
  const totalItemsFiltrados = productosFiltrados.length;
  const totalPages = Math.ceil(totalItemsFiltrados / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = productosFiltrados.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const listadoCategorias = ["Todos", ...Array.from(new Set(productos.map(p => p.categoria)))];

  // Helper para verificar días de vencimiento
  const getVencimientoBadge = (fecha: string) => {
    if (!fecha) {
      return (
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-500">
          Sin fecha
        </span>
      );
    }

    const hoy = new Date();
    const venc = new Date(fecha);
    const diffTime = venc.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800">
          Vencido ({fecha})
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-orange-100 text-orange-800 animate-pulse">
          Crítico: {diffDays} d ({fecha})
        </span>
      );
    } else if (diffDays <= 30) {
      return (
        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-yellow-100 text-yellow-800">
          Próximo ({fecha})
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          Vigente ({fecha})
        </span>
      );
    }
  };

  // ----------------------------------------------------
  // GESTION DE FORMULARIO E INSERCION / EDICION
  // ----------------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError("");
  };

  const openAddModal = () => {
    setEditProduct(null);
    setFormData({
      sku: "",
      nombre: "",
      id_categoria: "",
      precio_compra: "",
      precio_venta: "",
      stock_actual: "",
      stock_minimo: "10",
      unidad_medida: "Unidades",
      id_proveedor: "",
      fecha_vencimiento: "",
      numero_lote: ""
    });
    setFormError("");
    setShowAddModal(true);
  };

  // Carga datos en el mismo modal para editar (Punto 8 del Checklist)
  const openEditModal = (prod: Producto) => {
    setEditProduct(prod);
    setFormData({
      sku: prod.codigo,
      nombre: prod.nombre,
      id_categoria: prod.id_categoria ? String(prod.id_categoria) : "",
      precio_compra: String(prod.precio_compra),
      precio_venta: String(prod.precio),
      stock_actual: String(prod.stock),
      stock_minimo: String(prod.stockMinimo),
      unidad_medida: prod.unidad_medida || "Unidades",
      id_proveedor: prod.id_proveedor ? String(prod.id_proveedor) : "",
      fecha_vencimiento: prod.fechaVencimiento || "",
      numero_lote: "" // lote no se edita directamente
    });
    setFormError("");
    setShowAddModal(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validaciones (Punto 7 del Checklist)
    if (!formData.nombre || !formData.sku || !formData.precio_compra || !formData.precio_venta || !formData.stock_actual) {
      setFormError("Por favor, complete todos los campos obligatorios (*)");
      return;
    }

    const compra = parseFloat(formData.precio_compra);
    const venta = parseFloat(formData.precio_venta);
    const stock = parseInt(formData.stock_actual);
    const stockMin = parseInt(formData.stock_minimo) || 0;

    if (isNaN(compra) || compra <= 0) {
      setFormError("El precio de compra debe ser un número mayor a cero");
      return;
    }
    if (isNaN(venta) || venta <= 0) {
      setFormError("El precio de venta debe ser un número mayor a cero");
      return;
    }
    if (venta < compra) {
      setFormError("El precio de venta no debería ser menor al precio de compra");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setFormError("El stock inicial debe ser un número entero mayor o igual a cero");
      return;
    }

    try {
      setSubmitting(true);
      
      const isEdit = !!editProduct;
      const url = isEdit 
        ? `http://localhost:3001/api/productos/${editProduct.id}`
        : "http://localhost:3001/api/productos";
        
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          sku: formData.sku,
          id_categoria: formData.id_categoria ? parseInt(formData.id_categoria) : null,
          precio_compra: compra,
          precio_venta: venta,
          stock_actual: stock,
          stock_minimo: stockMin,
          unidad_medida: formData.unidad_medida,
          id_proveedor: formData.id_proveedor ? parseInt(formData.id_proveedor) : null,
          fecha_vencimiento: formData.fecha_vencimiento || null,
          numero_lote: formData.numero_lote || null
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Error al procesar el producto");
      }

      if (isEdit) {
        // Actualizar en el listado
        setProductos(prev => prev.map(p => p.id === editProduct.id ? data.product : p));
        triggerToast("Producto editado exitosamente"); // Punto 10 del Checklist
      } else {
        // Añadir al principio del listado
        setProductos(prev => [data.product, ...prev]);
        triggerToast("Producto agregado exitosamente"); // Punto 10 del Checklist
      }
      
      setShowAddModal(false);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Error de comunicación con el backend");
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // ELIMINACION DE PRODUCTO
  // ----------------------------------------------------
  const triggerDeleteConfirm = (prod: Producto) => {
    setProductToDelete(prod);
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      setSubmitting(true);
      const response = await fetch(`http://localhost:3001/api/productos/${productToDelete.id}`, {
        method: "DELETE"
      });

      const data = await response.json();

      // Validación de movimientos asociados en la eliminación (Punto 12 del Checklist)
      if (!response.ok || !data.success) {
        throw new Error(data.message || "No se pudo eliminar el producto");
      }

      // Remover del estado
      setProductos(prev => prev.filter(p => p.id !== productToDelete.id));
      triggerToast(`Producto "${productToDelete.nombre}" eliminado exitosamente`);
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err: any) {
      console.error(err);
      // Muestra error tipo toast descriptivo
      triggerToast(err.message || "Error al intentar eliminar el producto", "error");
      setShowDeleteModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // CALCULOS EXCLUSIVOS DE TAB METRICAS
  // ----------------------------------------------------
  const metricasPorCategoria = categorias.map(cat => {
    const prods = productos.filter(p => p.id_categoria === cat.id);
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

  // Top 5 productos mas valorados (stock * precio)
  const topValuedProducts = [...productos]
    .map(p => ({
      ...p,
      valorTotal: p.stock * p.precio
    }))
    .sort((a, b) => b.valorTotal - a.valorTotal)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Toast Notification (Punto 10 del Checklist) */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border text-white transition-all duration-300 transform translate-y-0 scale-100 ${
          toast.type === "success" 
            ? "bg-emerald-600 border-emerald-500" 
            : "bg-red-600 border-red-500"
        }`}>
          <FontAwesomeIcon icon={faCircleCheck} className="text-lg" />
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

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

      {/* Main Content */}
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
              ¡Bienvenido al Control de Stock, {user?.nombre}!
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Supervisa las existencias en tiempo real, administra la frescura de los alimentos perecibles y audita la valorización total de tu local comercial.
            </p>
          </div>
        </div>

        {/* Módulos / Estadísticas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1: Total Stock */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 flex items-center gap-5">
            <div className="p-4 rounded-xl bg-blue-50 text-blue-600">
              <FontAwesomeIcon icon={faBoxesStacked} className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Productos Totales</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{totalProductos}</h3>
              <p className="text-xs text-blue-600 font-medium mt-1">Registrados en sistema</p>
            </div>
          </div>

          {/* Card 2: Stock Crítico */}
          <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 flex items-center gap-5 ${stockBajo > 0 ? "border-l-4 border-l-orange-500" : ""}`}>
            <div className={`p-4 rounded-xl ${stockBajo > 0 ? "bg-orange-50 text-orange-600" : "bg-slate-50 text-slate-500"}`}>
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Bajos de Stock</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{stockBajo}</h3>
              <p className={`text-xs font-bold mt-1 ${stockBajo > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                {stockBajo > 0 ? "Requiere reabastecer" : "Niveles saludables"}
              </p>
            </div>
          </div>

          {/* Card 3: Vencimiento Próximo */}
          <div className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 flex items-center gap-5 ${vencidos + vencimientoProximo > 0 ? "border-l-4 border-l-red-500" : ""}`}>
            <div className={`p-4 rounded-xl ${(vencidos + vencimientoProximo) > 0 ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-50 text-slate-500"}`}>
              <FontAwesomeIcon icon={faCalendarDays} className="text-2xl" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alertas Vencimiento</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{vencidos + vencimientoProximo}</h3>
              <p className={`text-xs font-bold mt-1 ${(vencidos + vencimientoProximo) > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {vencidos > 0 ? `${vencidos} ya vencidos` : "Frescura en orden"}
              </p>
            </div>
          </div>

          {/* Card 4: Valor de Inventario */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300 flex items-center gap-5">
            <div className="p-4 rounded-xl bg-emerald-50 text-emerald-600">
              <span className="text-2xl font-extrabold">S/</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valorización</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">S/ {valorTotalInventario.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
              <p className="text-xs text-emerald-600 font-medium mt-1">Precio venta al público</p>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN Y MENÚ DE PESTAÑAS (Punto 1 del Checklist) */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto gap-2 bg-slate-100/80 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("inventario")}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === "inventario"
                ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <FontAwesomeIcon icon={faInbox} />
            <span>Lista de Productos</span>
          </button>

          <button
            onClick={() => setActiveTab("metricas")}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === "metricas"
                ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <FontAwesomeIcon icon={faChartSimple} />
            <span>Métricas & Valoración</span>
          </button>

          <button
            onClick={() => setActiveTab("alertas")}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer ${
              activeTab === "alertas"
                ? "bg-white text-slate-950 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
            }`}
          >
            <FontAwesomeIcon icon={faBell} />
            <span>Control de Vencimientos</span>
            {vencidos + vencimientoProximo > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-600 text-white rounded-full font-bold">
                {vencidos + vencimientoProximo}
              </span>
            )}
          </button>
        </div>

        {/* LOADING & ERROR STATES */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <svg className="animate-spin h-10 w-10 text-orange-500 mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <h3 className="text-base font-bold text-slate-700">Cargando inventario...</h3>
            <p className="text-xs text-slate-400 mt-1">Conectando al servidor central</p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16 bg-red-50 rounded-3xl border border-red-200 p-8 shadow-sm">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-4xl text-red-500 mb-3" />
            <h3 className="text-lg font-bold text-red-950">Error al cargar datos</h3>
            <p className="text-sm text-red-800 mt-1 mb-6">{error}</p>
            <button
              onClick={fetchInitialData}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faRotateRight} className="mr-2" />
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* TAB 1: INVENTARIO DE ALMACEN */}
        {!loading && !error && activeTab === "inventario" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
            
            {/* Cabecera de la Tabla */}
            <div className="p-6 sm:p-8 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
              <div>
                <h2 className="text-xl font-black text-slate-900">Catálogo de Productos</h2>
                <p className="text-xs text-slate-400 mt-0.5">Control de registros, precios de compra/venta y alertas rápidas</p>
              </div>
              
              {/* Buscador, Filtros y Botón de Agregar (Punto 4 y 5 del Checklist) */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] sm:flex-initial">
                  <input
                    type="text"
                    placeholder="Buscar producto, SKU, categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all animate-fadeIn"
                  />
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                </div>

                {/* Selector de Categorías (Punto 4 del Checklist) */}
                <div className="relative">
                  <select
                    value={filterCategoria}
                    onChange={(e) => setFilterCategoria(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all cursor-pointer font-bold"
                  >
                    {listadoCategorias.map(cat => (
                      <option key={cat} value={cat}>{cat === "Todos" ? "Todas las Categorías" : cat}</option>
                    ))}
                  </select>
                  <FontAwesomeIcon icon={faChevronDown} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] pointer-events-none" />
                </div>

                {/* Botón de Reset */}
                <button
                  onClick={() => { setSearchTerm(""); setFilterCategoria("Todos"); fetchInitialData(); }}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                  title="Actualizar Datos"
                >
                  <FontAwesomeIcon icon={faRotateRight} />
                </button>

                {/* Botón AGREGAR PRODUCTO (Punto 5 del Checklist) */}
                <button
                  onClick={openAddModal}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-extrabold py-2.5 px-5 rounded-xl text-sm flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Agregar Producto</span>
                </button>
              </div>
            </div>

            {/* Tabla de Productos (Puntos 2 y 3 del Checklist) */}
            <div className="overflow-x-auto">
              {paginatedProducts.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50/70">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Imagen</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">SKU</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Actual</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Mínimo</th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Precio Venta</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {paginatedProducts.map((prod) => {
                      const esSinStock = prod.stock <= 0;
                      const esBajoStock = prod.stock <= prod.stockMinimo;

                      // Colorear filas según stock (Punto 3 del Checklist)
                      let rowBgColor = "hover:bg-slate-50/50 transition-all duration-150";
                      if (esSinStock) {
                        rowBgColor = "bg-red-50/70 hover:bg-red-100/70 border-l-4 border-l-red-500 transition-all duration-150";
                      } else if (esBajoStock) {
                        rowBgColor = "bg-orange-50/70 hover:bg-orange-100/70 border-l-4 border-l-orange-400 transition-all duration-150";
                      }

                      return (
                        <tr key={prod.id} className={rowBgColor}>
                          {/* Columna Imagen (Opcional - Punto 2) */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                              <FontAwesomeIcon icon={faImage} className="text-xs" />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                            {prod.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-slate-500">
                            {prod.codigo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
                              {prod.categoria}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-800">
                            <span className={esSinStock ? "text-red-700 font-extrabold" : esBajoStock ? "text-orange-700" : "text-slate-800"}>
                              {prod.stock} {prod.unidad_medida || "uds"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-500">
                            {prod.stockMinimo} {prod.unidad_medida || "uds"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-extrabold text-slate-900">
                            S/ {prod.precio.toFixed(2)}
                          </td>
                          {/* Acciones Editar/Eliminar (Punto 2 del Checklist) */}
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm space-x-1">
                            {/* Botón Editar (Punto 8) */}
                            <button
                              onClick={() => openEditModal(prod)}
                              className="text-slate-600 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Editar Producto"
                            >
                              <FontAwesomeIcon icon={faPen} className="text-xs" />
                            </button>
                            {/* Botón Eliminar (Punto 9) */}
                            <button
                              onClick={() => triggerDeleteConfirm(prod)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar Producto"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-16 px-4">
                  <FontAwesomeIcon icon={faBoxesStacked} className="text-5xl text-slate-200 mb-4 animate-pulse" />
                  <h3 className="text-lg font-bold text-slate-800">No se encontraron productos</h3>
                  <p className="text-sm text-slate-400 mt-1">Intenta ajustando el término de búsqueda o filtros.</p>
                </div>
              )}
            </div>
            
            {/* Controles de Paginación Paginada (20 por página - Punto 1 del Checklist) */}
            {totalPages > 1 && (
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                <p>
                  Mostrando del <strong>{Math.min(totalItemsFiltrados, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</strong> al <strong>{Math.min(totalItemsFiltrados, currentPage * ITEMS_PER_PAGE)}</strong> de <strong>{totalItemsFiltrados}</strong> productos
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Primera Página"
                  >
                    <span>&laquo;</span>
                  </button>

                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                    title="Página Anterior"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                  </button>

                  <span className="px-3 text-slate-700 font-bold">
                    Página {currentPage} de {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                    title="Página Siguiente"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Última Página"
                  >
                    <span>&raquo;</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SISTEMA DE METRICAS DETALLADAS */}
        {!loading && !error && activeTab === "metricas" && (
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

        {/* TAB 3: CONTROL DE VENCIMIENTOS / ALERTAS */}
        {!loading && !error && activeTab === "alertas" && (
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

      </main>

      {/* FOOTER */}
      <Footer />

      {/* ======================================================== */}
      {/* MODAL: AGREGAR / EDITAR PRODUCTO (Punto 5 y 8 del Checklist) */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden transform scale-100 transition-all duration-300">
            
            {/* Header del Modal */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-5 flex justify-between items-center text-slate-950">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={editProduct ? faPen : faPlus} className="text-lg font-bold" />
                <h3 className="text-lg font-black tracking-tight">
                  {editProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-950 hover:bg-black/10 p-2 rounded-full transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faXmark} className="text-lg" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleProductSubmit} className="p-6 sm:p-8 space-y-6">
              
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs font-semibold">
                  ⚠️ {formError}
                </div>
              )}

              {/* Fila 1: SKU y Nombre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Código SKU / Barras *
                  </label>
                  <input
                    type="text"
                    name="sku"
                    required
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="Ej: PROD006"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-sm font-semibold placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Aceite Primor Premium 1L"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-sm font-semibold placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Fila 2: Categoria y Proveedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Categoría
                  </label>
                  <div className="relative">
                    <select
                      name="id_categoria"
                      value={formData.id_categoria}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white appearance-none cursor-pointer text-sm font-semibold"
                    >
                      <option value="">Seleccione Categoría</option>
                      {categorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Proveedor
                  </label>
                  <div className="relative">
                    <select
                      name="id_proveedor"
                      value={formData.id_proveedor}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white appearance-none cursor-pointer text-sm font-semibold"
                    >
                      <option value="">Seleccione Proveedor</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                      ))}
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Fila 3: Compra, Venta y Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Precio Compra * (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_compra"
                    required
                    value={formData.precio_compra}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-sm font-semibold placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Precio Venta * (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="precio_venta"
                    required
                    value={formData.precio_venta}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-sm font-semibold placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    {editProduct ? "Stock Actual *" : "Stock Inicial *"}
                  </label>
                  <input
                    type="number"
                    name="stock_actual"
                    required
                    value={formData.stock_actual}
                    onChange={handleInputChange}
                    placeholder="100"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-sm font-semibold placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Fila 4: Stock Minimo, Unidad de Medida (desplegable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Stock Mínimo Alerta
                  </label>
                  <input
                    type="number"
                    name="stock_minimo"
                    value={formData.stock_minimo}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-sm font-semibold"
                  />
                </div>

                {/* Unidad de medida desplegable (Punto 6 del Checklist) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Unidad de Medida
                  </label>
                  <div className="relative">
                    <select
                      name="unidad_medida"
                      value={formData.unidad_medida}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white appearance-none cursor-pointer text-sm font-semibold"
                    >
                      <option value="Unidades">Unidades (unid)</option>
                      <option value="Kilogramos">Kilogramos (kg)</option>
                      <option value="Litros">Litros (litro)</option>
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Fila 5: Expiracion y Lote (Opcionales, solo en modo agregar) */}
              {!editProduct && (
                <div className="border-t border-slate-100 pt-5">
                  <span className="text-xs font-black uppercase text-orange-500 tracking-widest block mb-4">
                    Datos de Lote y Expiración (Opcionales)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Fecha de Vencimiento
                      </label>
                      <input
                        type="date"
                        name="fecha_vencimiento"
                        value={formData.fecha_vencimiento}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Código de Lote
                      </label>
                      <input
                        type="text"
                        name="numero_lote"
                        value={formData.numero_lote}
                        onChange={handleInputChange}
                        placeholder="Ej: LOTE-A1"
                        className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:bg-white transition-all text-sm font-semibold placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-slate-950 font-black px-6 py-3 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {submitting ? "Procesando..." : editProduct ? "Guardar Cambios" : "Guardar Producto"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMACIÓN ELIMINAR PRODUCTO (Punto 9 del Checklist) */}
      {/* ======================================================== */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden transform scale-100 transition-all duration-300">
            
            <div className="p-6 sm:p-8 text-center">
              <div className="h-16 w-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 border border-red-100">
                <FontAwesomeIcon icon={faTrash} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">¿Eliminar Producto?</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                ¿Está seguro de que desea eliminar <strong>{productToDelete.nombre}</strong> (SKU: {productToDelete.codigo})? 
                Esta acción aplicará una <strong>eliminación lógica</strong> (desactivación) del catálogo del supermercado.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { setShowDeleteModal(false); setProductToDelete(null); }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-5 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteProduct}
                  disabled={submitting}
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Eliminando..." : "Sí, Eliminar"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
