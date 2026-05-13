// Barrel de la capa API: re-exporta todo desde un único punto de entrada.
// Los componentes importan desde '../api' en lugar de apuntar a cada módulo individualmente.

export * from './auth';
export * from './users';
export * from './animes';
export * from './reviews';
export * from './types';
export { api, getToken, setToken, clearToken } from './client';
