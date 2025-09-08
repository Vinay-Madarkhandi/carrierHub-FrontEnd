"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { apiClient, BookingStatus, ConsultantType, Booking, Student } from "@/lib/api"
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  User,
  Calendar,
  DollarSign
} from "lucide-react"
import DashboardStats from "@/components/dashboard-stats"

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [users, setUsers] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all")
  const [typeFilter, setTypeFilter] = useState<ConsultantType | "all">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchData()
  }, [currentPage, statusFilter, typeFilter, searchTerm])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch bookings
      const bookingsResponse = await apiClient.getAdminBookings({
        page: currentPage,
        limit: 10,
        status: statusFilter !== "all" ? statusFilter : undefined,
        consultantType: typeFilter !== "all" ? typeFilter : undefined,
        search: searchTerm || undefined
      })

      if (bookingsResponse.success && bookingsResponse.data) {
        setBookings(bookingsResponse.data.bookings)
        setTotalPages(bookingsResponse.data.pagination?.pages || 1)
      }

      // Fetch users
      const usersResponse = await apiClient.getAllUsers({
        page: 1,
        limit: 10
      })

      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data.users)
      }

    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (bookingId: number, newStatus: BookingStatus) => {
    try {
      const response = await apiClient.updateBookingStatus(bookingId, newStatus)
      if (response.success) {
        // Refresh data
        fetchData()
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  const handleExport = async () => {
    try {
      const response = await apiClient.exportBookings()
      if (response.success) {
        // Create download link
        const blob = new Blob([response.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bookings-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Error exporting data:', err)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount / 100)
  }

  const getStatusBadge = (status: BookingStatus) => {
    const statusConfig = {
      PENDING: { variant: "secondary" as const, text: "Pending" },
      PROCESSING: { variant: "default" as const, text: "Processing" },
      SUCCESS: { variant: "default" as const, text: "Success" },
      FAILED: { variant: "destructive" as const, text: "Failed" },
      COMPLETED: { variant: "default" as const, text: "Completed" }
    }

    const config = statusConfig[status]
    return <Badge variant={config.variant}>{config.text}</Badge>
  }

  const getConsultantTypeLabel = (type: ConsultantType) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Manage bookings, users, and system settings</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats />

      {/* Main Content Tabs */}
      <Tabs defaultValue="bookings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bookings Management</CardTitle>
                  <CardDescription>
                    View and manage all booking requests
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as BookingStatus | "all")}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ConsultantType | "all")}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="CAREER_GUIDANCE">Career Guidance</SelectItem>
                      <SelectItem value="COLLEGE_COURSE">College Course</SelectItem>
                      <SelectItem value="EXAM_PREPARATION">Exam Preparation</SelectItem>
                      <SelectItem value="STUDY_ABROAD">Study Abroad</SelectItem>
                      <SelectItem value="SKILL_MENTORSHIP">Skill Mentorship</SelectItem>
                      <SelectItem value="JOB_PLACEMENT">Job Placement</SelectItem>
                      <SelectItem value="GOVERNMENT_JOBS">Government Jobs</SelectItem>
                      <SelectItem value="PERSONAL_GROWTH">Personal Growth</SelectItem>
                      <SelectItem value="ALTERNATIVE_CAREERS">Alternative Careers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No bookings found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold">
                              {booking.student?.name || 'Unknown Student'}
                            </h4>
                            {getStatusBadge(booking.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {getConsultantTypeLabel(booking.consultantType)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {booking.student?.email} • {booking.student?.phone}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(booking.createdAt).toLocaleDateString()} at{' '}
                            {new Date(booking.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-4">
                          <div className="font-semibold">
                            {formatCurrency(booking.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {booking.currency}
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Select
                            value={booking.status}
                            onValueChange={(value) => handleStatusUpdate(booking.id, value as BookingStatus)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="PROCESSING">Processing</SelectItem>
                              <SelectItem value="SUCCESS">Success</SelectItem>
                              <SelectItem value="FAILED">Failed</SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>
                View and manage all registered users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No users found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{user.name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                          <p className="text-xs text-gray-500">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>
                  Track revenue trends and growth
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Revenue analytics coming soon</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Analytics</CardTitle>
                <CardDescription>
                  Analyze booking patterns and trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Booking analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
