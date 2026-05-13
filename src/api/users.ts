// Utilidades para obtener información del usuario autenticado.
// En lugar de hacer una llamada extra al backend, extrae los datos del JWT almacenado localmente.

import { getToken } from './client';

// Datos del usuario que el resto de la app necesita conocer.
export interface CurrentUser {
  username: string;
}

// Estructura del payload del JWT emitido por el backend (campos estándar de JWT).
interface JwtPayload {
  sub: string; // subject: nombre de usuario
  iat: number; // issued at: timestamp de emisión
  exp: number; // expiration: timestamp de expiración
}

// Decodifica el payload del JWT (segmento central, codificado en base64) sin verificar la firma.
// La firma la valida el backend en cada request; aquí solo necesitamos leer los datos.
// Devuelve null si no hay token o si está malformado.
export function getCurrentUser(): CurrentUser | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    return { username: payload.sub };
  } catch {
    return null;
  }
}
