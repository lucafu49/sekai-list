// Contexto global de autenticación.
// Provee el usuario activo y las acciones login/logout a toda la app sin prop drilling.

import { createContext, useContext, useState, type ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout } from '../api/auth';
import { getCurrentUser, type CurrentUser } from '../api/users';
import type { LoginRequest } from '../api/types';

interface AuthContextValue {
  user: CurrentUser | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

// El valor default es null para poder detectar si alguien usa useAuth fuera del provider.
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // La función pasada a useState se ejecuta una sola vez al montar.
  // Lee el JWT de localStorage para restaurar la sesión si el usuario ya estaba logueado.
  const [user, setUser] = useState<CurrentUser | null>(() => getCurrentUser());

  async function login(credentials: LoginRequest): Promise<void> {
    await apiLogin(credentials);        // guarda el token en localStorage
    setUser(getCurrentUser());          // decodifica el token recién guardado para poblar el estado
  }

  function logout(): void {
    apiLogout();                        // elimina el token de localStorage
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook de acceso al contexto. Lanza un error claro si se usa fuera de AuthProvider.
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
