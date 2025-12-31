/*
  CareerFinderAI - app.js (Enhanced Version)

  Improvements:
  - Better prompt engineering for clearer career recommendations with steps
  - Returns 2-3 career options with detailed paths
  - Enhanced error handling and retry logic
*/

const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
const PORT = 3000;

// --- Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, "./frontend")));

// --- Helper functions ---
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry helper for Gemini calls
async function callGeminiWithRetry({ url, payload, maxRetries = 3 }) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 30000,
      });
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;

      console.error("Gemini error status:", status);
      console.error("Gemini error data:", JSON.stringify(data, null, 2));

      // Retry only on 429
      if (status === 429 && attempt < maxRetries) {
        const backoff = 1000 * Math.pow(2, attempt);
        console.warn(`429 received. Retrying in ${backoff}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(backoff);
        continue;
      }

      throw error;
    }
  }
}

// --- Debug endpoint ---
app.get("/api/ask", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "API is reachable. Use POST /api/ask with JSON { usrInput: '...' }",
  });
});

// --- Main API route ---
app.post("/api/ask", async (req, res) => {
  try {
    const { usrInput } = req.body;

    if (!usrInput || typeof usrInput !== "string" || usrInput.trim().length === 0) {
      return res.status(400).json({ success: false, message: "No input provided." });
    }

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "Missing API_KEY in .env. Add API_KEY=... and restart the server.",
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `You are a career counselor helping someone discover their ideal career path.

Based on the quiz answers below, recommend exactly 2-3 career paths that align with their interests and preferences.

For each career, provide:
1. A clear job title
2. A 2-3 sentence description explaining what the job involves and why it matches their interests
3. A list of 3-5 concrete steps to achieve this career (education, skills, experience needed)

Respond ONLY with valid JSON in this exact format (no markdown, no code blocks, no extra text):

{
  "summary": "A brief 1-2 sentence overview of their profile and career direction",
  "careers": [
    {
      "title": "Career Title",
      "description": "2-3 sentences about what this career involves and why it fits",
      "steps": [
        "Step 1: Specific action like 'Earn a Bachelor's degree in Computer Science'",
        "Step 2: Another concrete step",
        "Step 3: Another step"
      ]
    }
  ]
}

Quiz answers:
${usrInput}`,
            },
          ],
        },
      ],
    };

    const response = await callGeminiWithRetry({ url, payload, maxRetries: 3 });

    const text =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini API";

    // Clean up any markdown code blocks that might appear
    let cleanedText = text.trim();
    cleanedText = cleanedText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

    let result;
    try {
      result = JSON.parse(cleanedText);
      
      // Validate the structure
      if (!result.summary || !Array.isArray(result.careers)) {
        throw new Error("Invalid response structure");
      }

      // Ensure each career has the required fields
      result.careers = result.careers.map(career => ({
        title: career.title || "Unknown Career",
        description: career.description || "No description available",
        steps: Array.isArray(career.steps) ? career.steps : []
      }));

    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      // Fallback response
      result = {
        summary: "Based on your interests, here are some career suggestions.",
        careers: [
          {
            title: "Career Exploration Needed",
            description: text.substring(0, 200),
            steps: [
              "Take additional career assessments",
              "Research different industries",
              "Talk to career counselors"
            ]
          }
        ]
      };
    }

    return res.json({ success: true, ...result });

  } catch (error) {
    const status = error.response?.status;
    const geminiMsg =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message;

    console.error("API Error:", geminiMsg);

    if (status === 429) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded. Please wait a moment and try again.",
      });
    }

    return res.status(status || 500).json({
      success: false,
      message: `Unable to process your request. Please try again. Error: ${geminiMsg}`,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API Key configured: ${process.env.API_KEY ? 'Yes' : 'No'}`);
});