// Cliente HTTP base de la aplicación.
// Centraliza fetch, manejo de token JWT y errores de la API.
// Todos los módulos de recursos (animes, reviews, etc.) pasan por el objeto `api` exportado al final.

import { type ApiError, ApiException } from './types';

// La URL base se lee de la variable de entorno; si no está definida, apunta al backend local.
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

// Clave bajo la que se guarda el JWT en localStorage.
const TOKEN_KEY = 'sekailist_token';

// Flag para evitar que múltiples requests 401 concurrentes disparen el evento varias veces.
// Se resetea en setToken() cuando el usuario vuelve a iniciar sesión.
let sessionExpiredFired = false;

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  sessionExpiredFired = false;
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Función interna que realiza todas las peticiones HTTP.
// Inyecta el token Bearer si existe y parsea la respuesta como JSON.
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.ok) {
    // 204 No Content no trae body: devolvemos undefined casteado al tipo esperado.
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }

  const apiError: ApiError = await res.json();
  // Un 401 significa que el token expiró o es inválido: lo eliminamos y notificamos a la app.
  // El flag evita que múltiples requests fallidas simultáneas disparen el evento más de una vez.
  if (res.status === 401) {
    clearToken();
    if (!sessionExpiredFired) {
      sessionExpiredFired = true;
      window.dispatchEvent(new CustomEvent('session-expired'));
    }
  }
  throw new ApiException(apiError);
}

// Interfaz pública del cliente. Cada método es un atajo tipado sobre `request`.
export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
