"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from "@clerk/clerk-react"
import axios from "axios"
import toast from "react-hot-toast"
import { handleApiCall } from "../utils/apiClient"
import {
  FileText,
  Search,
  Target,
  Loader2,
  Save,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Copy,
  Send,
} from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import WriterZenCredentialsModal from "../components/WriterZenCredentialsModal"

const BlogDetails = () => {
  const { id } = useParams()
  const { getToken, user } = useAuth()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [writerzenAuth, setWriterzenAuth] = useState(false)
  const [writerzenLoggedIn, setWriterzenLoggedIn] = useState(true)
  const [actionLoading, setActionLoading] = useState("")
  const [keywordSuggestions, setKeywordSuggestions] = useState([])
  const [keywordsToInclude, setKeywordsToInclude] = useState([])
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [selectedIncludeKeywords, setSelectedIncludeKeywords] = useState([])
  const [showCredentialsModal, setShowCredentialsModal] = useState(false)
  const [writerzenAuthData, setWriterzenAuthData] = useState(null)
  const [keywordsSaved, setKeywordsSaved] = useState(false)
  const [isSubmittingFinalBlog, setIsSubmittingFinalBlog] = useState(false)
  const [finalBlogSubmitted, setFinalBlogSubmitted] = useState(false)

  useEffect(() => {
    fetchBlog()
    checkWriterzenAuth()
  }, [id])

  useEffect(() => {
    if (blog?.relatedKeywords && blog.relatedKeywords.length > 0) {
      setKeywordsSaved(true)
    }
  }, [blog])

  const fetchBlog = async () => {
    try {
      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.get(`/blogs/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          setBlog(response.data.blog)
          return response
        },
        "load blog",
        getToken,
      )
    } catch (error) {
      // Error handling is done in handleApiCall
    } finally {
      setLoading(false)
    }
  }

  const checkWriterzenAuth = async () => {
    try {
      const token = await getToken()
      const response = await axios.get("/writerzen/auth-status", {
        headers: { Authorization: `Bearer ${token}` },
      })
      setWriterzenAuth(response.data.isAuthenticated)
      setWriterzenAuthData(response.data.authData)
      setWriterzenLoggedIn(response.data.isAuthenticated)
    } catch (error) {
      console.error("❌ Auth check error:", error)
    }
  }

  const testClaudeConnection = async () => {
    setActionLoading("test-claude")
    try {
      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.get("/ai/test-claude", {
            headers: { Authorization: `Bearer ${token}` },
          })
          toast.success("Claude AI connection successful!")
          return response
        },
        "test Claude AI connection",
        getToken,
      )
    } catch (error) {
      // Error handling is done in handleApiCall
    } finally {
      setActionLoading("")
    }
  }

  const handleSaveCredentials = async (credentials) => {
    setActionLoading("save-credentials")
    try {
      const endpoint = writerzenAuthData ? "/writerzen/update-credentials" : "/writerzen/save-credentials"
      const method = writerzenAuthData ? "put" : "post"

      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios[method](endpoint, credentials, {
            headers: { Authorization: `Bearer ${token}` },
          })
          setWriterzenAuth(true)
          setWriterzenAuthData(response.data.authData)
          setWriterzenLoggedIn(true)
          toast.success("WriterZen credentials saved and logged in successfully!")
          return response
        },
        "save WriterZen credentials",
        getToken,
      )
    } catch (error) {
      console.error("❌ Save credentials error:", error)
      throw error
    } finally {
      setActionLoading("")
    }
  }

  const handleContinueWithExisting = async () => {
    setActionLoading("continue-existing")
    try {
      // Just mark as logged in since credentials already exist
      setWriterzenLoggedIn(true)
      toast.success("Logged in with existing WriterZen credentials!")
      //console.log("✅ Logged in with existing WriterZen credentials")
    } catch (error) {
      console.error("❌ Continue with existing error:", error)
      toast.error("Failed to login with existing credentials")
    } finally {
      setActionLoading("")
    }
  }

  const handleWriterzenLogout = async () => {
    if (!window.confirm("Are you sure you want to logout from WriterZen? This will remove your credentials.")) {
      return
    }

    setActionLoading("logout")
    try {
      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.delete("/writerzen/remove-credentials", {
            headers: { Authorization: `Bearer ${token}` },
          })
          setWriterzenAuth(false)
          setWriterzenAuthData(null)
          setWriterzenLoggedIn(false)
          setKeywordSuggestions([])
          setKeywordsToInclude([])
          setSelectedKeywords([])
          setSelectedIncludeKeywords([])
          toast.success("Logged out from WriterZen successfully!")
          return response
        },
        "logout from WriterZen",
        getToken,
      )
    } catch (error) {
      // Error handling is done in handleApiCall
    } finally {
      setActionLoading("")
    }
  }

  const extractTOC = async () => {
    setActionLoading("toc")
    try {
      const urls = blog.urls.map((url) => url.url)

      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.post(
            "/ai/extract-toc",
            { urls },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )

          await axios.put(
            `/blogs/${id}`,
            {
              tableOfContent: response.data.tableOfContent,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )

          setBlog((prev) => ({
            ...prev,
            tableOfContent: response.data.tableOfContent,
          }))

          toast.success("Table of Contents extracted using Claude AI!")
          return response
        },
        "extract table of contents",
        getToken,
      )
    } catch (error) {
      // Error handling is done in handleApiCall
    } finally {
      setActionLoading("")
    }
  }

  const getKeywordSuggestions = async () => {
    if (!writerzenLoggedIn) {
      toast.error("Please login to WriterZen first")
      return
    }

    setActionLoading("keywords")
    try {
      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.get(`/writerzen/keywords?input=${encodeURIComponent(blog.topicKeyword)}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          setKeywordSuggestions(response.data.data.keywords)
          toast.success(`Found ${response.data.data.keywords.length} keyword suggestions`)
          return response
        },
        "get keyword suggestions",
        getToken,
      )
    } catch (error) {
      if (error.response?.data?.needsCredentialUpdate) {
        toast.error("WriterZen credentials are invalid. Please update them.")
        setWriterzenAuth(false)
        setWriterzenLoggedIn(false)
        checkWriterzenAuth()
      }
    } finally {
      setActionLoading("")
    }
  }

  const getKeywordsToInclude = async () => {
    if (!writerzenLoggedIn) {
      toast.error("Please login to WriterZen first")
      return
    }

    if (!blog || !blog.topicKeyword) {
      toast.error("Blog data not loaded. Please wait and try again.")
      return
    }

    setActionLoading("include-keywords")
    try {
      console.log("🎯 Getting keywords to include for:", blog.topicKeyword)

      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.post(
            "/writerzen/keywords-to-include",
            {
              keyword: blog.topicKeyword.trim(),
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )
          setKeywordsToInclude(response.data.data.keywords)
          toast.success(`Found ${response.data.data.keywords.length} keywords to include`)
          return response
        },
        "get keywords to include",
        getToken,
      )
    } catch (error) {
      console.error("❌ Keywords to include error details:", error.response?.data)
      if (error.response?.data?.needsCredentialUpdate) {
        toast.error("WriterZen credentials are invalid. Please update them.")
        setWriterzenAuth(false)
        setWriterzenLoggedIn(false)
        checkWriterzenAuth()
      } else if (error.response?.status === 400) {
        toast.error(`Invalid request: ${error.response?.data?.message || "Bad request"}`)
      }
    } finally {
      setActionLoading("")
    }
  }

  const saveSelectedKeywords = async () => {
    setActionLoading("save-keywords")
    try {
      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.put(
            `/blogs/${id}`,
            {
              relatedKeywords: selectedKeywords.map((k) => ({
                keyword: k.keyword,
                searchVolume: k.searchVolume,
                selected: true,
              })),
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )

          setBlog((prev) => ({
            ...prev,
            relatedKeywords: selectedKeywords.map((k) => ({
              keyword: k.keyword,
              searchVolume: k.searchVolume,
              selected: true,
            })),
          }))

          setKeywordsSaved(true)
          toast.success("Related keywords saved!")
          return response
        },
        "save keywords",
        getToken,
      )
    } catch (error) {
      // Error handling is done in handleApiCall
    } finally {
      setActionLoading("")
    }
  }

  const saveSelectedIncludeKeywords = async () => {
    setActionLoading("save-include-keywords")
    try {
      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.put(
            `/blogs/${id}`,
            {
              keywordsToInclude: selectedIncludeKeywords.map((k) => ({
                text: k.text,
                searchVolume: k.searchVolume,
                repeat: k.repeat,
                density: k.density,
                selected: true,
              })),
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )

          setBlog((prev) => ({
            ...prev,
            keywordsToInclude: selectedIncludeKeywords.map((k) => ({
              text: k.text,
              searchVolume: k.searchVolume,
              repeat: k.repeat,
              density: k.density,
              selected: true,
            })),
          }))

          toast.success("Keywords to include saved!")
          return response
        },
        "save keywords to include",
        getToken,
      )
    } catch (error) {
      // Error handling is done in handleApiCall
    } finally {
      setActionLoading("")
    }
  }

  const generateBackgroundDescription = async () => {
    if (!blog.tableOfContent) {
      toast.error("Please extract Table of Contents first")
      return
    }

    setActionLoading("description")
    try {
      await handleApiCall(
        async () => {
          const token = await getToken()
          const response = await axios.post(
            "/ai/generate-description",
            {
              topicKeyword: blog.topicKeyword,
              tableOfContent: blog.tableOfContent,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )

          await axios.put(
            `/blogs/${id}`,
            {
              backgroundDescription: response.data.backgroundDescription,
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )

          setBlog((prev) => ({
            ...prev,
            backgroundDescription: response.data.backgroundDescription,
          }))

          toast.success("Background description generated using Claude AI!")
          return response
        },
        "generate background description",
        getToken,
      )
    } catch (error) {
      // Error handling is done in handleApiCall
    } finally {
      setActionLoading("")
    }
  }

  const handleKeywordSelection = (keyword) => {
    setSelectedKeywords((prev) => {
      const isSelected = prev.some((k) => k.keyword === keyword.keyword)
      if (isSelected) {
        return prev.filter((k) => k.keyword !== keyword.keyword)
      } else {
        return [...prev, keyword]
      }
    })
  }

  const handleIncludeKeywordSelection = (keyword) => {
    setSelectedIncludeKeywords((prev) => {
      const isSelected = prev.some((k) => k.text === keyword.text)
      if (isSelected) {
        return prev.filter((k) => k.text !== keyword.text)
      } else {
        return [...prev, keyword]
      }
    })
  }

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied to clipboard!`)
    } catch (error) {
      console.error("Failed to copy:", error)
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleCreateFinalBlog = async () => {
    setIsSubmittingFinalBlog(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/final-blog-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          blogId: id,
          userEmail: user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress,
          topicKeyword: blog.topicKeyword,
        }),
      })

      if (response.ok) {
        setFinalBlogSubmitted(true)
        setTimeout(() => {
          setFinalBlogSubmitted(false)
        }, 5000)
      } else {
        console.error("Failed to submit final blog request")
        toast.error("Failed to submit final blog request. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting final blog request:", error)
      toast.error("Network error. Please check your connection and try again.")
    } finally {
      setIsSubmittingFinalBlog(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!blog) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Blog not found</h2>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{blog.topicKeyword}</h1>
          <p className="text-gray-600 mt-1">Blog automation workflow</p>
        </div>
        <div className="flex space-x-2">
          {/* <button
            onClick={testClaudeConnection}
            disabled={actionLoading === "test-claude"}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading === "test-claude" ? (
              <Loader2 size={20} className="mr-2 animate-spin" />
            ) : (
              <TestTube size={20} className="mr-2" />
            )}
            Test Claude AI
          </button>

          {!writerzenLoggedIn ? (
            <button
              onClick={() => setShowCredentialsModal(true)}
              disabled={actionLoading === "save-credentials" || actionLoading === "continue-existing"}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading === "save-credentials" || actionLoading === "continue-existing" ? (
                <Loader2 size={20} className="mr-2 animate-spin" />
              ) : (
                <LogIn size={20} className="mr-2" />
              )}
              Login to WriterZen
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-md text-sm">
                <CheckCircle size={16} className="mr-2" />
                WriterZen Connected
              </div>
              <button
                onClick={handleWriterzenLogout}
                disabled={actionLoading === "logout"}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
              >
                {actionLoading === "logout" ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <LogOut size={16} className="mr-2" />
                )}
                Logout
              </button>
            </div>
          )} */}
        </div>
      </div>

      {/* WriterZen Status Warning */}
      {writerzenAuthData && !writerzenLoggedIn && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="text-yellow-600 mr-3" size={20} />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">WriterZen credentials may be expired</p>
              <p>Please login again to continue using WriterZen features.</p>
            </div>
          </div>
        </div>
      )}

      {/* Selected URLs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Selected Competitor Blogs ({blog.urls.length})</h2>
        <div className="space-y-3">
          {blog.urls.map((url, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">{url.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">{url.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>Origin: {url.origin_site}</span>
                    <span>Source: {url.source}</span>
                  </div>
                </div>
                <a
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  <ExternalLink size={16} className="mr-1" />
                  Visit
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={extractTOC}
            disabled={actionLoading === "toc"}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {actionLoading === "toc" ? (
              <Loader2 size={20} className="mr-2 animate-spin" />
            ) : (
              <FileText size={20} className="mr-2" />
            )}
            Find Table of Content (Claude AI)
          </button>
        </div>
      </div>

      {/* Table of Contents */}
      {blog.tableOfContent && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="whitespace-pre-wrap text-sm text-gray-700">{blog.tableOfContent}</pre>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={generateBackgroundDescription}
              disabled={actionLoading === "description"}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {actionLoading === "description" ? (
                <Loader2 size={20} className="mr-2 animate-spin" />
              ) : (
                <Sparkles size={20} className="mr-2" />
              )}
              Generate Background Description (Claude AI)
            </button>
          </div>
        </div>
      )}

      {/* Background Description */}
      {blog.backgroundDescription && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Background Description</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700">{blog.backgroundDescription}</p>
          </div>
        </div>
      )}

      {/* WriterZen Actions */}
      {writerzenLoggedIn && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">WriterZen Actions</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold text-sm">
                1
              </div>
              <div className="flex-1">
                <button
                  onClick={getKeywordSuggestions}
                  disabled={actionLoading === "keywords"}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === "keywords" ? (
                    <Loader2 size={20} className="mr-2 animate-spin" />
                  ) : (
                    <Search size={20} className="mr-2" />
                  )}
                  Find Keywords Suggestions
                </button>
                {keywordsSaved && (
                  <span className="ml-3 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    <CheckCircle size={12} className="mr-1" />
                    Completed
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                  keywordsSaved ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"
                }`}
              >
                2
              </div>
              <div className="flex-1">
                {keywordsSaved ? (
                  <button
                    onClick={getKeywordsToInclude}
                    disabled={actionLoading === "include-keywords"}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === "include-keywords" ? (
                      <Loader2 size={20} className="mr-2 animate-spin" />
                    ) : (
                      <Target size={20} className="mr-2" />
                    )}
                    Find Keywords to Include
                  </button>
                ) : (
                  <div className="inline-flex items-center px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed">
                    <Target size={20} className="mr-2" />
                    Find Keywords to Include
                    <span className="ml-2 text-xs">(Complete step 1 first)</span>
                  </div>
                )}
                {blog?.keywordsToInclude && blog.keywordsToInclude.length > 0 && (
                  <span className="ml-3 inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    <CheckCircle size={12} className="mr-1" />
                    Completed
                  </span>
                )}
              </div>
            </div>

            {!keywordsSaved && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Step 1:</strong> First, find and save keyword suggestions to unlock the next step.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Keyword Suggestions */}
      {keywordSuggestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Keyword Suggestions ({keywordSuggestions.length})</h2>
            <div className="text-sm text-gray-600">Selected: {selectedKeywords.length}</div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-y-auto">
            {keywordSuggestions.map((keyword, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedKeywords.some((k) => k.keyword === keyword.keyword)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleKeywordSelection(keyword)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{keyword.keyword}</p>
                    <p className="text-sm text-gray-600">Volume: {keyword.searchVolume?.toLocaleString()}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedKeywords.some((k) => k.keyword === keyword.keyword)}
                    onChange={() => handleKeywordSelection(keyword)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            ))}
          </div>

          {selectedKeywords.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={saveSelectedKeywords}
                disabled={actionLoading === "save-keywords"}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "save-keywords" ? (
                  <Loader2 size={20} className="mr-2 animate-spin" />
                ) : (
                  <Save size={20} className="mr-2" />
                )}
                Save Selected Keywords
              </button>
            </div>
          )}
        </div>
      )}

      {/* Keywords to Include */}
      {keywordsToInclude.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Keywords to Include ({keywordsToInclude.length})</h2>
            <div className="text-sm text-gray-600">Selected: {selectedIncludeKeywords.length}</div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-y-auto">
            {keywordsToInclude.map((keyword, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedIncludeKeywords.some((k) => k.text === keyword.text)
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleIncludeKeywordSelection(keyword)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{keyword.text}</p>
                    <p className="text-sm text-gray-600">Volume: {keyword.searchVolume?.toLocaleString()}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedIncludeKeywords.some((k) => k.text === keyword.text)}
                    onChange={() => handleIncludeKeywordSelection(keyword)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            ))}
          </div>

          {selectedIncludeKeywords.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={saveSelectedIncludeKeywords}
                disabled={actionLoading === "save-include-keywords"}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === "save-include-keywords" ? (
                  <Loader2 size={20} className="mr-2 animate-spin" />
                ) : (
                  <Save size={20} className="mr-2" />
                )}
                Save Selected Keywords
              </button>
            </div>
          )}
        </div>
      )}

      {/* Final Blog Page */}
      {blog.tableOfContent && blog.backgroundDescription && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Final Blog Page</h2>
            {finalBlogSubmitted ? (
              <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-md">
                <CheckCircle size={20} className="mr-2" />
                Your blog will be sent to your email within an hour
              </div>
            ) : (
              <button
                onClick={handleCreateFinalBlog}
                disabled={isSubmittingFinalBlog}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingFinalBlog ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={20} className="mr-2" />
                    Create Final Blog
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Topic Keyword</h3>
                <button
                  onClick={() => copyToClipboard(blog.topicKeyword, "Topic Keyword")}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy Topic Keyword"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-gray-700">{blog.topicKeyword}</p>
            </div>

            {blog.relatedKeywords && blog.relatedKeywords.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Related Keywords</h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        blog.relatedKeywords
                          .map((k) => `${k.keyword} (${k.searchVolume?.toLocaleString()})`)
                          .join(", "),
                        "Related Keywords",
                      )
                    }
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Copy All Related Keywords"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {blog.relatedKeywords.map((keyword, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {keyword.keyword} ({keyword.searchVolume?.toLocaleString()})
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Background Description</h3>
                <button
                  onClick={() => copyToClipboard(blog.backgroundDescription, "Background Description")}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy Background Description"
                >
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-gray-700">{blog.backgroundDescription}</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Outline (Use this outline)</h3>
                <button
                  onClick={() => copyToClipboard(blog.tableOfContent, "Outline")}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy Outline"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">{blog.tableOfContent}</pre>
              </div>
            </div>

            {blog.keywordsToInclude && blog.keywordsToInclude.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">Keywords to use in the article</h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        blog.keywordsToInclude
                          .map((k) => `${k.text} (${k.repeat} times, Volume: ${k.searchVolume?.toLocaleString()})`)
                          .join("\n"),
                        "Keywords to Include",
                      )
                    }
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Copy All Keywords to Include"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <div className="space-y-2">
                  {blog.keywordsToInclude.map((keyword, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{keyword.text}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {keyword.repeat} times (Volume: {keyword.searchVolume?.toLocaleString()})
                        </span>
                        <button
                          onClick={() => copyToClipboard(keyword.text, "Keyword")}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Copy Keyword"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Example Articles</h3>
                <button
                  onClick={() =>
                    copyToClipboard(blog.urls.map((url) => `${url.title}: ${url.url}`).join("\n"), "Example Articles")
                  }
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy All Example Articles"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {blog.urls.map((url, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="font-medium">{url.url}</span>
                    <div className="flex items-center space-x-2">
                      <a
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View Article
                      </a>
                      <button
                        onClick={() => copyToClipboard(url.url, "Article URL")}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copy Article URL"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">Direct Competitors</h3>
                <button
                  onClick={() =>
                    copyToClipboard(
                      blog.competitors && blog.competitors.length > 0
                        ? blog.competitors.join(", ")
                        : "No competitors specified",
                      "Direct Competitors",
                    )
                  }
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Copy All Direct Competitors"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {blog.competitors && blog.competitors.length > 0 ? (
                  blog.competitors.map((competitor, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                      {competitor}
                    </span>
                  ))
                ) : (
                  <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm italic">
                    No competitors specified
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <WriterZenCredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        onSave={handleSaveCredentials}
        onContinue={handleContinueWithExisting}
        existingData={writerzenAuthData}
      />
    </div>
  )
}

export default BlogDetails
