/**
 * Consultant Types Configuration
 * Centralized configuration for consultant types, pricing, and features
 */

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
} from "lucide-react";
import React from "react";

import { type ConsultantType } from "@/lib/api";

export interface ConsultantTypeConfig {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
  image: string;
  features: string[];
  price: number;
  duration: string;
}

// Consultant type mappings with consistent pricing
export const consultantTypeMap: Record<ConsultantType, ConsultantTypeConfig> = {
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
    price: 500,
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
    price: 800,
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
    price: 600,
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
    price: 1200,
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
    price: 700,
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
    price: 900,
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
    price: 600,
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
    price: 500,
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
    price: 600,
    duration: "75 min session",
  },
};

// Fallback categories for offline mode
export const fallbackCategories = [
  {
    type: "CAREER_GUIDANCE" as ConsultantType,
    title: "Career Guidance",
    description: "Get personalized career advice and planning",
  },
  {
    type: "COLLEGE_COURSE" as ConsultantType,
    title: "College Course Selection",
    description: "Choose the right college and course",
  },
  {
    type: "EXAM_PREPARATION" as ConsultantType,
    title: "Exam Preparation",
    description: "Expert guidance for competitive exams",
  },
  {
    type: "STUDY_ABROAD" as ConsultantType,
    title: "Study Abroad",
    description: "Complete guidance for international education",
  },
  {
    type: "SKILL_MENTORSHIP" as ConsultantType,
    title: "Skill Mentorship",
    description: "Develop industry-relevant skills",
  },
  {
    type: "JOB_PLACEMENT" as ConsultantType,
    title: "Job Placement",
    description: "Get help with job search and placement",
  },
  {
    type: "GOVERNMENT_JOBS" as ConsultantType,
    title: "Government Jobs",
    description: "Guidance for government job preparation",
  },
  {
    type: "PERSONAL_GROWTH" as ConsultantType,
    title: "Personal Growth",
    description: "Enhance your personality and soft skills",
  },
  {
    type: "ALTERNATIVE_CAREERS" as ConsultantType,
    title: "Alternative Careers",
    description: "Explore unconventional career paths",
  },
];

// Transform backend categories to expandable card format
export const transformCategories = (categories: { type: ConsultantType; title: string; description: string; }[]) => {
  return categories
    .map((category) => {
      const typeInfo = consultantTypeMap[category.type];
      if (!typeInfo) return null;

      return {
        id: category.type,
        title: category.title,
        description: category.description,
        icon: typeInfo.icon,
        color: typeInfo.color,
        href: typeInfo.href,
        image: typeInfo.image,
        features: typeInfo.features,
        price: typeInfo.price,
        duration: typeInfo.duration,
      };
    })
    .filter(Boolean);
};
