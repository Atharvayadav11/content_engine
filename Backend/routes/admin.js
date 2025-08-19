const express = require("express")
const multer = require("multer")
const router = express.Router()
const Blog = require("../models/Blog")
const User = require("../models/User")
const adminAuth = require("../middleware/adminAuth")
const emailService = require("../services/emailService")

// Configure multer for PDF upload (memory storage since we won't save the file)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed!'), false)
    }
  }
})

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

// Send blog PDF via email
router.post("/send-blog-pdf/:blogId", adminAuth, upload.single('pdf'), async (req, res) => {
  try {
    const { blogId } = req.params
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required"
      })
    }

    // Get blog details
    const blog = await Blog.findById(blogId).populate("createdBy", "email")
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found"
      })
    }

    if (!blog.createdBy || !blog.createdBy.email) {
      return res.status(400).json({
        success: false,
        message: "Blog creator email not found"
      })
    }

    console.log('📧 Preparing to send PDF for blog:', {
      blogId: blog._id,
      topicKeyword: blog.topicKeyword,
      userEmail: blog.createdBy.email,
      fileName: req.file.originalname,
      fileSize: req.file.size
    })

    // Send email with PDF attachment
    const emailResult = await emailService.sendBlogPDF(
      blog.createdBy.email,
      blog.topicKeyword,
      req.file.buffer,
      req.file.originalname || `${blog.topicKeyword.replace(/\s+/g, '_')}_Blog.pdf`
    )

    // Update blog status to completed
    blog.status = "completed"
    blog.finalBlogRequested = true
    blog.finalBlogRequestedAt = new Date()
    await blog.save()

    console.log('✅ Blog PDF sent successfully to:', blog.createdBy.email)

    res.json({
      success: true,
      message: `Blog PDF sent successfully to ${blog.createdBy.email}`,
      emailResult: {
        messageId: emailResult.messageId,
        recipient: emailResult.recipient
      },
      blog: {
        ...blog.toObject(),
        userEmail: blog.createdBy.email
      }
    })

  } catch (error) {
    console.error('❌ Send blog PDF error:', error)
    
    // Handle specific multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum 10MB allowed."
      })
    }
    
    if (error.message === 'Only PDF files are allowed!') {
      return res.status(400).json({
        success: false,
        message: "Only PDF files are allowed."
      })
    }

    res.status(500).json({
      success: false,
      message: "Failed to send blog PDF",
      error: error.message
    })
  }
})

// Test email configuration
router.post("/test-email", adminAuth, async (req, res) => {
  try {
    const { testEmail } = req.body
    
    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: "Test email address is required"
      })
    }

    const result = await emailService.sendTestEmail(testEmail)
    
    res.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      messageId: result.messageId
    })
  } catch (error) {
    console.error('❌ Test email error:', error)
    res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error.message
    })
  }
})

module.exports = router
