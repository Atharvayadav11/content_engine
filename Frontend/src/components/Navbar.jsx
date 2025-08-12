"use client"

import { Link, useLocation } from "react-router-dom"
import { UserButton, useUser } from '@clerk/clerk-react'
import { Home, Plus } from "lucide-react"
import CreditBalance from './CreditBalance'

const Navbar = () => {
  const { user } = useUser()
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/dashboard" className="text-xl font-bold text-gray-800">
              Advanced Automate Blog Engine
            </Link>

            <div className="flex space-x-4">
              <Link
                to="/dashboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Home size={16} />
                <span>Dashboard</span>
              </Link>

              <Link
                to="/blog/create"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive("/blog/create")
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Plus size={16} />
                <span>Create Blog</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-64">
              <CreditBalance />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Welcome, {user?.firstName || user?.username || 'User'}
              </span>
              <UserButton 
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
