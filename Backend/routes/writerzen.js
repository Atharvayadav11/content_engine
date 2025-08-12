const express = require("express")
const axios = require("axios")
const WriterZenAuth = require("../models/WriterZenAuth")
const auth = require("../middleware/auth")
const checkCredits = require("../middleware/credits")
const CreditService = require("../services/creditService")

const router = express.Router()

// Get WriterZen headers
const getWriterZenHeaders = (cookie, xsrfToken) => ({
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  Referer: "https://app.writerzen.net/user/keyword-explorer/",
  "X-Requested-With": "XMLHttpRequest",
  "X-XSRF-TOKEN": xsrfToken,
  Cookie: cookie,
})

// Check WriterZen authentication status
router.get("/auth-status", auth, async (req, res) => {
  try {
    const authData = await WriterZenAuth.findOne({ userId: req.user._id })

    if (!authData || !authData.cookie || !authData.xsrfToken) {
      console.log("❌ No WriterZen auth data found")
      return res.json({
        isAuthenticated: false,
        message: "Not authenticated",
        authData: null,
      })
    }

    // Test the authentication only when checking status
    try {
      const headers = getWriterZenHeaders(authData.cookie, authData.xsrfToken)
      const testResponse = await axios.get("https://app.writerzen.net/api/user/profile", { headers })

      if (testResponse.status === 200) {
        console.log("✅ WriterZen authentication valid")
        await WriterZenAuth.findByIdAndUpdate(authData._id, {
          isValid: true,
          lastValidated: new Date(),
        })
        return res.json({
          isAuthenticated: true,
          message: "Authentication valid",
          authData: {
            cookie: authData.cookie.substring(0, 50) + "...",
            xsrfToken: authData.xsrfToken.substring(0, 20) + "...",
            lastValidated: authData.lastValidated,
          },
        })
      }
    } catch (error) {
      console.log("❌ WriterZen authentication invalid:", error.response?.status)
    }

    await WriterZenAuth.findByIdAndUpdate(authData._id, { isValid: false })
    res.json({
      isAuthenticated: false,
      message: "Authentication expired",
      authData: {
        cookie: authData.cookie.substring(0, 50) + "...",
        xsrfToken: authData.xsrfToken.substring(0, 20) + "...",
        lastValidated: authData.lastValidated,
      },
    })
  } catch (error) {
    console.error("❌ Auth Status Error:", error)
    res.status(500).json({ message: "Error checking authentication status" })
  }
})

// Save WriterZen credentials manually (no validation)
router.post("/save-credentials", auth, async (req, res) => {
  try {
    const { cookie, xsrfToken } = req.body

    if (!cookie || !xsrfToken) {
      return res.status(400).json({
        message: "Both cookie and X-XSRF-TOKEN are required",
      })
    }

    console.log("💾 Saving WriterZen credentials manually...")
    console.log("🍪 Cookie length:", cookie.length)
    console.log("🔑 XSRF Token length:", xsrfToken.length)

    // Save credentials directly without validation
    const authData = await WriterZenAuth.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        cookie: cookie.trim(),
        xsrfToken: xsrfToken.trim(),
        isValid: true, // Assume valid since we trust user input
        lastValidated: new Date(),
      },
      { upsert: true, new: true },
    )

    console.log("✅ WriterZen credentials saved successfully")

    res.json({
      message: "WriterZen credentials saved successfully",
      isAuthenticated: true,
      authData: {
        cookie: cookie.substring(0, 50) + "...",
        xsrfToken: xsrfToken.substring(0, 20) + "...",
        lastValidated: authData.lastValidated,
      },
    })
  } catch (error) {
    console.error("❌ Save Credentials Error:", error)
    res.status(500).json({
      message: "Error saving WriterZen credentials",
      error: error.message,
    })
  }
})

// Update existing credentials (no validation)
router.put("/update-credentials", auth, async (req, res) => {
  try {
    const { cookie, xsrfToken } = req.body

    if (!cookie || !xsrfToken) {
      return res.status(400).json({
        message: "Both cookie and X-XSRF-TOKEN are required",
      })
    }

    console.log("🔄 Updating WriterZen credentials...")

    // Update credentials directly without validation
    const authData = await WriterZenAuth.findOneAndUpdate(
      { userId: req.user._id },
      {
        cookie: cookie.trim(),
        xsrfToken: xsrfToken.trim(),
        isValid: true, // Assume valid since we trust user input
        lastValidated: new Date(),
      },
      { new: true },
    )

    if (!authData) {
      return res.status(404).json({ message: "No existing credentials found to update" })
    }

    console.log("✅ WriterZen credentials updated successfully")

    res.json({
      message: "WriterZen credentials updated successfully",
      isAuthenticated: true,
      authData: {
        cookie: cookie.substring(0, 50) + "...",
        xsrfToken: xsrfToken.substring(0, 20) + "...",
        lastValidated: authData.lastValidated,
      },
    })
  } catch (error) {
    console.error("❌ Update Credentials Error:", error)
    res.status(500).json({
      message: "Error updating WriterZen credentials",
      error: error.message,
    })
  }
})

// Remove WriterZen credentials
router.delete("/remove-credentials", auth, async (req, res) => {
  try {
    await WriterZenAuth.findOneAndUpdate(
      { userId: req.user._id },
      {
        cookie: "",
        xsrfToken: "",
        isValid: false,
      },
    )

    console.log("🗑️ WriterZen credentials removed successfully")

    res.json({
      message: "WriterZen credentials removed successfully",
      isAuthenticated: false,
    })
  } catch (error) {
    console.error("❌ Remove Credentials Error:", error)
    res.status(500).json({ message: "Error removing credentials" })
  }
})

// Get keyword suggestions
// router.get("/keywords", auth, async (req, res) => {
//   try {
//     const { input } = req.query

//     if (!input) {
//       return res.status(400).json({ message: "Input keyword is required" })
//     }

//     console.log("🔍 Getting keyword suggestions for:", input)

//     const authData = await WriterZenAuth.findOne({ userId: req.user._id })
//     if (!authData || !authData.cookie || !authData.xsrfToken) {
//       return res.status(401).json({ message: "WriterZen credentials required" })
//     }

//     const headers = getWriterZenHeaders(authData.cookie, authData.xsrfToken)

//     const payload = {
//       input: input,
//       type: "keyword",
//       location_id: 2840,
//       language_id: 1000,
//     }

//     // Step 1: Create Task
//     const createTaskUrl = "https://app.writerzen.net/api/services/keyword-explorer/v2/task"
//     const createResp = await axios.post(createTaskUrl, payload, { headers })

//     if (createResp.status !== 200) {
//       return res.status(createResp.status).json({ error: "Failed to create task" })
//     }

//     const taskId = createResp.data.data.id
//     console.log(`✅ Task Created! ID: ${taskId}`)

//     // Update Referer with taskId
//     headers.Referer = `https://app.writerzen.net/user/keyword-explorer/${taskId}`

//     // Wait for data to be ready
//     await new Promise((r) => setTimeout(r, 3000))

//     // Step 2: Fetch Data
//     const fetchUrl = `https://app.writerzen.net/api/services/keyword-explorer/v2/task/get-data?id=${taskId}`
//     const fetchResp = await axios.get(fetchUrl, { headers })

//     if (fetchResp.status === 200) {
//       console.log("✅ Keyword data fetched successfully")

//       // Extract top 10 keywords
//       const ideas = fetchResp.data?.data?.ideas || []
//       const topKeywords = ideas.slice(0, 10).map((item) => ({
//         keyword: item.keyword,
//         searchVolume: item.search_volume,
//         competition: item.competition,
//         id: item.id,
//       }))

//       console.log("📊 Top keywords found:", topKeywords.length)

//       return res.json({
//         status: 200,
//         data: {
//           keywords: topKeywords,
//           total: ideas.length,
//         },
//       })
//     } else {
//       return res.status(fetchResp.status).json({ error: "Failed to fetch data" })
//     }
//   } catch (error) {
//     console.error("❌ Keyword Suggestions Error:", error.response?.data || error.message)

//     // If credentials are invalid, mark them as such
//     if (error.response?.status === 401 || error.response?.status === 403) {
//       await WriterZenAuth.findOneAndUpdate({ userId: req.user._id }, { isValid: false })
//       return res.status(401).json({
//         error: "WriterZen credentials are invalid or expired. Please update them.",
//         needsCredentialUpdate: true,
//       })
//     }

//     res.status(500).json({ error: "Internal server error" })
//   }
// })
router.get("/keywords", auth, async (req, res) => {
  try {
    const { input } = req.query;

    if (!input) {
      return res.status(400).json({ message: "Input keyword is required" });
    }

    console.log("🔍 Getting keyword suggestions for:", input);

    const authData = await WriterZenAuth.findOne({ userId: req.user._id });
    if (!authData || !authData.cookie || !authData.xsrfToken) {
      return res.status(401).json({ message: "WriterZen credentials required" });
    }

    const headers = getWriterZenHeaders(authData.cookie, authData.xsrfToken);

    const payload = {
      input: input,
      type: "keyword",
      location_id: 2840,
      language_id: 1000,
    };

    console.log("📤 Sending keyword suggestions payload:", JSON.stringify(payload, null, 2));

    // Step 1: Create Task
    const createTaskUrl = "https://app.writerzen.net/api/services/keyword-explorer/v2/task";
    
    let createResp;
    try {
      createResp = await axios.post(createTaskUrl, payload, { headers });
    } catch (taskError) {
      console.error("❌ WriterZen keyword task creation failed:", {
        status: taskError.response?.status,
        statusText: taskError.response?.statusText,
        data: taskError.response?.data,
        message: taskError.message,
        url: createTaskUrl
      });
      
      // Check if it's an authentication error
      if (taskError.response?.status === 401 || taskError.response?.status === 403) {
        await WriterZenAuth.findOneAndUpdate({ userId: req.user._id }, { isValid: false });
        return res.status(401).json({
          message: "WriterZen credentials are invalid or expired. Please update them.",
          needsCredentialUpdate: true,
        });
      }
      
      return res.status(500).json({
        message: "WriterZen keyword task creation API call failed",
        error: taskError.response?.data || taskError.message,
        status: taskError.response?.status
      });
    }

    console.log("✅ Keyword task HTTP request successful");
    console.log("Task Creation Response Status:", createResp.status);
    console.log("Task Creation Response Data:", JSON.stringify(createResp.data, null, 2));

    // Check if WriterZen returned an internal error
    if (createResp.data?.status === 500) {
      console.log("❌ WriterZen internal API error (status 500)");
      return res.status(500).json({ 
        error: "WriterZen API internal error",
        message: "WriterZen's keyword explorer service is currently experiencing issues. Please try again later or check your WriterZen account status.",
        writerzen_status: createResp.data.status,
        details: createResp.data 
      });
    }

    if (createResp.status !== 200) {
      console.log("❌ Task creation failed with HTTP status:", createResp.status);
      return res.status(createResp.status).json({ 
        error: "Failed to create keyword task",
        details: createResp.data 
      });
    }

    const taskId = createResp.data.data?.id;
    if (!taskId) {
      console.log("❌ No task ID found in response");
      return res.status(500).json({ 
        error: "Task creation failed - no task ID returned",
        message: "WriterZen API returned success but no task ID. This might indicate an account or subscription issue.",
        details: createResp.data 
      });
    }
    
    console.log(`✅ Task Created! ID: ${taskId}`);

    // Update Referer header
    headers.Referer = `https://app.writerzen.net/user/keyword-explorer/${taskId}`;

    // Step 2: Poll until data is ready (max 3 min)
    const fetchUrl = `https://app.writerzen.net/api/services/keyword-explorer/v2/task/get-data?id=${taskId}`;

    let ideas = [];
    const maxAttempts = 36; // 36 attempts * 5s = 180s (3 min)
    let attempt = 0;

    while (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, 5000)); // Wait 5 seconds

      try {
        const fetchResp = await axios.get(fetchUrl, { headers });

        if (fetchResp.status === 200 && fetchResp.data?.data?.ideas?.length > 0) {
          ideas = fetchResp.data.data.ideas;
          console.log("✅ Keyword data fetched successfully");
          break;
        }

        console.log(`⏳ Attempt ${attempt + 1}: Waiting for data... Status: ${fetchResp.status}`);
      } catch (fetchError) {
        console.error(`❌ Attempt ${attempt + 1} failed:`, {
          status: fetchError.response?.status,
          data: fetchError.response?.data,
          message: fetchError.message
        });
        
        // If it's an auth error, stop trying
        if (fetchError.response?.status === 401 || fetchError.response?.status === 403) {
          await WriterZenAuth.findOneAndUpdate({ userId: req.user._id }, { isValid: false });
          return res.status(401).json({
            message: "WriterZen credentials are invalid or expired. Please update them.",
            needsCredentialUpdate: true,
          });
        }
      }
      
      attempt++;
    }

    if (ideas.length === 0) {
      return res.status(408).json({ error: "Timeout: No keyword data available after 3 minutes." });
    }

    // Extract top 10 keywords
    const topKeywords = ideas.slice(0, 10).map((item) => ({
      keyword: item.keyword,
      searchVolume: item.search_volume,
      competition: item.competition,
      id: item.id,
    }));

   // console.log("📊 Top keywords found:", topKeywords.length);

    return res.json({
      status: 200,
      data: {
        keywords: topKeywords,
        total: ideas.length,
      },
    });

  } catch (error) {
    console.error("❌ Keyword Suggestions Error:", error.response?.data || error.message);
    console.error("❌ Full keyword suggestions error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      await WriterZenAuth.findOneAndUpdate({ userId: req.user._id }, { isValid: false });
      return res.status(401).json({
        error: "WriterZen credentials are invalid or expired. Please update them.",
        needsCredentialUpdate: true,
      });
    }

    // Return more specific error information
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.message || error.message || "Internal server error";
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.response?.data,
      type: "keyword_suggestions_error"
    });
  }
});

// Get keywords to include


router.post("/keywords-to-include", auth, async (req, res) => {
  try {
     const { keyword } = req.body
   // const keyword = "cold email strategy" // For testing purposes, you can remove this line later;

    console.log("📥 Keywords to include request body:", req.body)
    console.log("📝 Extracted keyword:", keyword)

    if (!keyword || keyword.trim() === '') {
      console.log("❌ No keyword provided in request")
      return res.status(400).json({ message: "Keyword is required and cannot be empty" })
    }

    //console.log("🎯 Getting keywords to include for:", keyword)

    const authData = await WriterZenAuth.findOne({ userId: req.user._id })
    if (!authData || !authData.cookie || !authData.xsrfToken) {
      return res.status(401).json({ message: "WriterZen credentials required" })
    }

    const BASE_URL = "https://app.writerzen.net/api/services/content-creator/v1"
    const headers = getWriterZenHeaders(authData.cookie, authData.xsrfToken)
    headers["Content-Type"] = "application/json"

    // Step 1: Create Project
    const createProjectPayload = { name: keyword }
    console.log("📝 Creating project with payload:", createProjectPayload)
    
    let createResponse
    try {
      createResponse = await axios.post(`${BASE_URL}/projects`, createProjectPayload, { headers })
    } catch (projectError) {
      console.error("❌ WriterZen project creation failed:", {
        status: projectError.response?.status,
        statusText: projectError.response?.statusText,
        data: projectError.response?.data,
        message: projectError.message
      })
      
      // Check if it's an authentication error
      if (projectError.response?.status === 401 || projectError.response?.status === 403) {
        await WriterZenAuth.findOneAndUpdate({ userId: req.user._id }, { isValid: false })
        return res.status(401).json({
          message: "WriterZen credentials are invalid or expired. Please update them.",
          needsCredentialUpdate: true,
        })
      }
      
      return res.status(500).json({
        message: "WriterZen project creation API call failed",
        error: projectError.response?.data || projectError.message,
        status: projectError.response?.status
      })
    }
    console.log("✅ Project Created Successfully")
    console.log("Project Creation Response Status:", createResponse.status)
    console.log("Project Creation Response Data:", JSON.stringify(createResponse.data, null, 2))
    
    const projectData = createResponse.data?.data;
    if (!projectData) {
      console.log("⚠ Project creation failed:", createResponse.data)
      return res.status(500).json({ 
        message: "Project creation failed - no project data returned",
        details: createResponse.data 
      })
    }

    const user_id = projectData.user_id
    const project_id = projectData.id
  //  console.log("✅ Project Created - User ID:", user_id, "Project ID:", project_id)

    // Step 2: Create Task
    const taskPayload = {
      keyword: keyword,
      ai_config: {
        content_format: null,
        content_tone: null,
        target_audience: null,
        author_perspective: null,
      },
      assignees: [],
      automation: {
        keyword: false,
        title: false,
        outline: false,
        article: false,
      },
      deadline: null,
      enable_nlp: true,
      keyword_to_include: [],
      language: {
        name: "English",
        language_code: "en",
        icon: "gb",
        criteria_id: 1000,
        id: 2,
      },
      language_id: 2,
      location: {
        //id: 235239,
        id:1,
        criteria_id: 2840,
        name: "United States",
        canonical_name: "United States",
      },
     // location_id: 235239,
      location_id:1,
      note: null,
      owner: {
        id: user_id,
        name: "Navin",
        email: "p15navinkumarg@iima.ac.in",
      },
      priority: "3",
      project_id: project_id,
    }

    console.log("📤 Sending task payload to WriterZen:", JSON.stringify(taskPayload, null, 2))
    
    let taskResponse
    try {
      taskResponse = await axios.post(`${BASE_URL}/tasks`, taskPayload, { headers })
    } catch (taskError) {
      console.error("❌ WriterZen task creation failed:", {
        status: taskError.response?.status,
        statusText: taskError.response?.statusText,
        data: taskError.response?.data,
        message: taskError.message
      })
      
      // Check if it's an authentication error
      if (taskError.response?.status === 401 || taskError.response?.status === 403) {
        await WriterZenAuth.findOneAndUpdate({ userId: req.user._id }, { isValid: false })
        return res.status(401).json({
          message: "WriterZen credentials are invalid or expired. Please update them.",
          needsCredentialUpdate: true,
        })
      }
      
      return res.status(500).json({
        message: "WriterZen task creation API call failed",
        error: taskError.response?.data || taskError.message,
        status: taskError.response?.status
      })
    }
    console.log("✅ Keywords-to-include task HTTP request successful")
    console.log("Task Creation Response Status:", taskResponse.status)
    console.log("Task Creation Response Data:", JSON.stringify(taskResponse.data, null, 2))
    
    // Check if WriterZen returned an internal error
    if (taskResponse.data?.status === 500) {
      console.log("❌ WriterZen internal API error (status 500)")
      return res.status(500).json({ 
        error: "WriterZen API internal error",
        message: "WriterZen's content creator service is currently experiencing issues. Please try again later or check your WriterZen account status.",
        writerzen_status: taskResponse.data.status,
        details: taskResponse.data
      })
    }
    
    const taskId = taskResponse.data?.data?.id
    if (!taskId) {
      console.log("⚠ No Task ID found in the response.")
      console.log("Response structure:", JSON.stringify(taskResponse.data, null, 2))
      
      return res.status(500).json({ 
        message: "Task creation failed - no task ID returned",
        error: "WriterZen API returned success but no task ID. This might indicate an account or subscription issue.",
        details: taskResponse.data 
      })
    }

//    console.log(`📋 Task ID: ${taskId}`)

    // -----------------------------
    // ✅ Step 3: Get keywords data
    // -----------------------------
    async function getKeywordsUntilReady(taskId, headers, delay = 3000, maxRetries = 15) {
      let attempts = 0;

      while (attempts < maxRetries) {
        attempts++;
        const getUrl = `${BASE_URL}/data?id=${taskId}&key=best_keyword`;

        try {
          const getResponse = await axios.get(getUrl, { headers });
          console.log(`🔄 Attempt ${attempts} - Checking keywords...`);
          console.dir(getResponse.data, { depth: null });

          const keywordData = getResponse.data?.data || [];

          if (Array.isArray(keywordData[0]) && keywordData[0].length > 0) {
        //    console.log("✅ Keywords ready!");
            return keywordData;
          }

       //   console.log("⏳ Keywords not ready yet... retrying in", delay / 1000, "sec");
          await new Promise((resolve) => setTimeout(resolve, delay));
        } catch (err) {
          console.log("⚠ Error fetching keywords, retrying...", err.message);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      throw new Error("❌ Keywords not ready after maximum retries");
    }

    const keywordData = await getKeywordsUntilReady(taskId, headers);

    // Process the data to extract top 10 keywords
    const processedKeywords = []
    if (Array.isArray(keywordData[0])) {
      const topKeywords = keywordData[0].slice(0, 10).map((item) => ({
        text: item.text || "",
        searchVolume: item.searchVolume || 0,
        repeat: item.repeat || 0,
        density: item.density || 0,
        similarity: item.similarity || 0,
        frequency: item.frequency || 0,
      }));
      processedKeywords.push(...topKeywords);
    }

  //  console.log("🎯 Keywords to include found:", processedKeywords.length)

    res.json({
      status: 200,
      data: {
        keywords: processedKeywords,
        total: processedKeywords.length,
      },
    })
  } catch (error) {
    console.error("❌ Keywords to Include Error:", error.response?.data || error.message)
    console.error("❌ Full error details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })

    // If credentials are invalid, mark them as such
    if (error.response?.status === 401 || error.response?.status === 403) {
      await WriterZenAuth.findOneAndUpdate({ userId: req.user._id }, { isValid: false })
      return res.status(401).json({
        error: "WriterZen credentials are invalid or expired. Please update them.",
        needsCredentialUpdate: true,
      })
    }

    // Return more specific error information
    const statusCode = error.response?.status || 500
    const errorMessage = error.response?.data?.message || error.message || "Internal server error"
    
    res.status(statusCode).json({ 
      error: errorMessage,
      details: error.response?.data,
      type: "keywords_to_include_error"
    })
  }
})


module.exports = router
