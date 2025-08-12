"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import BlogCreator from "./pages/BlogCreator"
import BlogDetails from "./pages/BlogDetails"
import LoadingSpinner from "./components/LoadingSpinner"

function App() {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return <LoadingSpinner />
  }

  return (
    <Routes>
      {/* Public sign-in route */}
      <Route path="/sign-in" element={
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
                <SignInButton mode="modal">
                  <button className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Sign In
                  </button>
                </SignInButton>
              </div>
            </div>
          </div>
        </SignedOut>
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
