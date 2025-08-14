const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");
const WriterZenAuth = require("../models/WriterZenAuth");
const checkCredits = require("../middleware/credits");
const CreditService = require("../services/creditService");

const router = express.Router();

// 🔹 Place your WriterZen cookie & token here
const FIXED_COOKIE = "lantern=c5cf93bf-0fed-44bf-b87d-d90088c3dfee; _fbp=fb.1.1754371453372.520609796794870695; _hjSessionUser_2608622=eyJpZCI6IjJjNTU2NmVkLTkwZGEtNWI4OC1hZGZiLTVkNzAzMjQxNWRkMSIsImNyZWF0ZWQiOjE3NTQzNzE0NTM1OTIsImV4aXN0aW5nIjp0cnVlfQ==; prism_225221253=5b417ea5-a897-4e6d-817b-957c5dd4cd7d; __adroll_fpc=6af512f45af8b86aefd0cc70280c5ce9-1754371455008; __stripe_mid=a90980db-4b8d-4af4-8a6d-184c9a2c409937763d; remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d=eyJpdiI6IjdnNW1wMEJZSW5QWTROWnRBdzA5SEE9PSIsInZhbHVlIjoiZmc1SHhwdXh4V1B1RHVXd3BXK0VOeG9VZjlzT1FBbmtvdmhCRWRJZnd5Vk80N2tmRUtXVEpFWUFJMStrYXpkem9iSzcyRjFBMlJySTlzSlRxU0szVVNXSGJZVnJ2bjY0Q0RmcFY4WmdIYjByYkx6S3UzSnJtUXFlMkszbnpQNkxVMG5QYTRVUUZCWGlGaGRqOUlRcVFvZ2h1MnNQa05kRDhnb0ZVWm0yUkNoeDRxR2VnanMrNmJhNWRuUFdGSmJnR21HZnlXbE1IVTV2dFFidnFWV2kzODNJQkk2eG1TWExpUW1xVWZvS1NWOD0iLCJtYWMiOiI1NmQxMTY1NWEyOGU5OTY2YTdkN2JlN2Y5Zjc0MzM3YWUyZjI2YjAyMDllYWFmNGVjZDIzYmMzNDM5NzY1M2E0IiwidGFnIjoiIn0%3D; __ar_v4=65GEZOW3VVDI3D25SLGNF4%3A20250804%3A11%7CQ6DMTOJZUZHEPNZWV4BCHE%3A20250804%3A11; _ga_PZ1SK8Y50E=GS2.1.s1755190073$o7$g1$t1755190076$j57$l0$h0; _hjSession_2608622=eyJpZCI6ImZlOWZlNWFhLTI1MmMtNGUwZi1iMGZhLWM0MjhjOTViMTI4NyIsImMiOjE3NTUxOTAwODE2MTgsInMiOjEsInIiOjEsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MH0=; _gid=GA1.2.2025110009.1755190083; _gat_UA-129568755-11=1; _ga=GA1.1.387496420.1754371453; _clck=6wxxct%7C2%7Cfyg%7C0%7C2043; _gcl_au=1.1.1802266402.1754371473.559074052.1755190085.1755190084; _clsk=kb9yzt%7C1755190090302%7C1%7C1%7Cb.clarity.ms%2Fcollect; __stripe_sid=3ecbc136-0400-4060-b2c1-d894045a0f4abef4de; _ga_DJ17THQKDG=GS2.1.s1755190083$o13$g1$t1755190105$j38$l0$h0; _ga_XK9X91Z48W=GS2.1.s1755190083$o13$g1$t1755190105$j38$l0$h0; _ga_HEM3D68J8F=GS2.1.s1755190083$o11$g1$t1755190105$j38$l0$h0; _ga_7CLSYX72M2=GS2.1.s1755190081$o12$g1$t1755190106$j35$l0$h0; _ga_6DR8G1FN8S=GS2.1.s1755190084$o13$g1$t1755190106$j38$l0$h0; XSRF-TOKEN=eyJpdiI6InRTaVoxVU5LblAzQjNKNXF5c1gwMmc9PSIsInZhbHVlIjoiWkx3ZVhsWnFveXdYVDlPa2JSMXNMSm05VnV3K0JZN0xESEdKOGNVdU5kREwwZTZETUdETGtiRFc4UytIMm8wYmh3VElRbUw3UHJ3MVNIamRBMXJkZ05rOFRiNnFEUkxoWEd3ZVp1blhYaHVJTE4vTXJMSGRUbVhwNStmS2xKZE4iLCJtYWMiOiJlYmU4ZWRjZmRhMzllZjE3MjI1OWYwZmUwNTFjZWQzMTg4NDA2YzgyMjFkODE4YTQxNWFjMGY4YjIxN2M4ZDhkIiwidGFnIjoiIn0%3D; writerzen_session=eyJpdiI6Ik9zc0dFeHBDcjFtQ0R6VGl0VjlpS0E9PSIsInZhbHVlIjoic2hJYkRNaHludFlZdlR4WEZnV2tWNlc2V1NGRk5zS0hhbVZ4VU5DZzVrTUd5ZnUyb3AzMHorc1pvL2JQTHVpUlFRK09wMUN0RUZqYWxlNjg1UUltUFpUUWJZOW1wUi9XQVhxWmJwNnZsdlFFTEphaWozaW1mOUFJZlBWRy9SSm0iLCJtYWMiOiJlMDgyZDZlM2U0ZWQ0N2U5OWQ1ZDQ5ODc4ZWU2MjEwODE3ZjA5MTRmYTExY2JhNDNjOTY5NDE3MWM4MWRkN2E2IiwidGFnIjoiIn0%3D";
const FIXED_XSRF_TOKEN = "eyJpdiI6InRTaVoxVU5LblAzQjNKNXF5c1gwMmc9PSIsInZhbHVlIjoiWkx3ZVhsWnFveXdYVDlPa2JSMXNMSm05VnV3K0JZN0xESEdKOGNVdU5kREwwZTZETUdETGtiRFc4UytIMm8wYmh3VElRbUw3UHJ3MVNIamRBMXJkZ05rOFRiNnFEUkxoWEd3ZVp1blhYaHVJTE4vTXJMSGRUbVhwNStmS2xKZE4iLCJtYWMiOiJlYmU4ZWRjZmRhMzllZjE3MjI1OWYwZmUwNTFjZWQzMTg4NDA2YzgyMjFkODE4YTQxNWFjMGY4YjIxN2M4ZDhkIiwidGFnIjoiIn0=";

// Get WriterZen headers
const getWriterZenHeaders = () => ({
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://app.writerzen.net/user/keyword-explorer/",
  "X-Requested-With": "XMLHttpRequest",
  "X-XSRF-TOKEN": FIXED_XSRF_TOKEN,
  Cookie: FIXED_COOKIE,
});

// Check WriterZen authentication status
router.get("/auth-status", auth, async (req, res) => {
  try {
    const headers = getWriterZenHeaders();
    const testResponse = await axios.get("https://app.writerzen.net/api/user/profile", { headers });

    if (testResponse.status === 200) {
     // console.log("✅ WriterZen authentication valid");
      return res.json({
        isAuthenticated: true,
        message: "Authentication valid",
        authData: {
          cookie: FIXED_COOKIE.substring(0, 50) + "...",
          xsrfToken: FIXED_XSRF_TOKEN.substring(0, 20) + "...",
        },
      });
    }
    res.json({ isAuthenticated: false, message: "Authentication expired" });
  } catch (error) {
    console.error("❌ Auth Status Error:", error.message);
    res.status(500).json({ message: "Error checking authentication status" });
  }
});

// Get keywords
router.get("/keywords", auth, async (req, res) => {
  try {
    const { input } = req.query;
    if (!input) return res.status(400).json({ message: "Input keyword is required" });

   //console.log("🔍 Getting keyword suggestions for:", input);

    const headers = getWriterZenHeaders();
    const payload = { input, type: "keyword", location_id: 2840, language_id: 1000 };

    // Step 1: Create Task
    const createTaskUrl = "https://app.writerzen.net/api/services/keyword-explorer/v2/task";
    const createResp = await axios.post(createTaskUrl, payload, { headers });

    if (createResp.status !== 200) return res.status(createResp.status).json({ error: "Failed to create task" });

    const taskId = createResp.data.data.id;
    headers.Referer = `https://app.writerzen.net/user/keyword-explorer/${taskId}`;

    // Step 2: Poll until data ready
    const fetchUrl = `https://app.writerzen.net/api/services/keyword-explorer/v2/task/get-data?id=${taskId}`;
    let ideas = [];
    let attempt = 0;

    while (attempt < 36) {
      await new Promise((r) => setTimeout(r, 5000));
      const fetchResp = await axios.get(fetchUrl, { headers });
      if (fetchResp.status === 200 && fetchResp.data?.data?.ideas?.length > 0) {
        ideas = fetchResp.data.data.ideas;
        break;
      }
      attempt++;
    }

    if (!ideas.length) return res.status(408).json({ error: "Timeout: No keyword data after 3 min" });

    const topKeywords = ideas.slice(0, 10).map((item) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume,
      competition: item.competition,
      id: item.id,
    }));

    res.json({ status: 200, data: { keywords: topKeywords, total: ideas.length } });
  } catch (error) {
    console.error("❌ Keyword Suggestions Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Keywords to include
router.post("/keywords-to-include", auth, async (req, res) => {
  try {
    const { keyword } = req.body // static for now
    const BASE_URL = "https://app.writerzen.net/api/services/content-creator/v1";
    const headers = getWriterZenHeaders();
    headers["Content-Type"] = "application/json";

    // Step 1: Create Project
    const createProjectPayload = { name: keyword };
    const createResponse = await axios.post(`${BASE_URL}/projects`, createProjectPayload, { headers });
    const projectData = createResponse.data?.data;
    if (!projectData) return res.status(400).json({ message: "Project creation failed" });

    const user_id = projectData.user_id;
    const project_id = projectData.id;

    // Step 2: Create Task
    const taskPayload = {
      keyword,
      ai_config: {},
      assignees: [],
      automation: { keyword: false, title: false, outline: false, article: false },
      language_id: 2,
      location_id: 235239,
      owner: { id: user_id, name: "dev", email: "devloperops@gmail.com" },
      priority: "3",
      project_id,
    };
    const taskResponse = await axios.post(`${BASE_URL}/tasks`, taskPayload, { headers });
    const taskId = taskResponse.data?.data?.id;
    if (!taskId) return res.status(400).json({ message: "Task creation failed" });

    // Step 3: Fetch keywords until ready
    async function getKeywordsUntilReady(taskId, headers, delay = 3000, maxRetries = 15) {
      let attempts = 0;
      while (attempts < maxRetries) {
        attempts++;
        const getResponse = await axios.get(`${BASE_URL}/data?id=${taskId}&key=best_keyword`, { headers });
        const keywordData = getResponse.data?.data || [];
        if (Array.isArray(keywordData[0]) && keywordData[0].length > 0) return keywordData;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      throw new Error("❌ Keywords not ready after max retries");
    }

    const keywordData = await getKeywordsUntilReady(taskId, headers);
    const processedKeywords = Array.isArray(keywordData[0])
      ? keywordData[0].slice(0, 10).map((item) => ({
          text: item.text || "",
          searchVolume: item.searchVolume || 0,
        }))
      : [];

    res.json({ status: 200, data: { keywords: processedKeywords, total: processedKeywords.length } });
  } catch (error) {
    console.error("❌ Keywords to Include Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;