const jwt = require("jsonwebtoken")

const adminAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded.isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin privileges required.",
      })
    }

    req.admin = decoded
    next()
  } catch (error) {
    console.error("Admin auth middleware error:", error)
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    })
  }
}

module.exports = adminAuth
