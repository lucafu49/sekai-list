// Request DTOs

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AnimeRequest {
  name: string;
  imageUrl: string;
  classic: boolean;
}

export interface ReviewRequest {
  animeId: number;
  score: number;
}

// Response DTOs

export interface LoginResponse {
  token: string;
}

export interface AnimeResponse {
  idAnime: number;
  name: string;
  imageUrl: string;
  classic: boolean;
  averageScore: number;
  userScore: number | null;
}

export interface ReviewResponse {
  idReview: number;
  animeId: number;
  animeName: string;
  userId: number;
  username: string;
  score: number;
}

// Spring Data pagination wrapper

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// Error types

export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}

export class ApiException extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiException';
    this.apiError = apiError;
  }
}
