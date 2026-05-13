// Operaciones de autenticación contra el endpoint /auth del backend.
// Estas funciones son primitivas puras; el estado de React lo maneja AuthContext.

import { type LoginRequest, type LoginResponse } from './types';
import { api, setToken, clearToken, getToken } from './client';

// Envía credenciales al backend y, si son válidas, persiste el JWT en localStorage.
export async function login(credentials: LoginRequest): Promise<void> {
  const data = await api.post<LoginResponse>('/auth/login', credentials);
  setToken(data.token);
}

// Elimina el token del almacenamiento local. No hace ninguna llamada al backend.
export function logout(): void {
  clearToken();
}

// Comprueba si hay un token guardado. No valida su firma ni expiración.
export function isAuthenticated(): boolean {
  return getToken() !== null;
}
