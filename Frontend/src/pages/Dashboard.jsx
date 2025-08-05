"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Plus, Eye, Trash2, Calendar, User } from "lucide-react"
import LoadingSpinner from "../components/LoadingSpinner"
import toast from "react-hot-toast"

const Dashboard = () => {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBlogs()
  }, [])

  const fetchBlogs = async () => {
    try {
      const response = await axios.get("/blogs")
      setBlogs(response.data.blogs)
      console.log("📚 Blogs loaded:", response.data.count)
    } catch (error) {
      console.error("❌ Error fetching blogs:", error)
      toast.error("Failed to load blogs")
    } finally {
      setLoading(false)
    }
  }

  const deleteBlog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog?")) {
      return
    }

    try {
      await axios.delete(`/blogs/${id}`)
      setBlogs(blogs.filter((blog) => blog._id !== id))
      toast.success("Blog deleted successfully")
      console.log("🗑️ Blog deleted:", id)
    } catch (error) {
      console.error("❌ Error deleting blog:", error)
      toast.error("Failed to delete blog")
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your blog automation projects</p>
        </div>
        <Link
          to="/blog/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Create New Blog
        </Link>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No blogs yet</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first blog automation project</p>
            <Link
              to="/blog/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Create Your First Blog
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {blogs.map((blog) => (
            <div key={blog._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{blog.topicKeyword}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(blog.status)}`}>
                  {blog.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <Calendar size={16} className="mr-2" />
                  <span>Created {formatDate(blog.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <User size={16} className="mr-2" />
                  <span>URLs: {blog.urls?.length || 0}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Link
                  to={`/blog/${blog._id}`}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  <Eye size={16} className="mr-1" />
                  View Details
                </Link>
                <button
                  onClick={() => deleteBlog(blog._id)}
                  className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm"
                >
                  <Trash2 size={16} className="mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard
