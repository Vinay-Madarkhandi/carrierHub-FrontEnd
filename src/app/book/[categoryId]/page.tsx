"use client";

import { useState, useEffect, use, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { apiClient, type ConsultantType } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import {
  validateRazorpaySetup,
  createRazorpayOptions,
  validatePaymentData,
  PaymentErrors,
  formatCurrency,
  type RazorpayResponse,
  type PaymentOrder,
} from "@/lib/payment-utils";

const bookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  query: z.string().min(10, "Please provide a brief description of your query"),
});

type BookingFormData = z.infer<typeof bookingSchema>;

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
  "alternative-careers": "ALTERNATIVE_CAREERS",
};

// Default pricing (in paise - aligned with backend pricing)
// Backend: ₹500-1200, Frontend: ₹500-1200 (consistent)
const defaultPricing: Record<ConsultantType, number> = {
  CAREER_GUIDANCE: 50000,     // ₹500
  COLLEGE_COURSE: 80000,      // ₹800  
  EXAM_PREPARATION: 60000,    // ₹600
  STUDY_ABROAD: 120000,       // ₹1200
  SKILL_MENTORSHIP: 70000,    // ₹700
  JOB_PLACEMENT: 90000,       // ₹900
  GOVERNMENT_JOBS: 60000,     // ₹600
  PERSONAL_GROWTH: 50000,     // ₹500
  ALTERNATIVE_CAREERS: 60000, // ₹600
};

export default function BookingPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [category, setCategory] = useState<{
    title: string;
    description: string;
    price: number;
  } | null>(null);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // Unwrap the params Promise
  const resolvedParams = use(params);

  // Memoize consultant type calculation
  const consultantType = useMemo(() => {
    return categoryIdToTypeMap[resolvedParams.categoryId];
  }, [resolvedParams.categoryId]);

  // Memoize category fetching function
  const fetchCategoryDetails = useCallback(async () => {
    if (!consultantType) return;

    try {
      const response = await apiClient.getCategories();
      if (response.success && response.data?.categories) {
        const categoryData = response.data.categories.find(
          (cat) => cat.type === consultantType
        );
        if (categoryData) {
          setCategory({
            title: categoryData.title,
            description: categoryData.description,
            price: defaultPricing[consultantType] / 100, // Convert paise to rupees for display
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch category details:", error);
      // Fallback to default data
      setCategory({
        title: consultantType
          .replace("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        description: `Professional guidance for ${consultantType
          .replace("_", " ")
          .toLowerCase()}`,
        price: defaultPricing[consultantType] / 100,
      });
    }
  }, [consultantType]);

  useEffect(() => {
    fetchCategoryDetails();
  }, [fetchCategoryDetails]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      query: "",
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    if (!isAuthenticated) {
      toast.error("Please login to book a consultation");
      return;
    }

    if (!consultantType || !category) {
      toast.error("Invalid category selected");
      return;
    }

    // Validate form data for payment
    const validation = validatePaymentData({
      name: data.name,
      email: data.email,
      phone: data.phone,
      amount: defaultPricing[consultantType],
    });

    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      return;
    }

    // Validate Razorpay setup
    const razorpayValidation = validateRazorpaySetup();
    if (!razorpayValidation.isValid) {
      toast.error(
        razorpayValidation.error || PaymentErrors.RAZORPAY_NOT_LOADED
      );
      return;
    }

    setIsLoading(true);
    try {
      // Create the booking
      const bookingResponse = await apiClient.createBooking({
        consultantType: consultantType,
        details: data.query,
        amount: defaultPricing[consultantType], // Amount in paise
      });

      if (bookingResponse.success && bookingResponse.data) {
        const bookingId = bookingResponse.data.booking.id;

        // Create payment order
        const paymentResponse = await apiClient.createPaymentOrder(bookingId);

        if (paymentResponse.success && paymentResponse.data) {
          await handleRazorpayPayment(paymentResponse.data, bookingId, data);
        } else {
          toast.error(
            paymentResponse.error || "Failed to create payment order"
          );
        }
      } else {
        toast.error(bookingResponse.error || "Failed to create booking");
      }
    } catch (error) {
      console.error("Booking error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayPayment = async (
    order: PaymentOrder,
    bookingId: number,
    formData: BookingFormData
  ) => {
    setIsPaymentLoading(true);

    try {
      const handlePaymentSuccess = async (response: RazorpayResponse) => {
        try {
          setIsPaymentLoading(true);
          const paymentResponse = await apiClient.verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            bookingId: bookingId,
          });

          if (paymentResponse.success) {
            toast.success(
              "Payment successful! Your consultation has been booked."
            );
            router.push("/dashboard?tab=bookings");
          } else {
            toast.error(
              paymentResponse.error || PaymentErrors.VERIFICATION_FAILED
            );
          }
        } catch (error) {
          console.error("Payment verification error:", error);
          toast.error(PaymentErrors.VERIFICATION_FAILED);
        } finally {
          setIsPaymentLoading(false);
        }
      };

      const handlePaymentDismiss = () => {
        setIsPaymentLoading(false);
        toast.info(PaymentErrors.PAYMENT_CANCELLED);
      };

      const options = createRazorpayOptions(
        order,
        {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        {
          onSuccess: handlePaymentSuccess,
          onDismiss: handlePaymentDismiss,
        },
        `Consultation: ${category?.title || "Unknown Category"}`
      );

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Razorpay initialization error:", error);
      toast.error("Failed to initialize payment. Please try again.");
      setIsPaymentLoading(false);
    }
  };

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
                The consultation category you&apos;re looking for doesn&apos;t
                exist.
              </p>
              <Button asChild>
                <Link href="/">Go Back Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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
                  disabled={isLoading || isPaymentLoading || !isAuthenticated}
                >
                  {isLoading
                    ? "Creating Booking..."
                    : isPaymentLoading
                    ? "Processing Payment..."
                    : `Book Now - ₹${category.price}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
