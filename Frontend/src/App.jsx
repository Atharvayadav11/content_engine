"use client"

import { Routes, Route, Navigate, useNavigate } from "react-router-dom"
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useAuth } from '@clerk/clerk-react'
import { useEffect } from 'react'
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import BlogCreator from "./pages/BlogCreator"
import BlogDetails from "./pages/BlogDetails"
import LoadingSpinner from "./components/LoadingSpinner"

function App() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { userId } = useAuth()
  const navigate = useNavigate()

  // Handle authentication state changes with more aggressive redirect
  useEffect(() => {
    if (isLoaded) {
      const currentPath = window.location.pathname
      
      if (isSignedIn && (currentPath === '/sign-in' || currentPath === '/sign-up')) {
        console.log('🔄 User authenticated, redirecting to dashboard from:', currentPath)
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 100)
      }
    }
  }, [isLoaded, isSignedIn, navigate])

  // Listen for userId changes (when user signs in)
  useEffect(() => {
    if (userId) {
      const currentPath = window.location.pathname
      if (currentPath === '/sign-in' || currentPath === '/sign-up') {
        console.log('🔄 UserId detected, redirecting to dashboard')
        navigate('/dashboard', { replace: true })
      }
    }
  }, [userId, navigate])

  // Backup redirect using window location (more reliable after Clerk auth)
  useEffect(() => {
    const handleAuthRedirect = () => {
      if (isLoaded && isSignedIn) {
        const currentPath = window.location.pathname
        if (currentPath === '/sign-in' || currentPath === '/sign-up') {
          console.log('🔄 Backup redirect - using window.location')
          window.location.href = '/dashboard'
        }
      }
    }

    // Listen for Clerk events
    window.addEventListener('clerk:loaded', handleAuthRedirect)
    window.addEventListener('clerk:signed-in', handleAuthRedirect)
    
    return () => {
      window.removeEventListener('clerk:loaded', handleAuthRedirect)
      window.removeEventListener('clerk:signed-in', handleAuthRedirect)
    }
  }, [isLoaded, isSignedIn])

  // Add debugging
  useEffect(() => {
    console.log('🔍 Auth State:', { 
      isLoaded, 
      isSignedIn, 
      userId: userId ? 'present' : 'none',
      currentPath: window.location.pathname 
    })
  }, [isLoaded, isSignedIn, userId])

  if (!isLoaded) {
    return <LoadingSpinner />
  }

  // Show error if Clerk is not configured
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-red-500">Missing VITE_CLERK_PUBLISHABLE_KEY environment variable</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Authentication routes */}
      <Route path="/sign-in" element={
        <>
          <SignedIn>
            <Navigate to="/dashboard" replace />
          </SignedIn>
          <SignedOut>
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="max-w-md w-full space-y-8">
                <div>
                  <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Welcome to Blog Engine
                  </h2>
                  <p className="mt-2 text-center text-sm text-gray-600">
                    Sign in to start creating amazing blogs with AI
                  </p>
                </div>
                <div className="flex justify-center">
                  <SignInButton 
                    mode="modal"
                    afterSignInUrl="/dashboard"
                    afterSignUpUrl="/dashboard"
                    redirectUrl="/dashboard"
                    signUpUrl="/sign-in"
                  >
                    <button 
                      className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => {
                        // Add a custom redirect handler
                        setTimeout(() => {
                          if (window.Clerk?.user) {
                            console.log('🔄 Manual redirect after auth')
                            window.location.href = '/dashboard'
                          }
                        }, 2000)
                      }}
                    >
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              </div>
            </div>
          </SignedOut>
        </>
      } />

      {/* Handle sign-up route - redirect appropriately */}
      <Route path="/sign-up" element={
        <>
          <SignedIn>
            <Navigate to="/dashboard" replace />
          </SignedIn>
          <SignedOut>
            <Navigate to="/sign-in" replace />
          </SignedOut>
        </>
      } />

      {/* Protected routes */}
      <Route path="/" element={
        <>
          <SignedIn>
            <Layout />
          </SignedIn>
          <SignedOut>
            <Navigate to="/sign-in" />
          </SignedOut>
        </>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="blog/create" element={<BlogCreator />} />
        <Route path="blog/:id" element={<BlogDetails />} />
      </Route>

      {/* Catch all redirect */}
      <Route path="*" element={
        isSignedIn ? <Navigate to="/dashboard" /> : <Navigate to="/sign-in" />
      } />
    </Routes>
  )
}

export default App
