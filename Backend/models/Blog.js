const mongoose = require("mongoose")

const BlogSchema = new mongoose.Schema(
  {
    topicKeyword: {
      type: String,
      required: true,
      trim: true,
    },
    competitors: [
      {
        type: String,
        trim: true,
      },
    ],
    persona: {
      type: String,
      trim: true,
      default: "",
    },
    additionalInfo: {
      type: String,
      trim: true,
      default: "",
    },
    urls: [
      {
        title: String,
        url: String,
        description: String,
        origin_site: String,
        source: String,
      },
    ],
    tableOfContent: {
      type: String,
      default: "",
    },
    relatedKeywords: [
      {
        keyword: String,
        searchVolume: Number,
        selected: {
          type: Boolean,
          default: false,
        },
      },
    ],
    keywordsToInclude: [
      {
        text: String,
        searchVolume: Number,
        repeat: Number,
        density: Number,
        selected: {
          type: Boolean,
          default: false,
        },
      },
    ],
    backgroundDescription: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "processing", "completed"],
      default: "draft",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Blog", BlogSchema)
