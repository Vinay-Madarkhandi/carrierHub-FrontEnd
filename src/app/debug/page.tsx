"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testApiConnection = async () => {
    setIsLoading(true)
    addLog("🔧 Starting API test...")
    
    try {
      addLog("📱 User Agent: " + navigator.userAgent)
      addLog("🌐 Current URL: " + window.location.href)
      addLog("🔗 API Base URL: " + (apiClient as any).baseURL)
      
      addLog("📡 Testing connection...")
      const response = await apiClient.testConnection()
      
      addLog("✅ Response received: " + JSON.stringify(response, null, 2))
      
      if (response.success) {
        addLog("🎉 SUCCESS: Connection established!")
      } else {
        addLog("❌ FAILED: " + response.error)
      }
    } catch (error) {
      addLog("💥 ERROR: " + (error as Error).message)
      addLog("💥 ERROR TYPE: " + (error as Error).name)
      addLog("💥 ERROR STACK: " + (error as Error).stack)
    } finally {
      setIsLoading(false)
    }
  }

  const testLogin = async () => {
    setIsLoading(true)
    addLog("🔐 Testing login...")
    
    try {
      const response = await apiClient.login({
        email: "test@example.com",
        password: "Maderchod123$"
      })
      
      addLog("🔐 Login response: " + JSON.stringify(response, null, 2))
    } catch (error) {
      addLog("💥 Login error: " + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const testDirectFetch = async () => {
    setIsLoading(true)
    addLog("🌐 Testing direct fetch...")
    
    try {
      const response = await fetch('https://carrierhub-backend.onrender.com/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      })
      addLog("🌐 Direct fetch status: " + response.status)
      addLog("🌐 Direct fetch ok: " + response.ok)
      
      if (response.ok) {
        const data = await response.json()
        addLog("🌐 Direct fetch data: " + JSON.stringify(data, null, 2))
      } else {
        addLog("🌐 Direct fetch error: " + response.statusText)
      }
    } catch (error) {
      addLog("💥 Direct fetch error: " + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const testLoginDirect = async () => {
    setIsLoading(true)
    addLog("🔐 Testing direct login fetch...")
    
    try {
      const response = await fetch('https://carrierhub-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify({
          email: "test@example.com",
          password: "Maderchod123$"
        })
      })
      
      addLog("🔐 Direct login status: " + response.status)
      addLog("🔐 Direct login ok: " + response.ok)
      
      if (response.ok) {
        const data = await response.json()
        addLog("🔐 Direct login data: " + JSON.stringify(data, null, 2))
      } else {
        addLog("🔐 Direct login error: " + response.statusText)
        const errorText = await response.text()
        addLog("🔐 Direct login error body: " + errorText)
      }
    } catch (error) {
      addLog("💥 Direct login error: " + (error as Error).message)
      addLog("💥 Error type: " + (error as Error).name)
    } finally {
      setIsLoading(false)
    }
  }

  const testCORS = async () => {
    setIsLoading(true)
    addLog("🌐 Testing CORS with different domain...")
    
    try {
      // Test with a known working API
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1')
      addLog("🌐 CORS test status: " + response.status)
      addLog("🌐 CORS test ok: " + response.ok)
      
      if (response.ok) {
        const data = await response.json()
        addLog("🌐 CORS test data: " + JSON.stringify(data, null, 2))
        addLog("✅ CORS is working - issue is with your backend")
      } else {
        addLog("❌ CORS test failed: " + response.statusText)
      }
    } catch (error) {
      addLog("💥 CORS test error: " + (error as Error).message)
      addLog("❌ CORS is blocked - this might be the issue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Mobile Debug Page</h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={testApiConnection}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test API Connection"}
          </button>
          
          <button
            onClick={testLogin}
            disabled={isLoading}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test Login"}
          </button>
          
          <button
            onClick={testDirectFetch}
            disabled={isLoading}
            className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test Direct Fetch"}
          </button>
          
          <button
            onClick={testLoginDirect}
            disabled={isLoading}
            className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test Direct Login"}
          </button>
          
          <button
            onClick={testCORS}
            disabled={isLoading}
            className="bg-red-500 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? "Testing..." : "Test CORS"}
          </button>
        </div>

        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))}
        </div>
      </div>
    </div>
  )
}
