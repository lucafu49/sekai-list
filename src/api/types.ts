// Contratos de datos entre el frontend y la API REST del backend.
// Los Request DTOs son los cuerpos que enviamos; los Response DTOs son lo que recibimos.

// ── Request DTOs ────────────────────────────────────────────────────────────────

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

// ── Response DTOs ───────────────────────────────────────────────────────────────

export interface LoginResponse {
  // El backend devuelve únicamente el JWT; el resto del perfil se extrae del propio token.
  token: string;
}

export interface AnimeResponse {
  idAnime: number;
  name: string;
  imageUrl: string;
  classic: boolean;
  averageScore: number | null; // null si el anime aún no tiene ninguna reseña
  ratingCount: number;         // cantidad de usuarios que puntuaron el anime
  userScore: number | null;    // null si el usuario autenticado no puntuó este anime todavía
}

export interface ReviewResponse {
  idReview: number;
  animeId: number;
  animeName: string;
  animeImageUrl: string | null; // null si el anime no tiene imagen cargada
  userId: number;
  username: string;
  score: number;
  createdAt: string; // ISO timestamp — usado para mostrar tiempo relativo ("hace Xh")
}

export interface CircleMemberRating {
  username: string;
  score: number | null; // null si el miembro aún no puntuó este título
}

export interface TitleResponse {
  idAnime: number;
  name: string;
  imageUrl: string;
  classic: boolean;
  circleAverageScore: number | null;
  circleRatingCount: number;
  totalCircleSize: number;
  ratings: CircleMemberRating[];
}

// ── Paginación ──────────────────────────────────────────────────────────────────

// Envoltorio de Spring Data que devuelve el backend en los listados paginados.
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // página actual (base 0)
  size: number;     // tamaño de página
  first: boolean;
  last: boolean;
}

// ── Errores ─────────────────────────────────────────────────────────────────────

// Estructura del cuerpo de error que devuelve el backend ante respuestas 4xx/5xx.
export interface ApiError {
  status: number;
  error: string;
  message: string;
  timestamp: string;
}

// Clase de error que envuelve ApiError para poder distinguirlo de otros errores en catch.
// Permite acceder a `err.apiError.message` con tipado completo.
export class ApiException extends Error {
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiException';
    this.apiError = apiError;
  }
}
