import { getToken } from './client';

export interface CurrentUser {
  username: string;
}

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

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
