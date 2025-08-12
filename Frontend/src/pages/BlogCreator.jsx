"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from '@clerk/clerk-react'
import axios from "axios"
import toast from "react-hot-toast"
import { Search, Save, Loader2, AlertTriangle } from "lucide-react"
import { handleApiCall } from "../utils/apiClient"
import CreditExhaustionModal from "../components/CreditExhaustionModal"

const BlogCreator = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [topicKeyword, setTopicKeyword] = useState("")
  const [scrapedResults, setScrapedResults] = useState([])
  const [selectedUrls, setSelectedUrls] = useState([])
  const [credits, setCredits] = useState(0)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const { getToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    checkCredits()
  }, [])

  const checkCredits = async () => {
    try {
      const token = await getToken()
      const response = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCredits(response.data.user.credits)
      
      // If no credits, show modal immediately
      if (response.data.user.credits === 0) {
        setShowCreditModal(true)
      }
    } catch (error) {
      console.error('Failed to check credits:', error)
    }
  }

  const handleScrape = async () => {
    if (!topicKeyword.trim()) {
      toast.error("Please enter a topic keyword")
      return
    }

    setLoading(true)
    try {
      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.post("/scraper/scrape", { query: topicKeyword }, {
            headers: { Authorization: `Bearer ${token}` }
          })
          setScrapedResults(response.data.results)
          setStep(2)
          toast.success(`Found ${response.data.results.length} results`)
          return response
        },
        "scrape competitor blogs",
        getToken
      )
    } catch (error) {
      // Error handling is done in handleApiCall
    } finally {
      setLoading(false)
    }
  }

  const handleUrlSelection = (url) => {
    setSelectedUrls((prev) => {
      const isSelected = prev.some((selected) => selected.url === url.url)
      if (isSelected) {
        return prev.filter((selected) => selected.url !== url.url)
      } else {
        return [...prev, url]
      }
    })
  }

  const handleSaveBlog = async () => {
    if (selectedUrls.length === 0) {
      toast.error("Please select at least one URL")
      return
    }

    // Check credits before attempting to save
    if (credits === 0) {
      setShowCreditModal(true)
      return
    }

    setLoading(true)
    try {
      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.post("/blogs", {
            topicKeyword,
            urls: selectedUrls,
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })

          toast.success("Blog created successfully! 1 credit used.")
          
          // Update credits and refresh credit balance
          setCredits(prev => prev - 1)
          if (window.refreshCredits) {
            window.refreshCredits()
          }
          
          navigate(`/blog/${response.data.blog._id}`)
          return response
        },
        "create blog",
        getToken
      )
    } catch (error) {
      if (error.response?.status === 402) {
        setShowCreditModal(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Blog</h1>
        <div className="flex items-center justify-between mt-1">
          <p className="text-gray-600">Start by entering a topic keyword to scrape competitor blogs</p>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            credits === 0 
              ? 'bg-red-100 text-red-800' 
              : credits === 1 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
          }`}>
            {credits} blog{credits !== 1 ? 's' : ''} remaining
          </div>
        </div>
      </div>

      {/* Credit Warning */}
      {credits === 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-red-600 mr-3" size={20} />
            <div className="text-sm text-red-800">
              <p className="font-medium">No blog credits remaining</p>
              <p>You've used all your free blog creation credits. Please upgrade to create more blogs.</p>
            </div>
          </div>
        </div>
      )}

      {credits === 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-600 mr-3" size={20} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Last blog credit</p>
              <p>This is your final free blog. Use it wisely! Credits are never refunded, even if you delete the blog.</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Topic Keyword Input */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Enter Topic Keyword</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
                Topic Keyword
              </label>
              <input
                id="keyword"
                type="text"
                value={topicKeyword}
                onChange={(e) => setTopicKeyword(e.target.value)}
                placeholder="e.g., Sales Technique, Lead Generation, Marketing Tools"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              onClick={credits === 0 ? () => setShowCreditModal(true) : handleScrape}
              disabled={loading || !topicKeyword.trim()}
              className={`inline-flex items-center px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                credits === 0 
                  ? 'bg-gray-500 hover:bg-gray-600' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Search size={20} className="mr-2" />}
              {credits === 0 ? "No Credits Available" : loading ? "Scraping..." : "Start Scraping"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select URLs */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Step 2: Select Competitor Blogs ({scrapedResults.length} found)
            </h2>
            <div className="text-sm text-gray-600">Selected: {selectedUrls.length}</div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {scrapedResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedUrls.some((selected) => selected.url === result.url)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleUrlSelection(result)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium text-gray-900 truncate">{result.title}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                        {result.source}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Origin: {result.origin_site}</span>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 truncate max-w-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {result.url}
                      </a>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedUrls.some((selected) => selected.url === result.url)}
                    onChange={() => handleUrlSelection(result)}
                    className="ml-4 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Back to Keyword
            </button>
            <button
              onClick={credits === 0 ? () => setShowCreditModal(true) : handleSaveBlog}
              disabled={loading || selectedUrls.length === 0}
              className={`inline-flex items-center px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                credits === 0 
                  ? 'bg-gray-500 hover:bg-gray-600' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Save size={20} className="mr-2" />}
              {credits === 0 ? "No Credits Available" : loading ? "Saving..." : "Save Blog (1 Credit)"}
            </button>
          </div>
        </div>
      )}

      <CreditExhaustionModal 
        isOpen={showCreditModal} 
        onClose={() => setShowCreditModal(false)} 
      />
    </div>
  )
}

export default BlogCreator
