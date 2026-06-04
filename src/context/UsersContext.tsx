// Contexto que mantiene la lista de usuarios del círculo y el id del usuario actual.
// Se monta una sola vez en AppLayout para evitar fetches duplicados entre
// el sidebar desktop y la bottom nav mobile.

import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '../api'
import type { UserResponse } from '../api'
import { useAuth } from '../auth/AuthContext'
import { queryKeys } from '../queryClient'

interface UsersContextValue {
  users: UserResponse[]
  myId:  number | undefined
}

const UsersContext = createContext<UsersContextValue>({ users: [], myId: undefined })

export function UsersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  // Comparte la misma entrada de caché ('users') que el resto de la app:
  // sin importar cuántos componentes la pidan, se hace una sola request.
  const { data: users = [] } = useQuery({
    queryKey: queryKeys.users,
    queryFn: getUsers,
    staleTime: Infinity,
  })

  const myId = users.find(u => u.username === user?.username)?.idUser

  return (
    <UsersContext.Provider value={{ users, myId }}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers(): UsersContextValue {
  return useContext(UsersContext)
}
