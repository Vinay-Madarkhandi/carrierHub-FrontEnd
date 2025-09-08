"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CORSTestPage() {
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const testCORS = async () => {
    setLoading(true)
    setResult("Testing CORS configuration...\n\n")
    
    try {
      // Test 1: Simple GET request
      setResult(prev => prev + "1. Testing GET /api/categories...\n")
      const response1 = await fetch('https://carrierhub-backend.onrender.com/api/categories', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      })
      
      setResult(prev => prev + `   Status: ${response1.status}\n`)
      setResult(prev => prev + `   OK: ${response1.ok}\n`)
      
      if (response1.ok) {
        const data1 = await response1.json()
        setResult(prev => prev + `   Success: Found ${data1.data?.categories?.length || 0} categories\n`)
      } else {
        setResult(prev => prev + `   Error: ${response1.statusText}\n`)
      }
      
      setResult(prev => prev + "\n")
      
      // Test 2: POST request (login)
      setResult(prev => prev + "2. Testing POST /api/auth/login...\n")
      const response2 = await fetch('https://carrierhub-backend.onrender.com/api/auth/login', {
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
      
      setResult(prev => prev + `   Status: ${response2.status}\n`)
      setResult(prev => prev + `   OK: ${response2.ok}\n`)
      
      if (response2.ok) {
        await response2.json()
        setResult(prev => prev + `   Success: Login response received\n`)
      } else {
        const errorText = await response2.text()
        setResult(prev => prev + `   Error: ${response2.statusText} - ${errorText}\n`)
      }
      
      setResult(prev => prev + "\n")
      
      // Test 3: Check CORS headers
      setResult(prev => prev + "3. Checking CORS headers...\n")
      const corsHeaders = {
        'Access-Control-Allow-Origin': response1.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': response1.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': response1.headers.get('Access-Control-Allow-Headers'),
      }
      
      setResult(prev => prev + `   Access-Control-Allow-Origin: ${corsHeaders['Access-Control-Allow-Origin'] || 'Not set'}\n`)
      setResult(prev => prev + `   Access-Control-Allow-Methods: ${corsHeaders['Access-Control-Allow-Methods'] || 'Not set'}\n`)
      setResult(prev => prev + `   Access-Control-Allow-Headers: ${corsHeaders['Access-Control-Allow-Headers'] || 'Not set'}\n`)
      
    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  const testWithCredentials = async () => {
    setLoading(true)
    setResult("Testing with credentials...\n\n")
    
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
      setResult(prev => prev + `OK: ${response.ok}\n`)
      
      if (response.ok) {
        const data = await response.json()
        setResult(prev => prev + `Success: Found ${data.data?.categories?.length || 0} categories\n`)
      } else {
        setResult(prev => prev + `Error: ${response.statusText}\n`)
      }
    } catch (error) {
      setResult(prev => prev + `❌ Error: ${error}\n`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>CORS Test</CardTitle>
          <CardDescription>Test CORS configuration and connectivity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testCORS} disabled={loading}>
              Test CORS
            </Button>
            <Button onClick={testWithCredentials} disabled={loading}>
              Test with Credentials
            </Button>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Results:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96 whitespace-pre-wrap">
              {result || "Click a button to test CORS..."}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
