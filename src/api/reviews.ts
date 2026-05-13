// Acceso al recurso /reviews del backend.
// Las reseñas asocian un usuario con un anime y contienen un puntaje numérico.

import { type ReviewRequest, type ReviewResponse } from './types';
import { api } from './client';

// Crea o actualiza la reseña del usuario autenticado sobre un anime (upsert).
// El backend decide si insertar o reemplazar según si ya existe una reseña para ese animeId.
export function upsertReview(data: ReviewRequest): Promise<ReviewResponse> {
  return api.post<ReviewResponse>('/reviews', data);
}

// Devuelve todas las reseñas de un anime específico (de todos los usuarios).
export function getReviewsByAnime(animeId: number): Promise<ReviewResponse[]> {
  return api.get<ReviewResponse[]>(`/reviews/anime/${animeId}`);
}

// Devuelve las reseñas del usuario autenticado actualmente.
export function getMyReviews(): Promise<ReviewResponse[]> {
  return api.get<ReviewResponse[]>('/reviews/me');
}

// Devuelve las reseñas de cualquier usuario por su ID (para ver el perfil de otro usuario).
export function getReviewsByUser(userId: number): Promise<ReviewResponse[]> {
  return api.get<ReviewResponse[]>(`/reviews/user/${userId}`);
}

// El backend identifica la reseña a eliminar por animeId + usuario autenticado en el token.
export function deleteReview(animeId: number): Promise<void> {
  return api.delete<void>(`/reviews/${animeId}`);
}
