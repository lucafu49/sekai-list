// Acceso al recurso /animes del backend.
// Incluye listado paginado con filtros, detalle, creación, edición y eliminación.

import { type AnimeRequest, type AnimeResponse, type Page } from './types';
import { api } from './client';

// Parámetros opcionales de filtrado y paginación para el listado de animes.
export interface GetAnimesParams {
  name?: string;
  classic?: boolean;
  sort?: 'name' | 'score';
  page?: number;
  unreviewed?: boolean; // si es true, devuelve solo los animes que el usuario aún no puntuó
}

// Construye la query string solo con los parámetros que fueron provistos,
// ya que URLSearchParams omite claves no establecidas automáticamente.
export async function getAnimes(params?: GetAnimesParams): Promise<Page<AnimeResponse>> {
  const qs = new URLSearchParams();
  if (params) {
    if (params.name)                   qs.set('name', params.name);
    if (params.classic !== undefined)  qs.set('classic', String(params.classic));
    if (params.sort)                   qs.set('sort', params.sort);
    if (params.page !== undefined)     qs.set('page', String(params.page));
    if (params.unreviewed)             qs.set('unreviewed', 'true');
  }
  const query = qs.toString() ? `?${qs}` : '';
  return api.get<Page<AnimeResponse>>(`/animes${query}`);
}

export function getAnime(id: number): Promise<AnimeResponse> {
  return api.get<AnimeResponse>(`/animes/${id}`);
}

export function createAnime(data: AnimeRequest): Promise<AnimeResponse> {
  return api.post<AnimeResponse>('/animes', data);
}

export function updateAnime(id: number, data: AnimeRequest): Promise<AnimeResponse> {
  return api.put<AnimeResponse>(`/animes/${id}`, data);
}

export function deleteAnime(id: number): Promise<void> {
  return api.delete<void>(`/animes/${id}`);
}
