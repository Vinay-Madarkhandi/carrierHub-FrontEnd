"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { logout as logoutUtil } from "@/lib/auth-utils"

export interface User {
  id: number
  name: string
  email: string
  phone?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication status on mount
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token')
        const userData = localStorage.getItem('user')
        
        if (token && userData && token !== 'null' && userData !== 'null' && userData !== 'undefined') {
          try {
            const parsedUser = JSON.parse(userData)
            if (parsedUser && parsedUser.email) {
              setUser(parsedUser)
            } else {
              localStorage.removeItem('token')
              localStorage.removeItem('user')
            }
          } catch (error) {
            console.error('Error parsing user data:', error)
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        } else {
          setUser(null)
        }
      }
      
      setIsLoading(false)
    }

    // Ensure we're on the client side before checking auth
    if (typeof window !== 'undefined') {
      checkAuth()
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback((token: string, userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(userData))
    }
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    setUser(null)
    logoutUtil(router)
  }, [router])

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  }), [user, isLoading, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
