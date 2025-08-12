const express = require("express")
const User = require("../models/User")
const auth = require("../middleware/auth")
const CreditService = require("../services/creditService")

const router = express.Router()

// Register Admin
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body

    console.log("📝 Registration attempt:", { username, email })

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email or username",
      })
    }

    // Create user
    const user = new User({
      username,
      email,
      password,
      role: "admin",
    })

    await user.save()

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" })

    console.log("✅ User registered successfully:", user.username)

    res.status(201).json({
      message: "Admin registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("❌ Registration Error:", error)
    res.status(500).json({ message: "Server error during registration" })
  }
})

// Login Admin
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    console.log("🔐 Login attempt:", email)

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" })

    console.log("✅ Login successful:", user.username)

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("❌ Login Error:", error)
    res.status(500).json({ message: "Server error during login" })
  }
})

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v')
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    
    // Get recent transactions
    const recentTransactions = await CreditService.getUserTransactions(req.user._id, 5)
    
    res.json({
      user: {
        id: user._id,
        clerkId: user.clerkId,
        username: user.username,
        email: user.email,
        role: user.role,
        credits: user.credits,
        totalCreditsUsed: user.totalCreditsUsed,
        recentTransactions
      },
    })
  } catch (error) {
    console.error("❌ Get User Error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get user credit information
router.get("/credits", auth, async (req, res) => {
  try {
    const user = await CreditService.getUserCredits(req.user._id)
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    
    const transactions = await CreditService.getUserTransactions(req.user._id, 10)
    
    res.json({
      credits: user.credits,
      totalCreditsUsed: user.totalCreditsUsed,
      transactions
    })
  } catch (error) {
    console.error("❌ Get Credits Error:", error)
    res.status(500).json({ message: "Error fetching credit information" })
  }
})

module.exports = router
