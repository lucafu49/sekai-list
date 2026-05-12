import { type ReviewRequest, type ReviewResponse } from './types';
import { api } from './client';

export function upsertReview(data: ReviewRequest): Promise<ReviewResponse> {
  return api.post<ReviewResponse>('/reviews', data);
}

export function getReviewsByAnime(animeId: number): Promise<ReviewResponse[]> {
  return api.get<ReviewResponse[]>(`/reviews/anime/${animeId}`);
}

export function getMyReviews(): Promise<ReviewResponse[]> {
  return api.get<ReviewResponse[]>('/reviews/me');
}

export function getReviewsByUser(userId: number): Promise<ReviewResponse[]> {
  return api.get<ReviewResponse[]>(`/reviews/user/${userId}`);
}

export function deleteReview(animeId: number): Promise<void> {
  return api.delete<void>(`/reviews/${animeId}`);
}
