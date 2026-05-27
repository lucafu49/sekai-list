// Acceso al recurso /animes/titles del backend.
// Devuelve todos los animes que el círculo ha puntuado, con datos agregados por círculo.

import { type TitleResponse } from './types';
import { api } from './client';

export interface GetTitlesParams {
  name?: string;
  sort?: 'score' | 'name';
  classic?: boolean;
}

export function getTitles(params?: GetTitlesParams): Promise<TitleResponse[]> {
  const qs = new URLSearchParams();
  if (params?.name)    qs.set('name', params.name);
  if (params?.sort)    qs.set('sort', params.sort);
  if (params?.classic) qs.set('classic', 'true');
  const query = qs.toString() ? `?${qs}` : '';
  return api.get<TitleResponse[]>(`/animes/titles${query}`);
}
