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

// Decodifica el claim `exp` del JWT (sin verificar firma) y determina si ya venció.
// Devuelve true también si no hay token o si está malformado: en cualquiera de esos
// casos no se puede usar para autenticar, así que se trata como expirado.
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1])) as { exp: number };
    // exp viene en segundos (estándar JWT); Date.now() en milisegundos.
    return exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// Notifica a la app que la sesión venció: elimina el token y despacha el evento
// 'session-expired' (que SessionWatcher escucha para hacer logout + redirect).
// El flag evita dispararlo más de una vez ante fallos concurrentes (HTTP y WebSocket).
export function notifySessionExpired(): void {
  clearToken();
  if (!sessionExpiredFired) {
    sessionExpiredFired = true;
    window.dispatchEvent(new CustomEvent('session-expired'));
  }
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
  if (res.status === 401) {
    notifySessionExpired();
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
