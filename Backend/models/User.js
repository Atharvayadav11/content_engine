const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    credits: {
      type: Number,
      default: 2, // 2 free credits for new users
    },
    totalCreditsUsed: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("User", UserSchema)
