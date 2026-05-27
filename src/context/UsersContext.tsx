// Contexto que mantiene la lista de usuarios del círculo y el id del usuario actual.
// Se monta una sola vez en AppLayout para evitar fetches duplicados entre
// el sidebar desktop y la bottom nav mobile.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getUsers } from '../api'
import type { UserResponse } from '../api'
import { useAuth } from '../auth/AuthContext'

interface UsersContextValue {
  users: UserResponse[]
  myId:  number | undefined
}

const UsersContext = createContext<UsersContextValue>({ users: [], myId: undefined })

export function UsersProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserResponse[]>([])

  useEffect(() => {
    getUsers().then(setUsers).catch(() => {})
  }, [])

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
