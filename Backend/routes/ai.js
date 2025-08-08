const express = require("express")
const Anthropic = require("@anthropic-ai/sdk")
const axios = require("axios")
const cheerio = require("cheerio")
const auth = require("../middleware/auth")

const router = express.Router()

// Initialize Anthropic AI
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// HTML scraping fallback function
async function scrapeOutlineFallback(url) {
  console.log("🟡 Using fallback web scraping for:", url)
  
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000 // 10 second timeout
    })
    
    const html = response.data
    const $ = cheerio.load(html)
    let outline = []
    
    // Extract headings H1-H6
    $("h1, h2, h3, h4, h5, h6").each((i, el) => {
      const tag = $(el).prop("tagName")
      const text = $(el).text().trim()
      if (text && text.length > 2 && text.length < 200) { // Filter out very short or very long headings
        outline.push(`${tag}: ${text}`)
      }
    })
    
    if (outline.length === 0) {
      console.log("❌ No headings found in HTML scraping")
      return "NO_OUTLINE_FOUND"
    }
    
    console.log(`✅ Found ${outline.length} headings via HTML scraping`)
    return outline.join("\n")
    
  } catch (error) {
    console.error("❌ HTML scraping failed:", error.message)
    return "NO_OUTLINE_FOUND"
  }
}

// Clean up fallback outline with Claude
async function cleanOutlineWithAI(rawOutline, url) {
  console.log("🔵 Cleaning fallback outline with Claude...")
  
  try {
    const prompt = `You are a cleanup assistant. Take the following raw scraped outline from a webpage and:

- Keep ONLY meaningful headings that form a proper table of contents
- Organize them in proper hierarchy (H1 → H2 → H3, etc.) but don't write heading name means dont show heading Tags. 
- Remove any irrelevant text, ads, navigation items, or footer content
- Remove duplicate or similar headings
- Convert to a clean, numbered outline format
- Focus on content-related headings only
-Remove any thing which is not related to blog and related to advertise and website related things
- Output MUST start with ###OUTLINE_START### and end with ###OUTLINE_END###

URL: ${url}

Raw Scraped Outline:
${rawOutline}

Please provide a clean, structured table of contents:`

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

    const cleanedOutline = message.content[0].text
    console.log("✅ Claude cleaned the fallback outline")
    return cleanedOutline
    
  } catch (error) {
    console.error("❌ Claude cleanup failed:", error.message)
    return rawOutline // Return raw outline if Claude cleanup fails
  }
}

// Get outline from AI (original Claude method)
async function getOutlineFromAI(urls) {
  console.log("🔵 Attempting Claude AI direct extraction...")
  
  const prompt = `I have ${urls.length} blog post URLs.Please use the web_fetch tool to access the URL Your task is to extract the Table of Contents (TOC) from the first URL that contains it in a clearly structured way.

Check each URL in the given order: 1st, then 2nd, then 3rd.
If you find a clear TOC in the first URL, return it and stop, without checking the others and in result only provide TOC and url from which you have extracted dont provide unnecessory message only TOC.
If not found, move to the next URL.

IMPORTANT: If you successfully extract a TOC, format your response as:
###OUTLINE_START###
[Your extracted TOC here]
###OUTLINE_END###

If no clear TOC is found in any of the URLs, respond with exactly: "NO_OUTLINE_FOUND"

Here are the URLs:
${urls.map((url, index) => `${index + 1}. ${url}`).join("\n")}`

  try {
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

    const result = message.content[0].text
    console.log("✅ Claude AI direct extraction completed")
    return result
    
  } catch (error) {
    console.error("❌ Claude AI direct extraction failed:", error.message)
    return "NO_OUTLINE_FOUND"
  }
}

// Main hybrid function for TOC extraction
async function getHybridOutline(urls) {
  console.log("🚀 Starting hybrid TOC extraction for", urls.length, "URLs")
  
  // Step 1: Try Claude AI direct extraction
  let aiResult = await getOutlineFromAI(urls)
  
  // Check if Claude found a proper outline
  if (
    aiResult.startsWith("###OUTLINE_START###") &&
    aiResult.endsWith("###OUTLINE_END###")
  ) {
    console.log("✅ Using Claude direct output")
    return aiResult.replace("###OUTLINE_START###", "")
                   .replace("###OUTLINE_END###", "")
                   .trim()
  }
  
  // Step 2: Claude failed, try fallback scraping for each URL
  if (aiResult.includes("NO_OUTLINE_FOUND") || !aiResult.includes("###OUTLINE_START###")) {
    console.log("🟡 Claude failed, trying HTML scraping fallback...")
    
    for (const url of urls) {
      console.log("🔍 Trying fallback scraping for:", url)
      
      const fallbackResult = await scrapeOutlineFallback(url)
      
      if (fallbackResult !== "NO_OUTLINE_FOUND") {
        console.log("✅ Fallback scraping successful, cleaning with Claude...")
        
        // Step 3: Clean the scraped outline with Claude
        const cleaned = await cleanOutlineWithAI(fallbackResult, url)
        
        if (
          cleaned.startsWith("###OUTLINE_START###") &&
          cleaned.endsWith("###OUTLINE_END###")
        ) {
          console.log("✅ Using cleaned fallback AI output")
          return cleaned.replace("###OUTLINE_START###", "")
                        .replace("###OUTLINE_END###", "")
                        .trim()
        }
        
        // If Claude cleanup failed, use raw fallback but format it nicely
        console.log("⚠️ Using formatted raw fallback output")
        const lines = fallbackResult.split('\n')
        const formattedOutline = lines
          .map((line, index) => `${index + 1}. ${line.replace(/^H[1-6]:\s*/, '')}`)
          .join('\n')
        
        return formattedOutline
      }
    }
    
    console.log("❌ No outline found even with fallback scraping")
    return "No clear Table of Contents found in any of the URLs."
  }
  
  console.log("⚠️ Unexpected Claude output, trying fallback...")
  
  // Fallback for unexpected Claude output
  for (const url of urls) {
    const fallbackResult = await scrapeOutlineFallback(url)
    if (fallbackResult !== "NO_OUTLINE_FOUND") {
      const cleaned = await cleanOutlineWithAI(fallbackResult, url)
      if (cleaned.startsWith("###OUTLINE_START###")) {
        return cleaned.replace("###OUTLINE_START###", "")
                      .replace("###OUTLINE_END###", "")
                      .trim()
      }
      return fallbackResult
    }
  }
  
  return "No clear Table of Contents found in any of the URLs."
}

// Extract Table of Contents using Claude AI with fallback
router.post("/extract-toc", auth, async (req, res) => {
  try {
    const { urls } = req.body

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ message: "URLs array is required" })
    }

    console.log("📋 Starting hybrid TOC extraction from URLs:", urls.length)

    // Use hybrid extraction method
    const extractedTOC = await getHybridOutline(urls)

    console.log("✅ TOC extraction completed")
    console.log("📋 TOC Preview:", extractedTOC.substring(0, 200) + "...")

    res.json({
      message: "TOC extracted successfully using hybrid approach (Claude AI + Fallback)",
      tableOfContent: extractedTOC,
      processedUrls: urls.length,
      method: extractedTOC.includes("No clear Table of Contents") ? "failed" : "hybrid"
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

    // Fallback response if everything fails
    res.json({
      message: "TOC extraction completed with basic fallback",
      tableOfContent: "Unable to extract a clear Table of Contents from the provided URLs. Please try with different URLs or check if the pages contain structured content.",
      processedUrls: req.body.urls?.length || 0,
      error: error.message,
      method: "fallback"
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
