import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import axios from 'axios'
import { CreditCard, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const CreditBalance = () => {
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth()

  useEffect(() => {
    fetchCredits()
  }, [])

  const fetchCredits = async () => {
    try {
      const token = await getToken()
      if (!token) return
      
      const response = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCredits(response.data.user.credits)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
      toast.error('Failed to load credit balance')
    } finally {
      setLoading(false)
    }
  }

  // Function to refresh credits (can be called from parent components)
  const refreshCredits = () => {
    fetchCredits()
  }

  // Make refreshCredits available globally for other components to use
  useEffect(() => {
    window.refreshCredits = refreshCredits
    return () => {
      delete window.refreshCredits
    }
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-16 rounded-lg w-64"></div>
    )
  }

  return (
    <div className={`p-4 rounded-lg transition-all duration-300 ${
      credits === 0 
        ? 'bg-red-50 border border-red-200 shadow-md' 
        : credits <= 1 
          ? 'bg-yellow-50 border border-yellow-200 shadow-md'
          : 'bg-blue-50 border border-blue-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {credits === 0 ? (
            <AlertTriangle className="text-red-600 mr-2" size={20} />
          ) : credits <= 1 ? (
            <AlertTriangle className="text-yellow-600 mr-2" size={20} />
          ) : (
            <CreditCard className="text-blue-600 mr-2" size={20} />
          )}
          <div>
            <p className={`text-sm font-medium ${
              credits === 0 
                ? 'text-red-800' 
                : credits <= 1 
                  ? 'text-yellow-800'
                  : 'text-blue-800'
            }`}>
              Available Blogs
            </p>
            <p className={`text-2xl font-bold ${
              credits === 0 
                ? 'text-red-900' 
                : credits <= 1 
                  ? 'text-yellow-900'
                  : 'text-blue-900'
            }`}>
              {credits}
            </p>
          </div>
        </div>
        {credits === 0 && (
          <div className="text-right">
            <p className="text-xs text-red-600 font-medium">No Blogs Left!</p>
            <p className="text-xs text-red-500">Upgrade to continue</p>
          </div>
        )}
        {credits === 1 && (
          <div className="text-right">
            <p className="text-xs text-yellow-600 font-medium">Last Blog!</p>
            <p className="text-xs text-yellow-500">1 blog remaining</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CreditBalance
