"use client"

import { useAdmin } from "@/contexts/admin-context"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

interface AdminWrapperProps {
  children: React.ReactNode
}

export function AdminWrapper({ children }: AdminWrapperProps) {
  const { isAuthenticated, isLoading } = useAdmin()
  const router = useRouter()
  const pathname = usePathname()

  // Define admin routes
  const adminRoutes = ['/admin']
  const adminLoginRoute = '/admin/login'
  const studentRoutes = ['/dashboard', '/book']
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  const isAdminLoginRoute = pathname === adminLoginRoute
  const isStudentRoute = studentRoutes.some(route => pathname.startsWith(route))
  const isHomePage = pathname === '/'

  useEffect(() => {
    if (isLoading) return // Wait for auth check to complete

    if (isAdminRoute && !isAdminLoginRoute && !isAuthenticated) {
      // Redirect to admin login if trying to access admin route without auth
      router.push('/admin/login')
    } else if (isAdminLoginRoute && isAuthenticated) {
      // Redirect to admin dashboard if trying to access login while authenticated
      router.push('/admin')
    } else if (isAuthenticated && (isStudentRoute || isHomePage)) {
      // Only redirect admin away from student routes if they're not in the middle of a redirect flow
      // Check if there's a next parameter indicating an intended redirect
      const url = new URL(window.location.href)
      const nextParam = url.searchParams.get('next')
      
      if (!nextParam) {
        // No intended redirect, redirect admin to admin panel
        router.push('/admin')
      }
      // If there's a next parameter, let the AuthWrapper handle the redirect
    }
  }, [isAuthenticated, isLoading, isAdminRoute, isAdminLoginRoute, isStudentRoute, isHomePage, router])

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Don't render admin content if not authenticated
  if (isAdminRoute && !isAdminLoginRoute && !isAuthenticated) {
    return null
  }

  // Don't render admin login if already authenticated
  if (isAdminLoginRoute && isAuthenticated) {
    return null
  }

  return <>{children}</>
}
