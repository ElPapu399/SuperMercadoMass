import React from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("mass_session_token");

  if (!token) {
    // Si no hay token de sesión, redirige a la página de login
    return <Navigate to="/" replace />;
  }

  // Si hay token, renderiza la página protegida
  return <>{children}</>;
}
