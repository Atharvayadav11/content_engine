const express = require("express")
const axios = require("axios")
const auth = require("../middleware/auth")

const router = express.Router()

// Competitors list
const competitors = [
  "growmeorganic",
  "uplead",
  "saleshandy",
  "zendesk",
  "salesforce",
  "wiza",
  "zoominfo",
  "snov",
  "woodpecker",
]

// Scrape competitor blogs
router.post("/scrape", auth, async (req, res) => {
  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({ message: "Query is required" })
    }

    console.log("🔍 Starting scrape for query:", query)

    const response = await axios.get("https://serpapi.abcproxy.com/search", {
      params: {
        engine: "google",
        q: query,
        api_key: process.env.SERPAPI_KEY,
        fetch_mode: "static",
      },
    })

    const data = response.data.data
    console.log("📊 RAW DATA RECEIVED")

    const organicResults = response.data?.data?.organic_results || []
    console.log("🔍 ORGANIC RESULTS COUNT:", organicResults.length)

    if (!organicResults.length) {
      console.log("⚠ No organic search results found.")
      return res.status(404).json({ message: "No search results found" })
    }

    const competitorResults = []
    const fallbackResults = []

    organicResults.forEach((item) => {
      const domain = (item.origin_site || item.url || "").toLowerCase()
      const matchedCompetitor = competitors.find((comp) => domain.includes(comp.toLowerCase()))

      const result = {
        title: item.title || "",
        url: item.url || "",
        description: item.description || "",
        origin_site: item.origin_site || "",
        source: matchedCompetitor ? matchedCompetitor.toUpperCase() : "GENERAL",
      }

      if (matchedCompetitor) {
        competitorResults.push(result)
      } else {
        fallbackResults.push(result)
      }
    })

    const finalResults = [...competitorResults, ...fallbackResults]

    console.log("✅ Scraping completed. Results found:", finalResults.length)
    finalResults.forEach((r, i) => {
      console.log(`${i + 1}. [${r.source}] ${r.title}`)
      console.log(`   URL: ${r.url}`)
      console.log(`   Origin: ${r.origin_site}`)
      console.log("-----")
    })

    res.json({
      message: "Scraping completed successfully",
      results: finalResults,
      query: query,
      totalResults: finalResults.length,
    })
  } catch (error) {
    console.error("❌ Scraping Error:", error.response?.data || error.message)
    res.status(500).json({
      message: "Error during scraping",
      error: error.message,
    })
  }
})

module.exports = router
