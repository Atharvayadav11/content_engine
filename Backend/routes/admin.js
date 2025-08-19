const express = require("express")
const router = express.Router()
const Blog = require("../models/Blog")
const User = require("../models/User")
const adminAuth = require("../middleware/adminAuth")

// Get all blogs for admin dashboard with user email
router.get("/blogs", adminAuth, async (req, res) => {
  try {
    const blogs = await Blog.find().populate("createdBy", "email").sort({ createdAt: -1 }).lean()

    // Add user email to each blog
    const blogsWithUserEmail = blogs.map((blog) => ({
      ...blog,
      userEmail: blog.createdBy?.email || "Unknown",
    }))

    res.json({
      success: true,
      blogs: blogsWithUserEmail,
    })
  } catch (error) {
    console.error("❌ Admin blogs fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin blogs",
      error: error.message,
    })
  }
})

// Update blog status
router.put("/blogs/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validate status
    const validStatuses = ["draft", "processing", "pending", "completed"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", "),
      })
    }

    const blog = await Blog.findById(id)
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      })
    }

    // Update blog status
    blog.status = status
    await blog.save()

    // Populate user email for response
    await blog.populate("createdBy", "email")

    res.json({
      success: true,
      message: `Blog status updated to ${status}`,
      blog: {
        ...blog.toObject(),
        userEmail: blog.createdBy?.email || "Unknown",
      },
    })
  } catch (error) {
    console.error("❌ Admin status update error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update blog status",
      error: error.message,
    })
  }
})

// Get admin dashboard stats
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalBlogs = await Blog.countDocuments()
    const pendingBlogs = await Blog.countDocuments({ status: "pending" })
    const completedBlogs = await Blog.countDocuments({ status: "completed" })
    const processingBlogs = await Blog.countDocuments({ status: "processing" })
    const draftBlogs = await Blog.countDocuments({ status: "draft" })

    res.json({
      success: true,
      stats: {
        total: totalBlogs,
        pending: pendingBlogs,
        completed: completedBlogs,
        processing: processingBlogs,
        draft: draftBlogs,
      },
    })
  } catch (error) {
    console.error("❌ Admin stats error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch admin stats",
      error: error.message,
    })
  }
})

router.get("/blogs/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params

    const blog = await Blog.findById(id).populate("createdBy", "email username").lean()

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      })
    }

    // Add user email to blog object
    const blogWithUserEmail = {
      ...blog,
      userEmail: blog.createdBy?.email || "Unknown",
    }

    res.json({
      success: true,
      blog: blogWithUserEmail,
    })
  } catch (error) {
    console.error("❌ Admin blog fetch error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error: error.message,
    })
  }
})

router.post("/final-blog-requests", adminAuth, async (req, res) => {
  try {
    const { blogId, userEmail, topicKeyword } = req.body

    // Update blog status to indicate it's been requested for final processing
    const blog = await Blog.findByIdAndUpdate(
      blogId,
      {
        status: "pending",
        finalBlogRequested: true,
        finalBlogRequestedAt: new Date(),
      },
      { new: true },
    ).populate("createdBy", "email username")

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      })
    }

    console.log("📧 Final blog request received:", {
      blogId,
      userEmail,
      topicKeyword,
      requestedAt: new Date().toISOString(),
    })

    res.json({
      success: true,
      message: "Final blog request received successfully",
      blog: {
        ...blog.toObject(),
        userEmail: blog.createdBy?.email || userEmail,
      },
    })
  } catch (error) {
    console.error("❌ Final blog request error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to process final blog request",
      error: error.message,
    })
  }
})

module.exports = router
