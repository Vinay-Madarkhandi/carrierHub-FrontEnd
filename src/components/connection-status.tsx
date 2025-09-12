"use client"

import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface ConnectionStatusProps {
  className?: string
}

export function ConnectionStatus({ className = '' }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    // Check browser online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const checkApiStatus = async () => {
      // Don't check API if offline
      if (!isOnline) {
        setApiStatus('disconnected')
        return
      }

      try {
        setApiStatus('checking')
        const response = await apiClient.healthCheck()
        setApiStatus(response.success ? 'connected' : 'disconnected')
      } catch {
        setApiStatus('disconnected')
      }
    }

    // Initial check
    checkApiStatus()

    // Check every 30 seconds
    const intervalId = setInterval(checkApiStatus, 30000)

    return () => {
      clearInterval(intervalId)
    }
  }, [isOnline])

  useEffect(() => {
    // Show status indicator when there are connection issues
    if (!isOnline || apiStatus === 'disconnected') {
      setShowStatus(true)
    } else {
      // Hide after 3 seconds when connection is restored
      const timer = setTimeout(() => setShowStatus(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, apiStatus])

  if (!showStatus) return null

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: 'No internet connection',
        bgColor: 'bg-red-500',
        textColor: 'text-white'
      }
    }

    switch (apiStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          text: 'Connected to server',
          bgColor: 'bg-green-500',
          textColor: 'text-white'
        }
      case 'disconnected':
        return {
          icon: AlertCircle,
          text: 'Server temporarily unavailable - using offline mode',
          bgColor: 'bg-orange-500',
          textColor: 'text-white'
        }
      case 'checking':
        return {
          icon: Wifi,
          text: 'Checking connection...',
          bgColor: 'bg-blue-500',
          textColor: 'text-white'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg ${config.bgColor} ${config.textColor} transition-all duration-300`}>
        <Icon className="h-4 w-4" />
        <span className="text-sm font-medium">{config.text}</span>
      </div>
    </div>
  )
}

export default ConnectionStatus