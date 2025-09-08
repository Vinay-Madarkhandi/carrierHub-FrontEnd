"use client";

import React from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { Users, TrendingUp, Award } from "lucide-react";

const testimonials = [
  {
    quote: "CarrierHub's career guidance completely transformed my professional trajectory. The consultant helped me identify my strengths and guided me through the transition from a non-tech background to landing my dream job at Google.",
    name: "Sarah Chen",
    title: "Software Engineer at Google",
  },
  {
    quote: "The college guidance session was incredibly insightful. I was confused between multiple engineering streams, but the consultant's personalized approach helped me choose the right path that aligned with my interests and career goals.",
    name: "Rajesh Kumar",
    title: "IIT Delhi Graduate",
  },
  {
    quote: "The government job preparation guidance was exactly what I needed. The consultant provided a structured study plan and helped me understand the exam pattern better. I'm now more confident about my preparation strategy.",
    name: "Priya Sharma",
    title: "UPSC Aspirant",
  },
  {
    quote: "The study abroad guidance was comprehensive and personalized. From university selection to visa application, the consultant guided me through every step. I'm now pursuing my master's at Stanford, which was my dream university.",
    name: "Arjun Patel",
    title: "MS Student at Stanford",
  },
  {
    quote: "The skill mentorship program helped me develop the exact skills I needed for my career transition. The consultant was knowledgeable and provided practical advice that I could implement immediately.",
    name: "Amit Singh",
    title: "Product Manager at Microsoft",
  },
  {
    quote: "CarrierHub's exam preparation guidance was a game-changer. The consultant helped me create a study schedule that worked with my busy schedule and provided valuable tips for cracking the competitive exam.",
    name: "Neha Gupta",
    title: "IAS Officer",
  },
  {
    quote: "The job placement assistance was outstanding. The consultant helped me prepare for interviews, improve my resume, and connect with the right opportunities. I landed my dream job within 3 months!",
    name: "Vikram Reddy",
    title: "Data Scientist at Amazon",
  },
  {
    quote: "The personal growth sessions helped me build confidence and develop leadership skills. I'm now leading a team of 10 people and couldn't be happier with my career progression.",
    name: "Deepika Joshi",
    title: "Team Lead at Infosys",
  },
];

const stats = [
  { label: "Students Helped", value: "10,000+", Icon: Users },
  { label: "Success Rate", value: "95%", Icon: TrendingUp },
  { label: "Satisfaction", value: "4.9/5", Icon: Award },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-white dark:bg-gray-900 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-50/50 to-transparent dark:via-gray-800/50"></div>
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-20">
          <div className="inline-block">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl mb-6 relative">
              What Our Students Say
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-green-600 to-blue-600 rounded-full"></div>
            </h2>
          </div>
          <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Real stories from students who transformed their careers with CarrierHub
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center group">
              <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <stat.Icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {stat.value}
              </div>
              <div className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Infinite Moving Cards Testimonials */}
        <div className="h-[40rem] rounded-2xl flex flex-col antialiased bg-gray-50 dark:bg-gray-800 items-center justify-center relative overflow-hidden shadow-inner">
          <InfiniteMovingCards
            items={testimonials}
            direction="right"
            speed="slow"
          />
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to Transform Your Career?
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of successful students who found their path with CarrierHub
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Get Started Today
            </a>
            <a
              href="#categories"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-lg font-semibold rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300"
            >
              Browse Categories
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
