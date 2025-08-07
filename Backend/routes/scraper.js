const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");

const router = express.Router();

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
];

router.post("/scrape", auth, async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    console.log("🔍 Starting scrape for query:", query);

    const allResults = [];
    let start = 0;

    // Loop to fetch 3 pages (10 results per page = 30 total)
    while (allResults.length < 30 && start <= 20) {
      const response = await axios.get("https://serpapi.abcproxy.com/search", {
        params: {
          engine: "google",
          q: query,
          api_key: process.env.SERPAPI_KEY,
          fetch_mode: "static",
          start, // pagination
        },
      });

      const organicResults = response.data?.data?.organic_results || [];

      if (!organicResults.length) break;

      allResults.push(...organicResults);
      start += 10;
    }

    console.log("🔍 Total Organic Results Fetched:", allResults.length);

    const competitorResults = [];
    const fallbackResults = [];

    allResults.slice(0, 30).forEach((item) => {
      const domain = (item.origin_site || item.url || "").toLowerCase();
      const matchedCompetitor = competitors.find((comp) =>
        domain.includes(comp.toLowerCase())
      );

      const result = {
        title: item.title || "",
        url: item.url || "",
        description: item.description || "",
        origin_site: item.origin_site || "",
        source: matchedCompetitor ? matchedCompetitor.toUpperCase() : "GENERAL",
      };

      if (matchedCompetitor) {
        competitorResults.push(result);
      } else {
        fallbackResults.push(result);
      }
    });

    const finalResults = [...competitorResults, ...fallbackResults].slice(0, 30);

    console.log("✅ Final Results Prepared:", finalResults.length);

    res.json({
      message: "Scraping completed successfully",
      results: finalResults,
      query,
      totalResults: finalResults.length,
    });
  } catch (error) {
    console.error("❌ Scraping Error:", error.response?.data || error.message);
    res.status(500).json({
      message: "Error during scraping",
      error: error.message,
    });
  }
});

module.exports = router;
