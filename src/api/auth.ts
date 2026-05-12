import { type LoginRequest, type LoginResponse } from './types';
import { api, setToken, clearToken, getToken } from './client';

export async function login(credentials: LoginRequest): Promise<void> {
  const data = await api.post<LoginResponse>('/auth/login', credentials);
  setToken(data.token);
}

export function logout(): void {
  clearToken();
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
