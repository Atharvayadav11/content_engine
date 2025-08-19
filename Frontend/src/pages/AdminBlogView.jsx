"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import { ArrowLeft, Calendar, User, Tag, CheckCircle, Clock, RefreshCw, Copy, Check } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"

const AdminBlogView = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [copiedFields, setCopiedFields] = useState({})

  useEffect(() => {
    fetchBlog()
  }, [id])

  const fetchBlog = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("adminToken")
      if (!token) {
        navigate("/admin/login")
        return
      }

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/blogs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setBlog(response.data.blog)
      }
    } catch (error) {
      console.error("Failed to fetch blog:", error)
      if (error.response?.status === 401) {
        navigate("/admin/login")
      }
    } finally {
      setLoading(false)
    }
  }

  const updateBlogStatus = async (newStatus) => {
    setUpdatingStatus(true)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/blogs/${id}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (response.data.success) {
        setBlog((prev) => ({ ...prev, status: newStatus }))
      }
    } catch (error) {
      console.error("Failed to update blog status:", error)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      draft: { color: "bg-gray-100 text-gray-800", icon: Clock },
      processing: { color: "bg-blue-100 text-blue-800", icon: RefreshCw },
    }

    const config = statusConfig[status] || statusConfig.draft
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon size={16} className="mr-2" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedFields((prev) => ({ ...prev, [fieldName]: true }))
      setTimeout(() => {
        setCopiedFields((prev) => ({ ...prev, [fieldName]: false }))
      }, 2000)
    } catch (err) {
      console.error("Failed to copy text: ", err)
    }
  }

  const FieldWithCopy = ({ title, content, fieldName, children }) => {
    if (!content && !children) return null

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={() =>
              copyToClipboard(typeof content === "string" ? content : JSON.stringify(content, null, 2), fieldName)
            }
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            {copiedFields[fieldName] ? (
              <>
                <Check size={12} className="mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy size={12} className="mr-1" />
                Copy
              </>
            )}
          </button>
        </div>
        {children || (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!blog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Blog Not Found</h2>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Dashboard
            </button>

            <div className="flex items-center space-x-3">
              {getStatusBadge(blog.status)}

              {/* Status Update Buttons */}
              <div className="flex space-x-2">
                {blog.status === "pending" && (
                  <button
                    onClick={() => updateBlogStatus("completed")}
                    disabled={updatingStatus}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {updatingStatus ? (
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                    ) : (
                      <CheckCircle size={16} className="mr-2" />
                    )}
                    Approve
                  </button>
                )}

                {blog.status === "completed" && (
                  <button
                    onClick={() => updateBlogStatus("pending")}
                    disabled={updatingStatus}
                    className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {updatingStatus ? (
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                    ) : (
                      <Clock size={16} className="mr-2" />
                    )}
                    Mark Pending
                  </button>
                )}
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{blog.topicKeyword}</h1>

          {/* Blog Meta Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <User size={16} className="mr-2" />
              <span>{blog.userEmail}</span>
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-2" />
              <span>{formatDate(blog.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <Tag size={16} className="mr-2" />
              <span>ID: {blog._id}</span>
            </div>
          </div>
        </div>

        {/* Blog Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="prose max-w-none">
            {/* Competitors */}
            {blog.competitors && blog.competitors.length > 0 && (
              <FieldWithCopy title="Competitors" content={blog.competitors.join(", ")} fieldName="competitors">
                <div className="flex flex-wrap gap-2">
                  {blog.competitors.map((competitor, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {competitor}
                    </span>
                  ))}
                </div>
              </FieldWithCopy>
            )}

            {/* Persona */}
            <FieldWithCopy title="Target Persona" content={blog.persona} fieldName="persona" />

            {/* Additional Info */}
            <FieldWithCopy title="Additional Information" content={blog.additionalInfo} fieldName="additionalInfo" />

            {/* Background Description */}
            <FieldWithCopy
              title="Background Description"
              content={blog.backgroundDescription}
              fieldName="backgroundDescription"
            />

            {/* Table of Content */}
            <FieldWithCopy title="Table of Content" content={blog.tableOfContent} fieldName="tableOfContent" />

            {/* Related Keywords */}
            {blog.relatedKeywords && blog.relatedKeywords.length > 0 && (
              <FieldWithCopy
                title="Related Keywords"
                content={blog.relatedKeywords
                  .map(
                    (kw) =>
                      `${kw.keyword} (Volume: ${kw.searchVolume || "N/A"}, Selected: ${kw.selected ? "Yes" : "No"})`,
                  )
                  .join("\n")}
                fieldName="relatedKeywords"
              >
                <div className="space-y-2">
                  {blog.relatedKeywords.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900">{keyword.keyword}</span>
                        {keyword.searchVolume && (
                          <span className="text-sm text-gray-600">Volume: {keyword.searchVolume}</span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          keyword.selected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {keyword.selected ? "Selected" : "Not Selected"}
                      </span>
                    </div>
                  ))}
                </div>
              </FieldWithCopy>
            )}

            {/* Keywords to Include */}
            {blog.keywordsToInclude && blog.keywordsToInclude.length > 0 && (
              <FieldWithCopy
                title="Keywords to Include"
                content={blog.keywordsToInclude
                  .map(
                    (kw) =>
                      `${kw.text} (Volume: ${kw.searchVolume || "N/A"}, Repeat: ${kw.repeat || "N/A"}, Density: ${kw.density || "N/A"}%, Selected: ${kw.selected ? "Yes" : "No"})`,
                  )
                  .join("\n")}
                fieldName="keywordsToInclude"
              >
                <div className="space-y-2">
                  {blog.keywordsToInclude.map((keyword, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{keyword.text}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            keyword.selected ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {keyword.selected ? "Selected" : "Not Selected"}
                        </span>
                      </div>
                      <div className="flex space-x-4 text-sm text-gray-600">
                        {keyword.searchVolume && <span>Volume: {keyword.searchVolume}</span>}
                        {keyword.repeat && <span>Repeat: {keyword.repeat}</span>}
                        {keyword.density && <span>Density: {keyword.density}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </FieldWithCopy>
            )}

            {/* URLs */}
            {blog.urls && blog.urls.length > 0 && (
              <FieldWithCopy
                title="Reference URLs"
                content={blog.urls
                  .map((urlItem) =>
                    typeof urlItem === "string"
                      ? urlItem
                      : `${urlItem.title || urlItem.url}\n${urlItem.description || ""}\nSource: ${urlItem.origin_site || "N/A"}`,
                  )
                  .join("\n\n")}
                fieldName="urls"
              >
                <div className="space-y-3">
                  {blog.urls.map((urlItem, index) => {
                    if (typeof urlItem === "string") {
                      return (
                        <a
                          key={index}
                          href={urlItem}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {urlItem}
                        </a>
                      )
                    } else if (typeof urlItem === "object" && urlItem.url) {
                      return (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <a
                            href={urlItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                          >
                            {urlItem.title || urlItem.url}
                          </a>
                          {urlItem.description && <p className="text-gray-600 text-sm mt-2">{urlItem.description}</p>}
                          {urlItem.origin_site && (
                            <p className="text-gray-500 text-xs mt-1">Source: {urlItem.origin_site}</p>
                          )}
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              </FieldWithCopy>
            )}

            {/* Generated Content */}
            {blog.content && (
              <FieldWithCopy
                title="Generated Content"
                content={blog.content.replace(/<[^>]*>/g, "")}
                fieldName="content"
              >
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: blog.content }} />
                </div>
              </FieldWithCopy>
            )}

            {/* Final Blog Request Info */}
            {blog.finalBlogRequested && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Final Blog Request</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">Final blog was requested on {formatDate(blog.finalBlogRequestedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminBlogView
