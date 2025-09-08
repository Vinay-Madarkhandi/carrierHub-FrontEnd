"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";

interface RevenueBreakdownCardProps {
  totalRevenue: number;
  revenueBreakdown: {
    success: number;
    pending: number;
    processing: number;
    failed: number;
    completed: number;
  };
  bookings: Array<{ id: number; amount: number; status: string; consultantType: string; createdAt: string; studentId: number }>;
}

export function RevenueBreakdownCard({ 
  totalRevenue, 
  revenueBreakdown, 
  bookings 
}: RevenueBreakdownCardProps) {
  const [active, setActive] = useState<boolean>(false);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(false));

  const revenueData = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      description: "Revenue from successful payments"
    },
    {
      title: "Successful Payments",
      value: revenueBreakdown.success.toString(),
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900",
      description: "Students who completed payment"
    },
    {
      title: "Pending Payments",
      value: revenueBreakdown.pending.toString(),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
      description: "Payments awaiting completion"
    },
    {
      title: "Processing",
      value: revenueBreakdown.processing.toString(),
      icon: AlertCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900",
      description: "Payments being processed"
    },
    {
      title: "Failed Payments",
      value: revenueBreakdown.failed.toString(),
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900",
      description: "Payments that failed"
    },
    {
      title: "Completed Services",
      value: revenueBreakdown.completed.toString(),
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900",
      description: "Consultations completed"
    }
  ];

  const recentBookings = bookings
    .filter(b => b.status === "SUCCESS")
    .slice(0, 5)
    .map(booking => ({
      id: booking.id,
      studentId: booking.studentId,
      consultantType: booking.consultantType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      amount: (booking.amount / 100).toFixed(2),
      date: new Date(booking.createdAt).toLocaleDateString(),
      status: booking.status
    }));

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4">
            <motion.button
              key={`close-button-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex absolute top-4 right-4 lg:hidden items-center justify-center bg-white dark:bg-gray-800 rounded-full h-8 w-8 shadow-lg"
              onClick={() => setActive(false)}
            >
              <CloseIcon />
            </motion.button>
            
            <motion.div
              layoutId={`revenue-card-${id}`}
              ref={ref}
              className="w-full max-w-4xl h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden shadow-2xl"
            >
              <motion.div 
                layoutId={`revenue-header-${id}`}
                className="bg-gradient-to-r from-green-500 to-blue-600 p-6 text-white"
              >
                <div className="flex items-center gap-4">
                  <DollarSign className="h-8 w-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Revenue Breakdown</h2>
                    <p className="text-green-100">Detailed financial overview</p>
                  </div>
                </div>
              </motion.div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {revenueData.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg ${item.bgColor}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-6 w-6 ${item.color}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {item.title}
                          </p>
                          <p className={`text-2xl font-bold ${item.color}`}>
                            {item.value}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {item.description}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Recent Successful Payments
                  </h3>
                  
                  {recentBookings.length > 0 ? (
                    <div className="space-y-2">
                      {recentBookings.map((booking, index) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {booking.consultantType}
                              </p>
                              <p className="text-sm text-gray-500">
                                Student ID: {booking.studentId} • {booking.date}
                              </p>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            ₹{booking.amount}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>No successful payments yet</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div
        layoutId={`revenue-card-${id}`}
        onClick={() => setActive(true)}
        className="cursor-pointer"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{totalRevenue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500">
                  {revenueBreakdown.success} successful payments • Click for details
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.05 }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-gray-600"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};
