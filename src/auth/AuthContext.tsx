import { createContext, useContext, useState, type ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout } from '../api/auth';
import { getCurrentUser, type CurrentUser } from '../api/users';
import type { LoginRequest } from '../api/types';

interface AuthContextValue {
  user: CurrentUser | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => getCurrentUser());

  async function login(credentials: LoginRequest): Promise<void> {
    await apiLogin(credentials);
    setUser(getCurrentUser());
  }

  function logout(): void {
    apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
