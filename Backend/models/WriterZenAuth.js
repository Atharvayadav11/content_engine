const mongoose = require("mongoose")

const WriterZenAuthSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    cookie: {
      type: String,
      default: "",
    },
    xsrfToken: {
      type: String,
      default: "",
    },
    isValid: {
      type: Boolean,
      default: false,
    },
    lastValidated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("WriterZenAuth", WriterZenAuthSchema)
