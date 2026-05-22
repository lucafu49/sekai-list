// Acceso al recurso /titles del backend.
// Devuelve todos los animes que el círculo ha puntuado, con datos agregados por círculo.

import { type TitleResponse } from './types';
import { api } from './client';

export function getTitles(): Promise<TitleResponse[]> {
  return api.get<TitleResponse[]>('/animes/titles');
}
