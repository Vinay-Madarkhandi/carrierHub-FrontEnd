"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { CheckCircle } from "lucide-react"
import { isLoggedIn, getSafeRedirect } from "@/lib/auth-utils"
import { logger } from '@/lib/logger'
import { BorderBeam } from "@/components/magicui/border-beam"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  // Get the 'next' parameter from URL
  const next = searchParams.get('next')

  useEffect(() => {
    // If already logged in, redirect to next or dashboard
    if (isLoggedIn()) {
      const dest = getSafeRedirect(next)
      router.replace(dest)
    }
  }, [next, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    logger.authAction('Login attempt', { email: data.email })
    
    try {
      const response = await apiClient.login({
        email: data.email,
        password: data.password,
      })

      logger.authAction('Login response received', { success: response.success })

      if (response.success && response.data) {
        // Backend returns { student, token }
        if (response.data.token && response.data.student) {
          // Use the auth context to update state
          login(response.data.token, response.data.student)
          
          toast.success("Login successful!")
          
          // Redirect to intended destination or dashboard
          const dest = getSafeRedirect(next, '/dashboard')
          logger.authAction('Redirecting after login', { destination: dest })
          router.replace(dest)
        } else {
          logger.error('Invalid login response structure', response.data)
          toast.error("Invalid response from server")
        }
      } else {
        console.error('🔐 Login failed:', response.error)
        toast.error(response.error || "Invalid credentials")
      }
    } catch (error) {
      console.error('🔐 Login error:', error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Or{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              create a new account
            </Link>
          </p>
        </div>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your CarrierHub account
            </CardDescription>
            {next && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    After signing in, you&apos;ll be redirected to complete your{" "}
                    <span className="font-semibold">
                      {next.includes('/book/') 
                        ? next.split('/book/')[1]?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
                        : 'intended page'
                      }
                    </span>{" "}
                    request.
                  </p>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <BorderBeam duration={8} size={100} colorFrom="#3b82f6" colorTo="#8b5cf6" />
        </Card>
      </div>
    </div>
  )
}
