"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface Admin {
  id: number;
  name?: string;
  email: string;
  createdAt?: string;
}

interface AdminContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, admin: Admin) => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check admin authentication status on mount
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const adminToken = localStorage.getItem('adminToken')
        const adminData = localStorage.getItem('adminUser')
        
        // Check for valid token and admin data
        if (adminToken && adminData && adminToken !== 'null' && adminData !== 'null' && adminData !== 'undefined') {
          try {
            const parsedAdmin = JSON.parse(adminData)
            if (parsedAdmin && parsedAdmin.email) {
              setAdmin(parsedAdmin)
            } else {
              // Invalid admin data, clear storage
              localStorage.removeItem('adminToken')
              localStorage.removeItem('adminUser')
            }
          } catch (error) {
            console.error('Error parsing admin data:', error)
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminUser')
          }
        } else {
          // Clear invalid data
          if (adminToken === 'null' || adminData === 'null' || adminData === 'undefined') {
            localStorage.removeItem('adminToken')
            localStorage.removeItem('adminUser')
          }
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

  const login = useCallback((token: string, adminData: Admin) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminToken', token)
      localStorage.setItem('adminUser', JSON.stringify(adminData))
    }
    setAdmin(adminData)
  }, [])

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
    }
    setAdmin(null)
    router.push("/admin/login")
  }, [router])

  const value = useMemo(() => ({
    admin,
    isAuthenticated: !!admin,
    isLoading,
    login,
    logout,
  }), [admin, isLoading, login, logout])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
