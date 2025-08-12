const { clerkClient } = require('@clerk/clerk-sdk-node')
const User = require('../models/User')

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.header('x-auth-token')
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' })
    }

    // Verify token with Clerk
    const session = await clerkClient.verifyToken(token)
    
    // Find or create user in our database
    let user = await User.findOne({ clerkId: session.sub })
    
    if (!user) {
      // Get user info from Clerk
      const clerkUser = await clerkClient.users.getUser(session.sub)
      
      user = new User({
        clerkId: session.sub,
        email: clerkUser.emailAddresses[0].emailAddress,
        username: clerkUser.username || clerkUser.firstName || 'User',
        credits: 2 // Free credits for new users
      })
      await user.save()
      console.log('✅ New user created with 2 free credits:', user.email, 'Credits:', user.credits)
    } else {
      console.log('🔄 Existing user found:', user.email, 'Credits:', user.credits)
    }

    req.user = user
    next()
  } catch (error) {
    console.error('❌ Auth error:', error)
    res.status(401).json({ message: 'Invalid token' })
  }
}

module.exports = auth
