"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Set up axios defaults
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  axios.defaults.baseURL = API_URL

  // Set auth token if exists
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.defaults.headers.common["x-auth-token"] = token
      checkAuth()
    } else {
      setLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await axios.get("/auth/me")
      setUser(response.data.user)
      console.log("✅ User authenticated:", response.data.user.username)
    } catch (error) {
      console.error("❌ Auth check failed:", error)
      localStorage.removeItem("token")
      delete axios.defaults.headers.common["x-auth-token"]
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post("/auth/login", { email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["x-auth-token"] = token
      setUser(user)

      toast.success("Login successful!")
      console.log("✅ Login successful:", user.username)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Login failed"
      toast.error(message)
      console.error("❌ Login error:", message)
      return { success: false, message }
    }
  }

  const register = async (username, email, password) => {
    try {
      const response = await axios.post("/auth/register", { username, email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      axios.defaults.headers.common["x-auth-token"] = token
      setUser(user)

      toast.success("Registration successful!")
      console.log("✅ Registration successful:", user.username)
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed"
      toast.error(message)
      console.error("❌ Registration error:", message)
      return { success: false, message }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete axios.defaults.headers.common["x-auth-token"]
    setUser(null)
    toast.success("Logged out successfully!")
    console.log("🚪 User logged out")
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
