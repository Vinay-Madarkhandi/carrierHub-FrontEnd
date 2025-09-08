import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { AuthWrapper } from "@/components/auth-wrapper";
import { AdminProvider } from "@/contexts/admin-context";
import { AdminWrapper } from "@/components/admin-wrapper";
import { ClientWrapper } from "@/components/client-wrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarrierHub - Book the Right Consultant for Your Future",
  description: "Find the perfect consultant for your career guidance, college selection, exam preparation, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          src="https://checkout.razorpay.com/v1/checkout.js"
          async
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientWrapper>
            <AuthProvider>
              <AdminProvider>
                <AuthWrapper>
                  <AdminWrapper>
                    <div className="relative flex min-h-screen flex-col">
                      <Navbar />
                      <main className="flex-1">{children}</main>
                    </div>
                  </AdminWrapper>
                </AuthWrapper>
                <Toaster />
              </AdminProvider>
            </AuthProvider>
          </ClientWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
