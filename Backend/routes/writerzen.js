const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");
const WriterZenAuth = require("../models/WriterZenAuth");
const checkCredits = require("../middleware/credits");
const CreditService = require("../services/creditService");

const router = express.Router();

// 🔹 Place your WriterZen cookie & token here
const FIXED_COOKIE = process.env.WRITERZEN_FIXED_COOKIE||"_fbp=fb.1.1753795409088.127568509822095815; lantern=3942a326-7faa-44dd-a423-309beff2e43b; _hjSessionUser_2608622=eyJpZCI6IjAxZjk4OTQxLTRjMzgtNTNiMS05M2U4LWEyNjY4MWYzZDY3OCIsImNyZWF0ZWQiOjE3NTM3OTU0MDkzMzAsImV4aXN0aW5nIjp0cnVlfQ==; prism_225221253=98fcd71e-aab6-4f27-9c97-7047bffffe58; __adroll_fpc=1be53b94abb4cc0e5227cb157297d429-1753795411228; __stripe_mid=a7ac58b0-2a00-44e0-9895-e991a6bec1de5cc508; _hjSession_2608622=eyJpZCI6IjU5MDhmZDFiLTNhM2UtNDYzMi05MTliLTE3M2VkNDVjNGNjNiIsImMiOjE3NTUyNDgxMDU2NjUsInMiOjEsInIiOjEsInNiIjowLCJzciI6MCwic2UiOjAsImZzIjowLCJzcCI6MH0=; _clck=1f0t7xv%7C2%7Cfyh%7C0%7C2036; _gid=GA1.2.2057703722.1755248108; __stripe_sid=d32bbc72-01b8-48f7-bd35-b7cf9ed397912cd5ae; _ga_PZ1SK8Y50E=GS2.1.s1755248105$o6$g1$t1755248117$j48$l0$h0; __ar_v4=65GEZOW3VVDI3D25SLGNF4%3A20250728%3A9%7CQ6DMTOJZUZHEPNZWV4BCHE%3A20250728%3A9; remember_web_59ba36addc2b2f9401580f014c7f58ea4e30989d=eyJpdiI6IkNKYXZpcHRjT3pyMjhJbFlEbWRnckE9PSIsInZhbHVlIjoiUWIxbHcwRXV5UmdxM3h5NkhMRWhiQnovQThtYlNJYzExQXhuUkxIcWNGS3Irb3V5YUdINm4xMkZvWHZsMTgrUWE5UVRVbGFEQ1ZFNFZkTVM1SW1xZ1YzcUphN0JEZWFKazBMdXRQUDdpUjk3Skt2Nko2V0ZRWkVLS2lkVUNvMHE0Ulkxc0wvY2crcFY5TDFZNC9XMUdzajJpbmdIcHZraTVIWkxRNEFCWG5aNmY1ZzkzSzRaa3ViZlZpaTA0U3pyV1dzQ2xmTGliaElNc2k0WXkxczhZUVRwekI3NGR3SWM0ZUl2Vmg5M1l2RT0iLCJtYWMiOiJjOTJkYTQ1NGI4YmM3ZjEwY2Y5OThhOTIwNDkyMDhiYTcyYjI4ODkxZDQwZTYyYmFmNzdkNmRkNDVhNGU4MThiIiwidGFnIjoiIn0%3D; _ga=GA1.1.1907015172.1753795409; _gcl_au=1.1.511095521.1753807976.953961195.1755248110.1755248138; _clsk=18wkwnb%7C1755248140312%7C6%7C1%7Cz.clarity.ms%2Fcollect; _ga_7CLSYX72M2=GS2.1.s1755248108$o6$g1$t1755248234$j60$l0$h0; _ga_DJ17THQKDG=GS2.1.s1755248108$o6$g1$t1755248234$j60$l0$h0; _ga_XK9X91Z48W=GS2.1.s1755248108$o6$g1$t1755248234$j60$l0$h0; _ga_HEM3D68J8F=GS2.1.s1755248108$o6$g1$t1755248234$j60$l0$h0; _ga_6DR8G1FN8S=GS2.1.s1755248108$o6$g1$t1755248234$j60$l0$h0; XSRF-TOKEN=eyJpdiI6IllneGhIVFZrcVh3L0VpMU1xbHJOYWc9PSIsInZhbHVlIjoiRjdQQVh3RXF0K29BMU9DZTZzbFl1TnAzUzRVTVlkREk1OUhkM0pnc3pXdmp0N25yMHJZYjgyOG5RYWc2RW4wMmF2bFVkcHhJY0huK2Z2d0lGTWh6TXkreE85YlZ6b0o5ckZockNDQm1hZURZaEVFUnJCa1V3VmpHM0FNdVR1QzgiLCJtYWMiOiI4Zjc2NzdlNjg0MzY3ZGRlZmUwYWNlY2VlMDRhYTYyODNiZjhmODg2NTYzMzU0ZjU2OGYxYjg4MjlmYWI5ZjVmIiwidGFnIjoiIn0%3D; writerzen_session=eyJpdiI6IkFhdTJYK1haVXZyRHFTcFlmaTlJbEE9PSIsInZhbHVlIjoiR1VVKzdlaThyZ2lQNXlyRHRpcEVEYzBYQ1RRbHBjRytkMjNIRDNGbDMyUGdCVWRkVnozY0drME9IRHNQQks2NVNGNGRpRUs2NVVIM2QvcTZqdlk1Q1RidkFrTmVPU0wvZ24rNlM3Wng5MU5BTVd4L3ZQQ0F1NlB4SlpXZXVQRnQiLCJtYWMiOiJmM2ZkMjcwNWUwOTNmZTA4MjM0OWQ4NGI0ZTEwODMzNmM5ZjQ4YjlhMjk4NzliNjI4YjQ0OWNiOTAxOGM2ZGNlIiwidGFnIjoiIn0%3D";
const FIXED_XSRF_TOKEN = process.env.WRITERZEN_FIXED_XSRF_TOKEN||"eyJpdiI6IllneGhIVFZrcVh3L0VpMU1xbHJOYWc9PSIsInZhbHVlIjoiRjdQQVh3RXF0K29BMU9DZTZzbFl1TnAzUzRVTVlkREk1OUhkM0pnc3pXdmp0N25yMHJZYjgyOG5RYWc2RW4wMmF2bFVkcHhJY0huK2Z2d0lGTWh6TXkreE85YlZ6b0o5ckZockNDQm1hZURZaEVFUnJCa1V3VmpHM0FNdVR1QzgiLCJtYWMiOiI4Zjc2NzdlNjg0MzY3ZGRlZmUwYWNlY2VlMDRhYTYyODNiZjhmODg2NTYzMzU0ZjU2OGYxYjg4MjlmYWI5ZjVmIiwidGFnIjoiIn0=";

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