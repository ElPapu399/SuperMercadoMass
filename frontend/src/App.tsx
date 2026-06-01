
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomeLogin from './pages/HomeLogin';
import HomeInventario from './pages/HomeInventario';
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
      {/* Redirección por defecto para cualquier ruta no mapeada */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

