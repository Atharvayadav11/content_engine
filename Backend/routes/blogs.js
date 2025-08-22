const express = require("express")
const Blog = require("../models/Blog")
const auth = require("../middleware/auth")
const checkCredits = require("../middleware/credits")
const CreditService = require("../services/creditService")

const router = express.Router()

// Create new blog
router.post("/", auth, checkCredits("blog_creation", 1), async (req, res) => {
  try {
    const { topicKeyword, competitors, persona, additionalInfo, urls } = req.body

    console.log("📝 Creating new blog:", {
      topicKeyword,
      competitorsCount: competitors?.length || 0,
      hasPersona: !!persona,
      hasAdditionalInfo: !!additionalInfo,
      urlsCount: urls?.length || 0,
    })

    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return res.status(400).json({ message: "At least one competitor is required" })
    }

    const blog = new Blog({
      topicKeyword,
      competitors: competitors || [],
      persona: persona || "",
      additionalInfo: additionalInfo || "",
      urls: urls || [],
      createdBy: req.user._id,
    })

    await blog.save()

    // Deduct credit after successful blog creation
    await CreditService.deductCredits(req.user._id, "blog_creation", 1, blog._id)

    console.log("✅ Blog created successfully:", blog._id)
    console.log("🏢 Competitors saved:", competitors)

    res.status(201).json({
      message: "Blog created successfully - 1 credit used",
      blog,
      creditsUsed: 1,
    })
  } catch (error) {
    console.error("❌ Create Blog Error:", error)
    res.status(500).json({ message: "Error creating blog" })
  }
})

// Get all blogs
router.get("/", auth, async (req, res) => {
  try {
    const blogs = await Blog.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 })
      .populate("createdBy", "username email")

    console.log("📚 Retrieved blogs count:", blogs.length)

    res.json({
      blogs,
      count: blogs.length,
    })
  } catch (error) {
    console.error("❌ Get Blogs Error:", error)
    res.status(500).json({ message: "Error fetching blogs" })
  }
})

// Get previous competitors
router.get("/previous-competitors", auth, async (req, res) => {
  try {
    const blogs = await Blog.find({
      createdBy: req.user._id,
      competitors: { $exists: true, $not: { $size: 0 } },
    })
      .sort({ createdAt: -1 })
      .select("competitors")
      .limit(10) // Get last 10 blogs with competitors

    // Extract unique competitors from all blogs
    const allCompetitors = blogs.reduce((acc, blog) => {
      if (blog.competitors && Array.isArray(blog.competitors)) {
        acc.push(...blog.competitors)
      }
      return acc
    }, [])

    // Remove duplicates and filter out empty strings
    const uniqueCompetitors = [...new Set(allCompetitors)]
      .filter((competitor) => competitor && competitor.trim().length > 0)
      .slice(0, 20) // Limit to 20 most recent unique competitors

    console.log("🏢 Retrieved previous competitors:", uniqueCompetitors.length)

    res.json({
      competitors: uniqueCompetitors,
      count: uniqueCompetitors.length,
    })
  } catch (error) {
    console.error("❌ Get Previous Competitors Error:", error)
    res.status(500).json({ message: "Error fetching previous competitors" })
  }
})

// Get single blog
router.get("/:id", auth, async (req, res) => {
  try {
    const blog = await Blog.findOne({
      _id: req.params.id,
      createdBy: req.user._id,
    }).populate("createdBy", "username email")

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" })
    }

    console.log("📖 Retrieved blog:", blog.topicKeyword)

    res.json({ blog })
  } catch (error) {
    console.error("❌ Get Blog Error:", error)
    res.status(500).json({ message: "Error fetching blog" })
  }
})

// Update blog
router.put("/:id", auth, async (req, res) => {
  try {
    const updates = req.body

    console.log("📝 Updating blog:", req.params.id, Object.keys(updates))

    const blog = await Blog.findOneAndUpdate({ _id: req.params.id, createdBy: req.user._id }, updates, {
      new: true,
      runValidators: true,
    })

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" })
    }

    console.log("✅ Blog updated successfully")

    res.json({
      message: "Blog updated successfully",
      blog,
    })
  } catch (error) {
    console.error("❌ Update Blog Error:", error)
    res.status(500).json({ message: "Error updating blog" })
  }
})

// Delete blog
router.delete("/:id", auth, async (req, res) => {
  try {
    const blog = await Blog.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id,
    })

    if (!blog) {
      return res.status(404).json({ message: "Blog not found" })
    }

    console.log("🗑️ Blog deleted:", blog.topicKeyword)

    res.json({ message: "Blog deleted successfully" })
  } catch (error) {
    console.error("❌ Delete Blog Error:", error)
    res.status(500).json({ message: "Error deleting blog" })
  }
})

// Request final blog processing
router.post("/:id/request-final", auth, async (req, res) => {
  try {
    const { userEmail, topicKeyword } = req.body
    const blogId = req.params.id

    // Verify blog belongs to user
    const blog = await Blog.findOne({
      _id: blogId,
      createdBy: req.user._id,
    })

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      })
    }

    // Update blog status to indicate it's been requested for final processing
    blog.status = "pending"
    blog.finalBlogRequested = true
    blog.finalBlogRequestedAt = new Date()
    await blog.save()

    console.log("📧 Final blog request received:", {
      blogId,
      userEmail,
      topicKeyword,
      userId: req.user._id,
      requestedAt: new Date().toISOString(),
    })

    res.json({
      success: true,
      message: "Final blog request submitted successfully",
      blog: {
        ...blog.toObject(),
        userEmail: userEmail,
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
