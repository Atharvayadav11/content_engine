const express = require("express")
const Anthropic = require("@anthropic-ai/sdk")
const auth = require("../middleware/auth")

const router = express.Router()

// Initialize Anthropic AI
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Extract Table of Contents using Claude AI
router.post("/extract-toc", auth, async (req, res) => {
  try {
    const { urls } = req.body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ message: "URLs array is required" })
    }

    console.log("📋 Extracting TOC from URLs using Claude AI:", urls.length)

    const prompt = `I have ${urls.length} blog post URLs. Your task is to extract the Table of Contents (TOC) from the first URL that contains it in a clearly structured way.

Check each URL in the given order: 1st, then 2nd, then 3rd.
If you find a clear TOC in the first URL, return it and stop, without checking the others.
If not found, move to the next URL.
Output the TOC as a clean, numbered list.
If no clear TOC is found in any of the URLs, reply: "No clear Table of Contents found in any of the URLs."

Here are the URLs:
${urls.map((url, index) => `${index + 1}. ${url}`).join("\n")}`

    // Generate content using Claude
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const extractedTOC = message.content[0].text

    console.log("✅ TOC extracted successfully using Claude AI")
    console.log("📋 TOC Preview:", extractedTOC.substring(0, 200) + "...")

    res.json({
      message: "TOC extracted successfully using Claude AI",
      tableOfContent: extractedTOC,
      processedUrls: urls.length,
    })
  } catch (error) {
    console.error("❌ TOC Extraction Error:", error)

    // More specific error handling for Anthropic API
    if (error.status === 401) {
      return res.status(401).json({
        message: "Invalid Anthropic API key",
        error: "Please check your ANTHROPIC_API_KEY in environment variables",
      })
    }

    if (error.status === 429) {
      return res.status(429).json({
        message: "Anthropic API rate limit exceeded",
        error: "Please check your API usage limits",
      })
    }

    if (error.status === 400) {
      return res.status(400).json({
        message: "Invalid request to Anthropic API",
        error: error.message,
      })
    }

    // Fallback response if Claude API fails
    res.json({
      message: "TOC extraction completed with fallback",
      tableOfContent: "No clear Table of Contents found in any of the URLs.",
      processedUrls: req.body.urls?.length || 0,
      error: error.message,
    })
  }
})

// Generate background description using Claude AI
router.post("/generate-description", auth, async (req, res) => {
  try {
    const { topicKeyword, tableOfContent } = req.body

    if (!topicKeyword || !tableOfContent) {
      return res.status(400).json({ message: "Topic keyword and table of content are required" })
    }

    console.log("✨ Generating background description for:", topicKeyword)

    const prompt = `I want to get this outline written by AI on given topic keyword, so give me a 2-3 line explanation of this outline.

Topic Keyword: ${topicKeyword}

Outline:
${tableOfContent}

Please provide a concise 2-3 line explanation of this outline.`

    // Generate content using Claude
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const generatedDescription = message.content[0].text

    console.log("✅ Background description generated using Claude AI")
    console.log("📝 Description:", generatedDescription)

    res.json({
      message: "Background description generated successfully using Claude AI",
      backgroundDescription: generatedDescription,
    })
  } catch (error) {
    console.error("❌ Description Generation Error:", error)

    // More specific error handling for Anthropic API
    if (error.status === 401) {
      return res.status(401).json({
        message: "Invalid Anthropic API key",
        error: "Please check your ANTHROPIC_API_KEY in environment variables",
      })
    }

    if (error.status === 429) {
      return res.status(429).json({
        message: "Anthropic API rate limit exceeded",
        error: "Please check your API usage limits",
      })
    }

    if (error.status === 400) {
      return res.status(400).json({
        message: "Invalid request to Anthropic API",
        error: error.message,
      })
    }

    // Fallback response
    const fallbackDescription = `This comprehensive outline for "${req.body.topicKeyword}" provides a structured approach to understanding the key concepts and strategies. The content is designed to offer practical insights and actionable information for readers interested in this topic.`

    res.json({
      message: "Background description generated with fallback",
      backgroundDescription: fallbackDescription,
      error: error.message,
    })
  }
})

// Test Claude AI connection
router.get("/test-claude", auth, async (req, res) => {
  try {
    console.log("🧪 Testing Claude AI connection...")

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: "Hello, this is a test. Please respond with 'Claude AI is working!'",
        },
      ],
    })

    const response = message.content[0].text

    console.log("✅ Claude AI test successful:", response)

    res.json({
      message: "Claude AI connection successful",
      response: response,
      model: "claude-3-5-sonnet-20241022",
    })
  } catch (error) {
    console.error("❌ Claude AI test failed:", error)

    res.status(500).json({
      message: "Claude AI connection failed",
      error: error.message,
      status: error.status || 500,
      details: error.toString(),
    })
  }
})

module.exports = router
