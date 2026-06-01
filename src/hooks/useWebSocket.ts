import { useEffect, useRef } from 'react'
import { Client } from '@stomp/stompjs'
import { getToken, isTokenExpired, notifySessionExpired } from '../api/client'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080/ws'

/**
 * Establece una conexión STOMP y suscribe al topic indicado.
 * El JWT se pasa en los headers del frame CONNECT para que el backend
 * lo valide en JwtChannelInterceptor.
 *
 * Se reconecta automáticamente si se pierde la conexión (cada 5s).
 * Se desconecta al desmontar el componente que lo usa.
 *
 * @param topic   - Destino STOMP, ej: '/topic/reviews' o '/topic/reviews/42'
 * @param onMessage - Callback que recibe el mensaje ya parseado como T
 *
 * @example
 * useWebSocket<ReviewResponse>('/topic/reviews', (review) => {
 *   setReviews(prev => [review, ...prev])
 * })
 */
export function useWebSocket<T>(
  topic: string,
  onMessage: (data: T) => void
): void {
  // Guardamos la última versión del callback en un ref para evitar
  // reconectar el websocket cada vez que el componente re-renderiza.
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  useEffect(() => {
    // Sin topic no hay nada a qué suscribirse (ej: animeId aún no resuelto).
    // Evita activar una conexión y suscribirse a un destino vacío.
    if (!topic) return

    // Si el token falta o ya venció, no intentamos conectar: notificamos
    // a la app (logout + redirect) por el mismo canal que el cliente HTTP.
    const token = getToken()
    if (!token || isTokenExpired()) {
      notifySessionExpired()
      return
    }

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(topic, (frame) => {
          try {
            const data = JSON.parse(frame.body) as T
            onMessageRef.current(data)
          } catch (err) {
            console.error('[WebSocket] Error al parsear mensaje:', err)
          }
        })
      },
      onStompError: (frame) => {
        // El backend rechaza el frame CONNECT cuando el JWT venció o es inválido.
        // En ese caso el token de localStorage ya no sirve: cortamos el loop de
        // reconexión (cada 5s) y disparamos el flujo de sesión vencida una sola vez.
        if (!getToken() || isTokenExpired()) {
          client.deactivate()
          notifySessionExpired()
          return
        }
        console.error('[WebSocket] STOMP error:', frame.headers['message'])
      },
      onDisconnect: () => {
        console.info('[WebSocket] Desconectado de', topic)
      },
    })

    client.activate()

    return () => {
      client.deactivate()
    }
  }, [topic])
}
