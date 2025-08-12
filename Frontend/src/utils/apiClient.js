import axios from 'axios'
import toast from 'react-hot-toast'

// Set default base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
axios.defaults.baseURL = API_URL

// Enhanced error handler for credit-related errors
export const handleApiCall = async (requestFunction, operationName, getToken) => {
  try {
    if (getToken) {
      const token = await getToken()
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    }
    
    const result = await requestFunction()
    
    // Refresh credit balance if operation was successful and used credits
    if (result.data?.creditsUsed && window.refreshCredits) {
      window.refreshCredits()
    }
    
    return result
  } catch (error) {
    console.error(`❌ ${operationName} error:`, error)
    
    if (error.response?.status === 402 && error.response?.data?.type === 'credits_exhausted') {
      // Credits exhausted error
      toast.error(
        "🚫 Free credits exhausted! You can only create 2 blogs with free credits. Please upgrade to continue.",
        { 
          duration: 8000,
          style: {
            background: '#FEE2E2',
            color: '#991B1B',
            border: '1px solid #FCA5A5'
          }
        }
      )
    } else if (error.response?.status === 401) {
      // Authentication error
      toast.error("Authentication failed. Please sign in again.")
    } else if (error.response?.status >= 500) {
      // Server error
      toast.error(`Server error: ${operationName} failed`)
    } else {
      // Other errors
      const message = error.response?.data?.message || `Failed to ${operationName}`
      toast.error(message)
    }
    
    throw error
  }
}

// Utility function to create authenticated axios instance
export const createAuthenticatedRequest = (getToken) => {
  return async (requestConfig) => {
    const token = await getToken()
    return axios({
      ...requestConfig,
      headers: {
        ...requestConfig.headers,
        'Authorization': `Bearer ${token}`
      }
    })
  }
}

export default axios
