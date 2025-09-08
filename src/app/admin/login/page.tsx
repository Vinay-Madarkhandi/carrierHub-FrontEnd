"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { useAdmin } from "@/contexts/admin-context"
import { Shield, ArrowLeft } from "lucide-react"
import { BorderBeam } from "@/components/magicui/border-beam"

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type AdminLoginFormData = z.infer<typeof adminLoginSchema>

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAdmin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  })

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true)
    try {
      const response = await apiClient.adminLogin({
        email: data.email,
        password: data.password,
      })

      if (response.success && response.data) {
        // Use admin context to handle login
        login(response.data.token, response.data.admin)
        
        toast.success("Admin login successful!")
        router.push("/admin")
      } else {
        toast.error(response.error || "Invalid admin credentials")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Admin Login
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Access the admin panel to manage bookings
          </p>
        </div>
        
        <Card className="w-full relative overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Access</CardTitle>
            <CardDescription>Enter your admin credentials to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@carrierhub.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing In..." : "Sign In as Admin"}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <Button asChild variant="outline" className="w-full">
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </Button>
            </div>
          </CardContent>
          <BorderBeam duration={8} size={100} colorFrom="#ef4444" colorTo="#f59e0b" />
        </Card>
        
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Default admin credentials: admin@carrierhub.com / Admin@123456
          </p>
        </div>
      </div>
    </div>
  )
}
