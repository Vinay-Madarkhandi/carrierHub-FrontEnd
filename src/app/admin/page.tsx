"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
  Search, 
  CheckCircle, 
  Clock,
  LogOut,
  Users,
  Calendar,
  Shield
} from "lucide-react"
import { apiClient, type Booking, type BookingStatus, type Student } from "@/lib/api"
import { useAdmin } from "@/contexts/admin-context"
import { RevenueBreakdownCard } from "@/components/revenue-breakdown-card"


export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [students, setStudents] = useState<Record<number, Student>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const router = useRouter()
  const { admin, isAuthenticated, logout } = useAdmin()

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings()
    }
  }, [isAuthenticated])

  const fetchBookings = async () => {
    try {
      const response = await apiClient.getAdminBookings()

      if (response.success && response.data) {
        const bookingsData = response.data.bookings || []
        setBookings(bookingsData)
        
        // Extract student data from bookings (backend already includes it)
        const studentsFromBookings: Record<number, Student> = {}
        bookingsData.forEach(booking => {
          if (booking.student && booking.studentId) {
            studentsFromBookings[booking.studentId] = booking.student
          }
        })
        
        // Set the student data
        setStudents(studentsFromBookings)
      } else {
        toast.error(response.error || "Failed to fetch bookings")
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }


  const updateBookingStatus = async (bookingId: number, newStatus: BookingStatus) => {
    try {
      const response = await apiClient.updateBookingStatus(bookingId, newStatus)

      if (response.success) {
        toast.success("Booking status updated successfully")
        fetchBookings()
      } else {
        toast.error(response.error || "Failed to update booking status")
      }
    } catch (error) {
      toast.error("Something went wrong")
    }
  }

  const handleLogout = () => {
    logout()
    toast.success("Logged out successfully")
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Paid</Badge>
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pending</Badge>
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }


  const filteredBookings = bookings.filter((booking) => {
    const student = booking.student || students[booking.studentId] // Use booking.student first
    const matchesSearch = 
      booking.consultantType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student && (
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    const matchesPayment = paymentFilter === "all" || booking.status === paymentFilter
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  const totalRevenue = bookings
    .filter(booking => booking.status === "SUCCESS")
    .reduce((sum, booking) => sum + (booking.amount / 100), 0) // Convert from paise to rupees

  const revenueBreakdown = {
    success: bookings.filter(b => b.status === "SUCCESS").length,
    pending: bookings.filter(b => b.status === "PENDING").length,
    processing: bookings.filter(b => b.status === "PROCESSING").length,
    failed: bookings.filter(b => b.status === "FAILED").length,
    completed: bookings.filter(b => b.status === "COMPLETED").length,
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Admin Access Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please log in to access the admin panel.
          </p>
          <Button asChild>
            <a href="/admin/login">Go to Admin Login</a>
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome, {admin?.name || admin?.email || "Admin"}! Manage bookings and consultant status
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {bookings.filter(b => b.status === "PROCESSING").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {bookings.filter(b => b.status === "COMPLETED").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <RevenueBreakdownCard 
            totalRevenue={totalRevenue}
            revenueBreakdown={revenueBreakdown}
            bookings={bookings}
          />
        </div>


        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Consultant Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="SUCCESS">Paid</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
            <CardDescription>
              Manage all consultation bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No bookings found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  No bookings match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <Card key={booking.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {booking.consultantType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {booking.student ? (
                            <>
                              <strong>{booking.student.name}</strong> (ID: {booking.studentId})
                              <br />
                              <span className="text-xs text-gray-500">{booking.student.email}</span>
                            </>
                          ) : students[booking.studentId] ? (
                            <>
                              <strong>{students[booking.studentId].name}</strong> (ID: {booking.studentId})
                              <br />
                              <span className="text-xs text-gray-500">{students[booking.studentId].email}</span>
                            </>
                          ) : (
                            <>
                              <strong>Student ID: {booking.studentId}</strong>
                              <br />
                              <span className="text-xs text-yellow-600">
                                ⚠️ Student data not available
                              </span>
                            </>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Booked on {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        {getPaymentStatusBadge(booking.status)}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <strong>Amount:</strong> ₹{(booking.amount / 100).toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <strong>Details:</strong> {booking.details}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingStatus(booking.id, "PROCESSING")}
                          disabled={booking.status === "PROCESSING"}
                        >
                          Mark Processing
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateBookingStatus(booking.id, "COMPLETED")}
                          disabled={booking.status === "COMPLETED"}
                        >
                          Mark Completed
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
