const express = require("express")
const Blog = require("../models/Blog")
const auth = require("../middleware/auth")

const router = express.Router()

// Create new blog
router.post("/", auth, async (req, res) => {
  try {
    const { topicKeyword, urls } = req.body

    console.log("📝 Creating new blog:", { topicKeyword, urlsCount: urls?.length })

    const blog = new Blog({
      topicKeyword,
      urls: urls || [],
      createdBy: req.user._id,
    })

    await blog.save()

    console.log("✅ Blog created successfully:", blog._id)

    res.status(201).json({
      message: "Blog created successfully",
      blog,
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

module.exports = router
