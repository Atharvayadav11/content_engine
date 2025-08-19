"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import toast from "react-hot-toast"
import { Eye, CheckCircle, Clock, User, Calendar, Search, Filter, RefreshCw, LogOut, Edit } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState("")
  const [adminUser, setAdminUser] = useState(null)

  useEffect(() => {
    verifyAdminAuth()
  }, [])

  const verifyAdminAuth = async () => {
    try {
      const token = localStorage.getItem("adminToken")
      const adminData = localStorage.getItem("adminUser")

      if (!token || !adminData) {
        navigate("/admin/login")
        return
      }

      // Verify token with backend
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin-auth/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.success) {
        setAdminUser(JSON.parse(adminData))
        fetchAdminBlogs()
      } else {
        handleLogout()
      }
    } catch (error) {
      console.error("Admin auth verification failed:", error)
      handleLogout()
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    navigate("/admin/login")
  }

  const fetchAdminBlogs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/admin/blogs`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setBlogs(response.data.blogs)
    } catch (error) {
      console.error("Failed to fetch admin blogs:", error)
      if (error.response?.status === 401) {
        handleLogout()
      }
    } finally {
      setLoading(false)
    }
  }

  const updateBlogStatus = async (blogId, newStatus) => {
    setUpdatingStatus(blogId)
    try {
      const token = localStorage.getItem("adminToken")
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/admin/blogs/${blogId}/status`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      // Update local state
      setBlogs((prevBlogs) => prevBlogs.map((blog) => (blog._id === blogId ? { ...blog, status: newStatus } : blog)))

      toast.success(`Blog status updated to ${newStatus}`)
    } catch (error) {
      console.error("Failed to update blog status:", error)
      if (error.response?.status === 401) {
        handleLogout()
      }
      toast.error("Failed to update blog status")
    } finally {
      setUpdatingStatus("")
    }
  }

  const filteredBlogs = blogs.filter((blog) => {
    const matchesStatus = statusFilter === "all" || blog.status === statusFilter
    const userEmail =
      typeof blog.user === "object" && blog.user?.email
        ? blog.user.email
        : typeof blog.userEmail === "string"
          ? blog.userEmail
          : ""
    const matchesSearch =
      blog.topicKeyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

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
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon size={12} className="mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {adminUser?.username} | Manage blog submissions and approvals
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAdminBlogs}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw size={20} className="mr-2" />
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <LogOut size={20} className="mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye size={24} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Blogs</p>
              <p className="text-2xl font-bold text-gray-900">{blogs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock size={24} className="text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {blogs.filter((blog) => blog.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {blogs.filter((blog) => blog.status === "completed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RefreshCw size={24} className="text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">
                {blogs.filter((blog) => blog.status === "processing").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by topic or user email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Blogs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Blog Submissions ({filteredBlogs.length})</h2>
        </div>

        {filteredBlogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No blogs found matching your criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blog Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBlogs.map((blog) => (
                  <tr key={blog._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{blog.topicKeyword}</div>
                        {blog.competitors && blog.competitors.length > 0 && (
                          <div className="text-sm text-gray-500 mt-1">
                            Competitors: {blog.competitors.slice(0, 2).join(", ")}
                            {blog.competitors.length > 2 && ` +${blog.competitors.length - 2} more`}
                          </div>
                        )}
                        {blog.finalBlogRequested && (
                          <div className="text-xs text-orange-600 mt-1 font-medium">Final blog requested</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <User size={16} className="text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm text-gray-900">
                            {typeof blog.user === "object" && blog.user?.email
                              ? blog.user.email
                              : typeof blog.userEmail === "string"
                                ? blog.userEmail
                                : "Unknown User"}
                          </div>
                          <div className="text-xs text-gray-500">ID: {String(blog.createdBy || "N/A")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(blog.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2" />
                        {formatDate(blog.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 flex-wrap gap-1">
                        <button
                          onClick={() => navigate(`/admin/blog/${blog._id}`)}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </button>

                        {blog.status === "draft" && (
                          <>
                            <button
                              onClick={() => updateBlogStatus(blog._id, "processing")}
                              disabled={updatingStatus === blog._id}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm disabled:opacity-50"
                            >
                              {updatingStatus === blog._id ? (
                                <RefreshCw size={14} className="mr-1 animate-spin" />
                              ) : (
                                <RefreshCw size={14} className="mr-1" />
                              )}
                              Process
                            </button>
                            <button
                              onClick={() => updateBlogStatus(blog._id, "pending")}
                              disabled={updatingStatus === blog._id}
                              className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm disabled:opacity-50"
                            >
                              {updatingStatus === blog._id ? (
                                <RefreshCw size={14} className="mr-1 animate-spin" />
                              ) : (
                                <Clock size={14} className="mr-1" />
                              )}
                              Pending
                            </button>
                          </>
                        )}

                        {blog.status === "processing" && (
                          <>
                            <button
                              onClick={() => updateBlogStatus(blog._id, "pending")}
                              disabled={updatingStatus === blog._id}
                              className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm disabled:opacity-50"
                            >
                              {updatingStatus === blog._id ? (
                                <RefreshCw size={14} className="mr-1 animate-spin" />
                              ) : (
                                <Clock size={14} className="mr-1" />
                              )}
                              Pending
                            </button>
                            <button
                              onClick={() => updateBlogStatus(blog._id, "completed")}
                              disabled={updatingStatus === blog._id}
                              className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm disabled:opacity-50"
                            >
                              {updatingStatus === blog._id ? (
                                <RefreshCw size={14} className="mr-1 animate-spin" />
                              ) : (
                                <CheckCircle size={14} className="mr-1" />
                              )}
                              Complete
                            </button>
                          </>
                        )}

                        {blog.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateBlogStatus(blog._id, "processing")}
                              disabled={updatingStatus === blog._id}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm disabled:opacity-50"
                            >
                              {updatingStatus === blog._id ? (
                                <RefreshCw size={14} className="mr-1 animate-spin" />
                              ) : (
                                <RefreshCw size={14} className="mr-1" />
                              )}
                              Process
                            </button>
                            <button
                              onClick={() => updateBlogStatus(blog._id, "completed")}
                              disabled={updatingStatus === blog._id}
                              className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm disabled:opacity-50"
                            >
                              {updatingStatus === blog._id ? (
                                <RefreshCw size={14} className="mr-1 animate-spin" />
                              ) : (
                                <CheckCircle size={14} className="mr-1" />
                              )}
                              Approve
                            </button>
                          </>
                        )}

                        {blog.status === "completed" && (
                          <>
                            <button
                              onClick={() => updateBlogStatus(blog._id, "pending")}
                              disabled={updatingStatus === blog._id}
                              className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm disabled:opacity-50"
                            >
                              {updatingStatus === blog._id ? (
                                <RefreshCw size={14} className="mr-1 animate-spin" />
                              ) : (
                                <Clock size={14} className="mr-1" />
                              )}
                              Revert
                            </button>
                            <button
                              onClick={() => updateBlogStatus(blog._id, "processing")}
                              disabled={updatingStatus === blog._id}
                              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm disabled:opacity-50"
                            >
                              {updatingStatus === blog._id ? (
                                <RefreshCw size={14} className="mr-1 animate-spin" />
                              ) : (
                                <Edit size={14} className="mr-1" />
                              )}
                              Reprocess
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
