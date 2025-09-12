"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
} from "react";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Target,
  Plane,
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  Lightbulb,
  ArrowRight,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  Shield,
  FileText,
  ExternalLink,
  Heart,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { apiClient, type Category } from "@/lib/api";
import { logger } from '@/lib/logger';

// Lazy load heavy components
const TestimonialsSection = lazy(() =>
  import("@/components/testimonials-section").then((module) => ({
    default: module.TestimonialsSection,
  }))
);
const ExpandableCategories = lazy(() =>
  import("@/components/expandable-categories").then((module) => ({
    default: module.ExpandableCategories,
  }))
);

// Loading component for sections with hydration safety
const SectionLoader = () => (
  <div className="flex items-center justify-center p-8">
    <div
      className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      suppressHydrationWarning
    ></div>
  </div>
);

// Map backend consultant types to frontend display
const consultantTypeMap: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    href: string;
    image: string;
    features: string[];
    price: number;
    duration: string;
  }
> = {
  CAREER_GUIDANCE: {
    icon: GraduationCap,
    color: "bg-blue-500",
    href: "/book/career-guidance",
    image: "/Career Guidance.webp",
    features: [
      "Personalized career assessment",
      "Industry insights and trends",
      "Goal setting and planning",
      "Resume and portfolio review",
      "Interview preparation",
    ],
    price: 500, // Updated to match backend pricing
    duration: "60 min session",
  },
  COLLEGE_COURSE: {
    icon: BookOpen,
    color: "bg-green-500",
    href: "/book/college-course",
    image: "/College Course Selection.jpg",
    features: [
      "Course selection guidance",
      "University recommendations",
      "Admission process support",
      "Scholarship opportunities",
      "Future career prospects",
    ],
    price: 800, // Updated to match backend pricing
    duration: "45 min session",
  },
  EXAM_PREPARATION: {
    icon: Target,
    color: "bg-purple-500",
    href: "/book/exam-preparation",
    image: "/Exam Preparation.jpg",
    features: [
      "Study strategy planning",
      "Subject-specific guidance",
      "Time management tips",
      "Mock test analysis",
      "Stress management techniques",
    ],
    price: 600, // Updated to match backend pricing
    duration: "45 min session",
  },
  STUDY_ABROAD: {
    icon: Plane,
    color: "bg-orange-500",
    href: "/book/study-abroad",
    image: "/Study Abroad.jpeg",
    features: [
      "Country and university selection",
      "Application process guidance",
      "Visa and documentation support",
      "Scholarship opportunities",
      "Cultural adaptation tips",
    ],
    price: 1200, // Updated to match backend pricing
    duration: "90 min session",
  },
  SKILL_MENTORSHIP: {
    icon: Users,
    color: "bg-pink-500",
    href: "/book/skill-mentorship",
    image: "/Skill Mentorship.jpg",
    features: [
      "Skill gap analysis",
      "Learning path creation",
      "Practical project guidance",
      "Industry best practices",
      "Portfolio development",
    ],
    price: 700, // Updated to match backend pricing
    duration: "75 min session",
  },
  JOB_PLACEMENT: {
    icon: Briefcase,
    color: "bg-indigo-500",
    href: "/book/job-placement",
    image: "/Job Placement.jpeg",
    features: [
      "Job search strategy",
      "Resume optimization",
      "LinkedIn profile enhancement",
      "Interview preparation",
      "Salary negotiation tips",
    ],
    price: 900, // Updated to match backend pricing
    duration: "60 min session",
  },
  GOVERNMENT_JOBS: {
    icon: Building2,
    color: "bg-red-500",
    href: "/book/government-jobs",
    image: "/Government Jobs.jpeg",
    features: [
      "Exam pattern analysis",
      "Syllabus breakdown",
      "Study material recommendations",
      "Previous year papers",
      "Current affairs guidance",
    ],
    price: 600, // Updated to match backend pricing
    duration: "60 min session",
  },
  PERSONAL_GROWTH: {
    icon: TrendingUp,
    color: "bg-teal-500",
    href: "/book/personal-growth",
    image: "/Personal Growth.jpg",
    features: [
      "Personality assessment",
      "Communication skills",
      "Leadership development",
      "Confidence building",
      "Goal achievement strategies",
    ],
    price: 500, // Updated to match backend pricing
    duration: "60 min session",
  },
  ALTERNATIVE_CAREERS: {
    icon: Lightbulb,
    color: "bg-yellow-500",
    href: "/book/alternative-careers",
    image: "/Alternative Careers.jpg",
    features: [
      "Non-traditional career exploration",
      "Freelancing opportunities",
      "Entrepreneurship guidance",
      "Creative career paths",
      "Market demand analysis",
    ],
    price: 600, // Updated to match backend pricing
    duration: "75 min session",
  },
};

// Transform backend categories to expandable card format (memoized)
const transformCategories = (categories: Category[]) => {
  return categories
    .map((category) => {
      const typeInfo = consultantTypeMap[category.type];
      if (!typeInfo) return null;

      return {
        id: category.type,
        name: category.title,
        description: category.description,
        icon: typeInfo.icon.name,
        image: typeInfo.image,
        features: typeInfo.features,
        price: typeInfo.price,
        duration: typeInfo.duration,
        ctaText: "Book Now",
        ctaLink: typeInfo.href,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Fallback categories when API is unavailable
  const fallbackCategories: Category[] = [
    {
      type: "CAREER_GUIDANCE",
      title: "Career Guidance",
      description: "Get personalized career advice and planning",
    },
    {
      type: "COLLEGE_COURSE",
      title: "College Course Selection",
      description: "Choose the right course for your future",
    },
    {
      type: "EXAM_PREPARATION",
      title: "Exam Preparation",
      description: "Strategic preparation for competitive exams",
    },
    {
      type: "STUDY_ABROAD",
      title: "Study Abroad",
      description: "Complete guidance for international education",
    },
    {
      type: "SKILL_MENTORSHIP",
      title: "Skill Mentorship",
      description: "Develop industry-relevant skills with experts",
    },
    {
      type: "JOB_PLACEMENT",
      title: "Job Placement",
      description: "Land your dream job with expert guidance",
    },
    {
      type: "GOVERNMENT_JOBS",
      title: "Government Jobs",
      description: "Prepare for government sector opportunities",
    },
    {
      type: "PERSONAL_GROWTH",
      title: "Personal Growth",
      description: "Enhance your personality and soft skills",
    },
    {
      type: "ALTERNATIVE_CAREERS",
      title: "Alternative Careers",
      description: "Explore unconventional career paths",
    },
  ];

  // Memoized fetch function
  const fetchCategories = useCallback(async () => {
    logger.debug("Fetching categories...");
    try {
      const response = await apiClient.getCategories();
      logger.debug("Categories response received", { success: response.success });

      if (response.success && response.data?.categories) {
        setCategories(response.data.categories);
        logger.info("Categories loaded successfully", { count: response.data.categories.length });
        setIsOfflineMode(false);
      } else {
        logger.warn("API unavailable, using fallback categories", response.error);
        // Use fallback categories when API fails
        setCategories(fallbackCategories);
        setIsOfflineMode(true);
      }
    } catch (error) {
      console.error("📂 Failed to fetch categories, using fallback:", error);
      // Use fallback categories when API fails
      setCategories(fallbackCategories);
      setIsOfflineMode(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn("📂 Categories fetch timeout, setting loading to false");
      setIsLoading(false);
    }, 15000); // 15 second timeout

    fetchCategories();

    return () => clearTimeout(timeout);
  }, [fetchCategories]);

  // Memoize transformed categories
  const transformedCategories = useMemo(() => {
    return transformCategories(categories);
  }, [categories]);

  return (
    <div className="min-h-screen">
      {/* Offline Mode Banner */}
      {isOfflineMode && (
        <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium">
          <div className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>
              Server temporarily unavailable - running in offline mode with
              limited functionality
            </span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen flex items-center">
        <div className="container mx-auto px-4 py-6 sm:py-24 lg:py-36 relative w-full">
          {/* Centered Content */}
          <div className="text-center max-w-4xl mx-auto relative z-10">
            <div className="flex flex-col sm:flex-row justify-center items-center mb-4 sm:mb-8 space-y-3 sm:space-y-0">
              <div className="relative h-12 w-12 sm:h-16 sm:w-16 mr-0 sm:mr-4">
                <Image
                  src="/Logo.png"
                  alt="CarrierHub Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                CarrierHub
              </h1>
            </div>
            <p className="mt-3 sm:mt-6 text-lg sm:text-2xl lg:text-3xl font-semibold leading-relaxed text-gray-800 dark:text-gray-200 mb-3 sm:mb-6">
              Book the Right Consultant for Your Future
            </p>
            <p className="mt-2 sm:mt-4 text-sm sm:text-lg leading-relaxed text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-12 px-4">
              Connect with expert consultants who can guide you through every
              step of your career journey. From school students to working
              professionals, we have the right mentor for everyone.
            </p>
            <div className="mt-6 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 px-4">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto text-base sm:text-xl px-6 sm:px-10 py-4 sm:py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Link href="#categories">
                  Explore Categories
                  <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-6 sm:w-6" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-xl px-6 sm:px-10 py-4 sm:py-6 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-all duration-300"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          </div>

          {/* Upper Left Image - Responsive sizing for all screens */}
          <div className="absolute top-4 left-4 sm:top-8 sm:left-8 w-20 h-20 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg sm:shadow-2xl group z-0">
            <Image
              src="/carrierhub-hero-1-removebg-preview.png"
              alt="Career Guidance Consultation"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Lower Right Image - Responsive sizing for all screens */}
          <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 w-20 h-20 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 xl:w-80 xl:h-80 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg sm:shadow-2xl group z-0">
            <Image
              src="/carrierhub-hero-2-removebg-preview.png"
              alt="Student Success Story"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>

          {/* Floating Elements - Responsive sizing */}
          <div className="absolute top-16 right-16 sm:top-20 sm:right-20 w-12 h-12 sm:w-16 sm:h-16 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse z-0"></div>
          <div className="absolute bottom-16 left-16 sm:bottom-20 sm:left-20 w-8 h-8 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse delay-1000 z-0"></div>
        </div>
      </section>

      {/* Categories Section */}
      <section
        id="categories"
        className="py-24 bg-white dark:bg-gray-900 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-800/50"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <div className="inline-block">
              <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6 relative">
                Choose Your Consulting Category
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
              </h2>
            </div>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Select the area where you need expert guidance and book a
              consultation session
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Loading categories...
              </p>
            </div>
          ) : (
            <Suspense fallback={<SectionLoader />}>
              <ExpandableCategories categories={transformedCategories} />
            </Suspense>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 dark:bg-gray-800 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/30 to-pink-50/30 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20">
            <div className="inline-block">
              <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6 relative">
                Why Choose CarrierHub?
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-full"></div>
              </h2>
            </div>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We provide comprehensive career guidance with expert consultants
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Expert Consultants
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Connect with verified industry experts and experienced
                professionals
              </p>
            </div>

            <div className="text-center group">
              <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Personalized Guidance
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Get tailored advice based on your specific goals and
                circumstances
              </p>
            </div>

            <div className="text-center group">
              <div className="mx-auto h-16 w-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Proven Results
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Join thousands of successful students and professionals
                we&apos;ve helped
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection />
      </Suspense>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {/* Company Info */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center mb-6">
                <div className="relative h-10 w-10 sm:h-12 sm:w-12 mr-3 sm:mr-4">
                  <Image
                    src="/Logo.png"
                    alt="CarrierHub Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  CarrierHub
                </h3>
              </div>
              <p className="text-gray-300 mb-6 text-sm sm:text-base leading-relaxed">
                Your trusted partner in career development. Connect with expert
                consultants and unlock your potential with personalized
                guidance.
              </p>

              {/* Contact Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-start text-gray-300">
                  <Mail className="w-4 h-4 mr-3 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm break-all">
                    support@carrierhub.com
                  </span>
                </div>
                <div className="flex items-center text-gray-300">
                  <Phone className="w-4 h-4 mr-3 text-green-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">+91 8856094992</span>
                </div>
                <div className="flex items-start text-gray-300">
                  <MapPin className="w-4 h-4 mr-3 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm leading-relaxed">
                    Landewadi, Bhosari, Pune,
                    <br className="sm:hidden" />
                    Maharashtra, India-411039
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer group">
                  <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-blue-200" />
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-sky-500 to-sky-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer group">
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-sky-200" />
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-700 to-blue-800 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer group">
                  <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-blue-200" />
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center hover:scale-110 transition-transform duration-300 cursor-pointer group">
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-pink-200" />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="mt-8 sm:mt-0">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" />
                Quick Links
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link
                    href="#categories"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group text-sm sm:text-base"
                  >
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:text-blue-400 flex-shrink-0" />
                    Browse Categories
                  </Link>
                </li>
                <li>
                  <Link
                    href="/signup"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group text-sm sm:text-base"
                  >
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:text-green-400 flex-shrink-0" />
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group text-sm sm:text-base"
                  >
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:text-purple-400 flex-shrink-0" />
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group text-sm sm:text-base"
                  >
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:text-orange-400 flex-shrink-0" />
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="mt-8 sm:mt-0">
              <h4 className="text-base sm:text-lg font-semibold text-white mb-4 sm:mb-6 flex items-center">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-400" />
                Support
              </h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group text-sm sm:text-base"
                  >
                    <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:text-green-400 flex-shrink-0" />
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group text-sm sm:text-base"
                  >
                    <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:text-blue-400 flex-shrink-0" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group text-sm sm:text-base"
                  >
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:text-purple-400 flex-shrink-0" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors duration-300 flex items-center group text-sm sm:text-base"
                  >
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2 group-hover:text-orange-400 flex-shrink-0" />
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 sm:mt-12 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-gray-400 text-xs sm:text-sm flex items-center">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-500 flex-shrink-0" />
                © 2024 CarrierHub. All rights reserved.
              </p>
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm">
                <span className="text-gray-400 flex items-center">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-red-400 flex-shrink-0" />
                  Made with love for students
                </span>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="text-gray-400 flex items-center">
                  <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-blue-400 flex-shrink-0" />
                  Powered by Next.js
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
