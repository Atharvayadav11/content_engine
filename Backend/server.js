const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const dotenv = require("dotenv")

// Load environment variables
dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin:"https://advance-blog-engine-automated.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  }),
)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/blog-engine", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err))

// Validate required environment variables
const requiredEnvVars = ["ANTHROPIC_API_KEY", "JWT_SECRET"]
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars.join(", "))
  console.error("Please check your .env file")
} else {
  console.log("✅ All required environment variables are set")
}

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/scraper", require("./routes/scraper"))
app.use("/api/blogs", require("./routes/blogs"))
app.use("/api/writerzen", require("./routes/writerzen"))
app.use("/api/ai", require("./routes/ai"))

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    message: "Blog Engine API is running!",
    timestamp: new Date().toISOString(),
    claudeConfigured: !!process.env.ANTHROPIC_API_KEY,
    mongoConnected: mongoose.connection.readyState === 1,
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack)
  res.status(500).json({ message: "Something went wrong!", error: err.message })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`)
  console.log(`🤖 Claude AI: ${process.env.ANTHROPIC_API_KEY ? "Configured" : "Not configured"}`)
})
