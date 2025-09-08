"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { getSafeRedirect } from "@/lib/auth-utils"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/book']
  const authRoutes = ['/login', '/signup']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.includes(pathname)

  useEffect(() => {
    if (isLoading) return // Wait for auth check to complete

    if (isProtectedRoute && !isAuthenticated) {
      // Redirect to login with current path as next parameter
      const currentSearch = searchParams?.toString()
      const fullPath = currentSearch ? `${pathname}?${currentSearch}` : pathname
      router.push(`/login?next=${encodeURIComponent(fullPath)}`)
    } else if (isAuthRoute && isAuthenticated) {
      // Get next parameter from URL
      const next = searchParams.get('next')
      
      // Redirect to intended destination or dashboard
      const dest = getSafeRedirect(next, '/dashboard')
      router.push(dest)
    }
  }, [isAuthenticated, isLoading, isProtectedRoute, isAuthRoute, router, pathname, searchParams])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Don't render protected content if not authenticated
  if (isProtectedRoute && !isAuthenticated) {
    return null
  }

  // Don't render auth pages if already authenticated
  if (isAuthRoute && isAuthenticated) {
    return null
  }

  return <>{children}</>
}
