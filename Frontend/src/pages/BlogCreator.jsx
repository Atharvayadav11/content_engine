"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import toast from "react-hot-toast"
import { Search, Save, Loader2 } from "lucide-react"

const BlogCreator = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [topicKeyword, setTopicKeyword] = useState("")
  const [scrapedResults, setScrapedResults] = useState([])
  const [selectedUrls, setSelectedUrls] = useState([])
  const navigate = useNavigate()

  const handleScrape = async () => {
    if (!topicKeyword.trim()) {
      toast.error("Please enter a topic keyword")
      return
    }

    setLoading(true)
    try {
     // console.log("🔍 Starting scrape for:", topicKeyword)
      const response = await axios.post("/scraper/scrape", { query: topicKeyword })
      setScrapedResults(response.data.results)
      setStep(2)
      toast.success(`Found ${response.data.results.length} results`)
     // console.log("✅ Scraping completed:", response.data.totalResults)
    } catch (error) {
      console.error("❌ Scraping error:", error)
      toast.error("Failed to scrape results")
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

    setLoading(true)
    try {
     // console.log("💾 Saving blog with:", selectedUrls.length, "URLs")
      const response = await axios.post("/blogs", {
        topicKeyword,
        urls: selectedUrls,
      })

      toast.success("Blog created successfully!")
     // console.log("✅ Blog created:", response.data.blog._id)
      navigate(`/blog/${response.data.blog._id}`)
    } catch (error) {
      console.error("❌ Save blog error:", error)
      toast.error("Failed to create blog")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Blog</h1>
        <p className="text-gray-600 mt-1">Start by entering a topic keyword to scrape competitor blogs</p>
      </div>

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
              onClick={handleScrape}
              disabled={loading || !topicKeyword.trim()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Search size={20} className="mr-2" />}
              {loading ? "Scraping..." : "Start Scraping"}
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
              onClick={handleSaveBlog}
              disabled={loading || selectedUrls.length === 0}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 size={20} className="mr-2 animate-spin" /> : <Save size={20} className="mr-2" />}
              {loading ? "Saving..." : "Save Blog"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlogCreator
