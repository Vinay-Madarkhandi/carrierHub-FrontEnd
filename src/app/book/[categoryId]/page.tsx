"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { apiClient, type ConsultantType, type BookingStatus } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  query: z.string().min(10, "Please provide a brief description of your query"),
})

type BookingFormData = z.infer<typeof bookingSchema>

// Map frontend category IDs to backend consultant types
const categoryIdToTypeMap: Record<string, ConsultantType> = {
  "career-guidance": "CAREER_GUIDANCE",
  "college-course": "COLLEGE_COURSE", 
  "exam-preparation": "EXAM_PREPARATION",
  "study-abroad": "STUDY_ABROAD",
  "skill-mentorship": "SKILL_MENTORSHIP",
  "job-placement": "JOB_PLACEMENT",
  "government-jobs": "GOVERNMENT_JOBS",
  "personal-growth": "PERSONAL_GROWTH",
  "alternative-careers": "ALTERNATIVE_CAREERS"
}

// Default pricing (in paise - ₹500 = 50000 paise)
const defaultPricing: Record<ConsultantType, number> = {
  "CAREER_GUIDANCE": 50000,
  "COLLEGE_COURSE": 80000,
  "EXAM_PREPARATION": 60000,
  "STUDY_ABROAD": 120000,
  "SKILL_MENTORSHIP": 70000,
  "JOB_PLACEMENT": 90000,
  "GOVERNMENT_JOBS": 60000,
  "PERSONAL_GROWTH": 50000,
  "ALTERNATIVE_CAREERS": 60000
}

export default function BookingPage({ params }: { params: Promise<{ categoryId: string }> }) {
  const [isLoading, setIsLoading] = useState(false)
  const [category, setCategory] = useState<{ title: string; description: string; price: number } | null>(null)
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  // Unwrap the params Promise
  const resolvedParams = use(params)
  const consultantType = categoryIdToTypeMap[resolvedParams.categoryId]


  useEffect(() => {
    const fetchCategoryDetails = async () => {
      if (!consultantType) return
      
      try {
        const response = await apiClient.getCategories()
        if (response.success && response.data?.categories) {
          const categoryData = response.data.categories.find(cat => cat.type === consultantType)
          if (categoryData) {
            setCategory({
              title: categoryData.title,
              description: categoryData.description,
              price: defaultPricing[consultantType] / 100 // Convert paise to rupees for display
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch category details:', error)
        // Fallback to default data
        setCategory({
          title: consultantType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          description: `Professional guidance for ${consultantType.replace('_', ' ').toLowerCase()}`,
          price: defaultPricing[consultantType] / 100
        })
      }
    }

    fetchCategoryDetails()
  }, [consultantType])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  })


  const onSubmit = async (data: BookingFormData) => {
    if (!isAuthenticated) {
      toast.error("Please login to book a consultation")
      // AuthWrapper will handle the redirect with proper next parameter
      return
    }

    if (!consultantType || !category) {
      toast.error("Invalid category selected")
      return
    }

    setIsLoading(true)
    try {
      // First create the booking using backend API
      const bookingResponse = await apiClient.createBooking({
        consultantType: consultantType,
        details: data.query,
        amount: defaultPricing[consultantType], // Amount in paise
      })

      if (bookingResponse.success && bookingResponse.data) {
        const bookingId = bookingResponse.data.booking.id
        
        // Create payment order using backend API
        const paymentResponse = await apiClient.createPaymentOrder(bookingId)

        if (paymentResponse.success) {
          await handleRazorpayPayment(paymentResponse.data, bookingId)
        } else {
          toast.error(paymentResponse.error || "Failed to create payment order")
        }
      } else {
        toast.error(bookingResponse.error || "Failed to create booking")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRazorpayPayment = async (order: any, bookingId: number) => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "CarrierHub",
      description: `Consultation: ${category?.title || 'Unknown Category'}`,
      order_id: order.orderId,
      handler: async (response: any) => {
        try {
          const paymentResponse = await apiClient.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: bookingId,
          })

          if (paymentResponse.success) {
            toast.success("Payment successful! Your consultation has been booked.")
            router.push("/dashboard")
          } else {
            toast.error(paymentResponse.error || "Payment verification failed")
          }
        } catch (error) {
          toast.error("Payment verification failed")
        }
      },
      prefill: {
        name: "",
        email: "",
        contact: "",
      },
      theme: {
        color: "#2563eb",
      },
    }

    const razorpay = new (window as any).Razorpay(options)
    razorpay.open()
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Category Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The consultation category you're looking for doesn't exist.
              </p>
              <Button asChild>
                <Link href="/">Go Back Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Book Consultation
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Fill in your details to book a consultation session
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                {category.title}
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Consultation Fee
                  </span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ₹{category.price}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>• 1-hour consultation session</p>
                  <p>• Personalized guidance</p>
                  <p>• Follow-up support</p>
                  <p>• Resource materials</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking Form */}
          <Card>
            <CardHeader>
              <CardTitle>Your Details</CardTitle>
              <CardDescription>
                Please provide your information to proceed with the booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.name.message}
                    </p>
                  )}
                </div>

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
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    {...register("phone")}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="query">Your Query</Label>
                  <Textarea
                    id="query"
                    placeholder="Briefly describe what you'd like to discuss in the consultation"
                    rows={4}
                    {...register("query")}
                  />
                  {errors.query && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.query.message}
                    </p>
                  )}
                </div>

                {!isAuthenticated && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      You need to be logged in to book a consultation.{" "}
                      <Link href="/login" className="underline">
                        Sign in here
                      </Link>
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !isAuthenticated}
                >
                  {isLoading ? "Processing..." : `Book Now - ₹${category.price}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
