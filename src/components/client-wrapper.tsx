"use client"

import { useEffect, useState } from 'react'

interface ClientWrapperProps {
  children: React.ReactNode
}

export function ClientWrapper({ children }: ClientWrapperProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Mark as hydrated after client-side mount
    setIsHydrated(true)
  }, [])

  // Always render children to prevent hydration mismatch
  // Use CSS to hide content during hydration instead
  return (
    <div className={isHydrated ? '' : 'opacity-0'}>
      {children}
    </div>
  )
}
