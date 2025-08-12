const User = require('../models/User')
const CreditTransaction = require('../models/CreditTransaction')

class CreditService {
  static async deductCredits(userId, operation, creditsUsed, blogId = null) {
    try {
      // Deduct credits from user
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          $inc: { 
            credits: -creditsUsed,
            totalCreditsUsed: creditsUsed 
          }
        },
        { new: true }
      )
      
      if (!user) {
        throw new Error('User not found')
      }
      
      // Log the transaction
      await new CreditTransaction({
        userId,
        operation,
        creditsUsed,
        blogId,
        status: 'completed'
      }).save()
      
      console.log(`✅ Deducted ${creditsUsed} credits for ${operation}. Remaining: ${user.credits}`)
      return user
    } catch (error) {
      console.error('❌ Credit deduction failed:', error)
      throw error
    }
  }

  static async addCredits(userId, operation, creditsAdded, details = '') {
    try {
      // Add credits to user
      const user = await User.findByIdAndUpdate(
        userId,
        { 
          $inc: { 
            credits: creditsAdded
          }
        },
        { new: true }
      )
      
      if (!user) {
        throw new Error('User not found')
      }
      
      // Log the transaction
      await new CreditTransaction({
        userId,
        operation,
        creditsUsed: -creditsAdded, // Negative for credit addition
        status: 'completed',
        details
      }).save()
      
      console.log(`✅ Added ${creditsAdded} credits for ${operation}. Total: ${user.credits}`)
      return user
    } catch (error) {
      console.error('❌ Credit addition failed:', error)
      throw error
    }
  }

  static async getUserCredits(userId) {
    try {
      const user = await User.findById(userId).select('credits totalCreditsUsed')
      return user
    } catch (error) {
      console.error('❌ Failed to get user credits:', error)
      throw error
    }
  }

  static async getUserTransactions(userId, limit = 10) {
    try {
      const transactions = await CreditTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('blogId', 'topicKeyword')
      
      return transactions
    } catch (error) {
      console.error('❌ Failed to get user transactions:', error)
      throw error
    }
  }
}

module.exports = CreditService
