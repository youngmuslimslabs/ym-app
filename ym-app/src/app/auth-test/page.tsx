'use client'

import { useState } from 'react'
import LoginForm from '@/components/auth/LoginForm'
import SignupForm from '@/components/auth/SignupForm'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthTestPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { user, signOut, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4 text-center">You're logged in!</h2>
          <div className="space-y-2 mb-6">
            <p className="text-gray-600">
              <span className="font-semibold">Email:</span> {user.email}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">User ID:</span> {user.id}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Created:</span> {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Auth Test Page</h1>

        <div className="flex mb-6 border-b">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 pb-2 text-center ${
              mode === 'login'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 pb-2 text-center ${
              mode === 'signup'
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500'
            }`}
          >
            Sign Up
          </button>
        </div>

        {mode === 'login' ? <LoginForm /> : <SignupForm />}

        <div className="mt-6 p-4 bg-gray-100 rounded text-sm text-gray-600">
          <p className="font-semibold mb-2">Test Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Sign up with any email (doesn't need to be real)</li>
            <li>Password must be at least 6 characters</li>
            <li>Supabase will send a verification email (if email is real)</li>
            <li>You can still login without verification for testing</li>
          </ul>
        </div>
      </div>
    </div>
  )
}