

import { Routes, Route, Navigate } from 'react-router-dom';
import HomeLogin from './pages/HomeLogin';
import HomeInventario from './pages/HomeInventario';
import MetricasPage from './pages/MetricasPage';
import VencimientosPage from './pages/VencimientosPage';
import ProtectedRoute from './components/ProtectedRoute';
import "./index.css";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeLogin />} />
      <Route 
        path="/homeInventario" 
        element={
          <ProtectedRoute>
            <HomeInventario />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/metricas" 
        element={
          <ProtectedRoute>
            <MetricasPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/vencimientos" 
        element={
          <ProtectedRoute>
            <VencimientosPage />
          </ProtectedRoute>
        } 
      />
      {/* Redirección por defecto para cualquier ruta no mapeada */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;


