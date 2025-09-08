"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  image: string;
  features: string[];
  price: number;
  duration: string;
  ctaText: string;
  ctaLink: string;
}

export function ExpandableCategories({ categories }: { categories: Category[] }) {
  const [active, setActive] = useState<Category | null>(null);
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
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

  useOutsideClick(ref, () => setActive(null));

  const handleBookNow = (category: Category) => {
    if (isAuthenticated) {
      // User is logged in, redirect to booking page
      router.push(category.ctaLink);
    } else {
      // User is not logged in, redirect to login with return URL
      router.push(`/login?next=${encodeURIComponent(category.ctaLink)}`);
    }
  };

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
        {active ? (
          <div className="fixed inset-0 grid place-items-center z-[100] p-4">
            <motion.button
              key={`button-${active.name}-${id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex absolute top-4 right-4 z-10 items-center justify-center bg-white dark:bg-neutral-800 rounded-full h-10 w-10 shadow-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              onClick={() => setActive(null)}
            >
              <X className="h-5 w-5 text-black dark:text-white" />
            </motion.button>
            <motion.div
              layoutId={`card-${active.name}-${id}`}
              ref={ref}
              className="w-full max-w-[95vw] sm:max-w-[700px] lg:max-w-[800px] h-[95vh] sm:h-auto sm:max-h-[95vh] flex flex-col bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
            >
              <motion.div layoutId={`image-${active.name}-${id}`}>
                <img
                  width={200}
                  height={200}
                  src={active.image}
                  alt={active.name}
                  className="w-full h-48 sm:h-72 lg:h-80 rounded-t-2xl sm:rounded-tr-lg sm:rounded-tl-lg object-cover object-center"
                />
              </motion.div>

              <div className="flex flex-col min-h-0">
                <div className="flex justify-between items-start p-4 sm:p-6">
                  <div className="flex-1">
                    <motion.h3
                      layoutId={`title-${active.name}-${id}`}
                      className="font-bold text-neutral-800 dark:text-neutral-200 text-xl sm:text-2xl mb-2"
                    >
                      {active.name}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className="text-neutral-600 dark:text-neutral-400 text-sm sm:text-base mb-4"
                    >
                      {active.description}
                    </motion.p>
                    <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="font-bold text-green-600 dark:text-green-400 text-lg">₹{active.price}</span>
                      <span>•</span>
                      <span>{active.duration}</span>
                    </div>
                  </div>
                </div>
                
                <div className="px-4 sm:px-6 pb-4 flex-1 overflow-hidden relative">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-600 scrollbar-track-transparent hover:scrollbar-thumb-neutral-400 dark:hover:scrollbar-thumb-neutral-500"
                    style={{ maxHeight: '200px' }}
                  >
                    <h4 className="font-semibold text-neutral-800 dark:text-neutral-200 mb-3 text-sm sm:text-base">
                      What's Included:
                    </h4>
                    <ul className="space-y-2">
                      {active.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                  {/* Scroll indicator */}
                  <div className="absolute bottom-0 left-4 right-4 sm:left-6 sm:right-6 h-4 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent pointer-events-none"></div>
                  
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col sm:flex-row gap-3 mt-4 sticky bottom-0 bg-white dark:bg-neutral-900 pt-2"
                  >
                    <Button
                      onClick={() => handleBookNow(active)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-sm sm:text-base py-3 sm:py-2"
                    >
                      {active.ctaText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setActive(null)}
                      className="px-6 py-3 sm:py-2 text-sm sm:text-base"
                    >
                      Close
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map((category) => (
          <motion.div
            layoutId={`card-${category.name}-${id}`}
            key={category.id}
            onClick={() => setActive(category)}
            className="group h-full flex flex-col bg-white dark:bg-gray-800 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <motion.div layoutId={`image-${category.name}-${id}`} className="relative overflow-hidden">
              <img
                width={100}
                height={100}
                src={category.image}
                alt={category.name}
                className="h-56 w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </motion.div>
            
            <div className="flex flex-col flex-1 p-6">
              <motion.h3
                layoutId={`title-${category.name}-${id}`}
                className="font-bold text-gray-900 dark:text-white text-xl mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
              >
                {category.name}
              </motion.h3>
              <motion.p
                layoutId={`description-${category.description}-${id}`}
                className="text-gray-600 dark:text-gray-300 text-sm mb-6 line-clamp-3 leading-relaxed flex-1"
              >
                {category.description}
              </motion.p>
              
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">₹{category.price}</span>
                    <span className="ml-2 text-gray-500">• {category.duration}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookNow(category);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Book Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
