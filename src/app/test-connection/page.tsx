"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestConnectionPage() {
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const testDirectFetch = async () => {
    setLoading(true)
    setResult("Testing direct fetch...\n")
    
    try {
      const response = await fetch('https://carrierhub-backend.onrender.com/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      })
      
      setResult(prev => prev + `Status: ${response.status}\n`)
      setResult(prev => prev + `Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}\n`)
      
      if (response.ok) {
        const data = await response.json()
        setResult(prev => prev + `Success: ${JSON.stringify(data, null, 2)}\n`)
      } else {
        setResult(prev => prev + `Error: ${response.statusText}\n`)
      }
    } catch (error) {
      setResult(prev => prev + `Error: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testWithCredentials = async () => {
    setLoading(true)
    setResult("Testing with credentials...\n")
    
    try {
      const response = await fetch('https://carrierhub-backend.onrender.com/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
      })
      
      setResult(prev => prev + `Status: ${response.status}\n`)
      setResult(prev => prev + `Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}\n`)
      
      if (response.ok) {
        const data = await response.json()
        setResult(prev => prev + `Success: ${JSON.stringify(data, null, 2)}\n`)
      } else {
        setResult(prev => prev + `Error: ${response.statusText}\n`)
      }
    } catch (error) {
      setResult(prev => prev + `Error: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    setLoading(true)
    setResult("Testing login...\n")
    
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
      
      setResult(prev => prev + `Status: ${response.status}\n`)
      setResult(prev => prev + `Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}\n`)
      
      if (response.ok) {
        const data = await response.json()
        setResult(prev => prev + `Success: ${JSON.stringify(data, null, 2)}\n`)
      } else {
        const errorText = await response.text()
        setResult(prev => prev + `Error: ${response.statusText} - ${errorText}\n`)
      }
    } catch (error) {
      setResult(prev => prev + `Error: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Connection Test</CardTitle>
          <CardDescription>Test different connection methods to debug CORS issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testDirectFetch} disabled={loading}>
              Test Direct Fetch
            </Button>
            <Button onClick={testWithCredentials} disabled={loading}>
              Test with Credentials
            </Button>
            <Button onClick={testLogin} disabled={loading}>
              Test Login
            </Button>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Results:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {result || "Click a button to test connection..."}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
