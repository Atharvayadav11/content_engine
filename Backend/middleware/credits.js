const User = require('../models/User')

const checkCredits = (operationType, creditsRequired = 1) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id)
      
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }
      
      if (user.credits < creditsRequired) {
        return res.status(402).json({
          message: "🚫 Free credits exhausted! You can only create 2 blogs with free credits. Please upgrade to continue.",
          available: user.credits,
          required: creditsRequired,
          type: "credits_exhausted",
          operation: operationType
        })
      }
      
      req.creditsRequired = creditsRequired
      req.operationType = operationType
      next()
    } catch (error) {
      console.error('❌ Credit check error:', error)
      res.status(500).json({ message: "Credit check failed" })
    }
  }
}

module.exports = checkCredits
