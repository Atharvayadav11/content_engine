const mongoose = require("mongoose")

const CreditTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  operation: {
    type: String,
    enum: ["blog_creation", "toc_extraction", "keyword_research", "description_generation", "keywords_to_include", "admin_credit_addition", "admin_credit_deduction"],
    required: true,
  },
  creditsUsed: {
    type: Number,
    required: true,
    default: 1,
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Blog",
  },
  status: {
    type: String,
    enum: ["completed", "failed"],
    default: "completed",
  },
  details: {
    type: String,
    default: "",
  }
}, { timestamps: true })

module.exports = mongoose.model("CreditTransaction", CreditTransactionSchema)
