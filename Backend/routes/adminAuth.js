const express = require("express")
const jwt = require("jsonwebtoken")
const router = express.Router()

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    // Check admin credentials from environment variables
    const adminUsername = process.env.ADMIN_USERNAME
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminUsername || !adminPassword) {
      return res.status(500).json({
        success: false,
        message: "Admin credentials not configured",
      })
    }

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        isAdmin: true,
        username: adminUsername,
        loginTime: new Date().toISOString(),
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    )

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: {
        username: adminUsername,
        isAdmin: true,
      },
    })
  } catch (error) {
    console.error("Admin login error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during admin login",
    })
  }
})

router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Admin logged out successfully",
  })
})

router.get("/verify", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Not authorized as admin",
      })
    }

    res.json({
      success: true,
      admin: {
        username: decoded.username,
        isAdmin: true,
      },
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    })
  }
})

module.exports = router
