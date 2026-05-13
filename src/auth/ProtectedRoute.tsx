// Guard de rutas privadas.
// Si el usuario no está autenticado, redirige a /login en lugar de renderizar la ruta hija.
// Se usa en App.tsx como elemento padre de las rutas que requieren sesión.

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { user } = useAuth();
  // Outlet renderiza la ruta hija coincidente; Navigate reemplaza la entrada en el historial
  // para que el botón "atrás" no vuelva a la ruta protegida.
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
