# Sekai List — Frontend

React 19 + TypeScript + Vite frontend for **Sekai List**, a private real-time anime-rating app.

> 📖 For the full project overview, architecture and the 5 MB database story, see the [root README](../README.md) · [versión en español](../README.es.md).

## Stack

- **React 19** + **TypeScript** + **Vite**
- **React Router 7** — routing (`/login` public, everything else behind `ProtectedRoute`)
- **TanStack Query** — server-state and caching
- **@stomp/stompjs** — WebSocket client for live review updates
- **CSS Modules** — one `.module.css` per component/page, no UI framework

## Getting started

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

Create a `.env` from the template:

```bash
cp .env.example .env
```

| Variable       | Default                      | Purpose                     |
|----------------|------------------------------|-----------------------------|
| `VITE_API_URL` | `http://localhost:8080`      | REST backend base URL       |
| `VITE_WS_URL`  | `ws://localhost:8080/ws`     | STOMP WebSocket endpoint    |

## Scripts

```bash
npm run dev        # dev server with HMR
npm run build      # tsc -b type-check + production build → dist/
npm run lint       # eslint
npm run preview    # serve the production build locally
```

## Architecture notes

- **API layer (`src/api/`)** — every network call goes through `client.ts`, which owns the JWT (in `localStorage`), injects the `Bearer` header, and routes any `401` into a single session-expiry flow.
- **Auth (`src/auth/`)** — the current user is decoded from the JWT itself; there's no `/me` round-trip on load.
- **WebSocket (`src/hooks/useWebSocket.ts`)** — `useWebSocket<T>(topic, onMessage)` opens a STOMP client, passes the JWT in the CONNECT headers, auto-reconnects, and tears down on unmount.
