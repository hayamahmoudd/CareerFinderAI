/*
    This file is the main server file for the CareerFinderAI application.
    It sets up an Express server, serves static files, and handles API requests to the Gemini API.
*/
const express = require("express"); // Importing express for server creation
const path = require("path"); // Importing path for handling file paths
const dotenv = require("dotenv"); // Importing dotenv for environment variable management (useful for sensitive data like API keys)

const app = express(); // Create an instance of express
const PORT = 3000;// Define the port on which the server will listen

const axios = require("axios"); // Importing axios for making HTTP requests
dotenv.config(); // Load environment variables from .env file

// Serve static frontend files
app.use(express.static(path.join(__dirname, "./frontend"))); 
app.use(express.json()); 

// Route to serve frontend.html at the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "./frontend/quiz.html"));
});

// API endpoint for frontend to call Gemini API
app.post("/api/ask", async (req, res) => {
    const { usrInput } = req.body;
    if (!usrInput) {
        return res.json({ success: false, message: "No input provided." });
    }
    try {
        const apiKey = process.env.API_KEY;
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                contents: [
                    {
                        parts: [
                            {
                                text: `
                                    Respond to the user query: ${usrInput}
                                    Provide a detailed response with relevant information.
                                    Do NOT use markdown format. Only respond with plain text and NO formatting.
                                    Sum up the response between 100-150 words while keeping it informative.
                                `,
                            },
                        ],
                    },
                ],
            }
        );
        // Safely extract the text from the response
        const text =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response from Gemini API";
        res.json({ success: true, text });
    } catch (error) {
        console.error("Error fetching Gemini response:", error.message);
        res.status(500).json({ error: "Failed to fetch Gemini response." });
    }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
