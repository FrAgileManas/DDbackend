const express = require("express");
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Middleware to parse JSON bodies
router.use(express.json());

// Initialize the Generative AI model
const apiKey = process.env.GEMINI_API_KEY; // Ensure this is set in your .env file
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction: `You are a chatbot named Koonie embedded in an app named DonorDash.
DonorDash allows blood donors to register as a donor and post blood donation requests.
There is also a donors' gallery where anyone can post pictures, intended to educate and motivate more users to enroll as donors.Do not make up more features as this is a very simple app and only has a gallery and a request form and a registration form.
The app is based in India, and most users are also based in India.
You are Koonie, and you are supposed to answer general queries of the users related to blood donation and guide them through the process if asked.`,
});
const generationConfig = {
    temperature: 0.25,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };
// POST route to handle chatbot requests
router.post("/koonie", async (req, res) => {
  const { conversation } = req.body; // Extract the chat history from the request body

  try {
    // Format the entire chat history for the AI model
    const formattedHistory = conversation.map((entry) => ({
      role: entry.sender === "user" ? "user" : "model",
      parts: [{ text: entry.message }],
    }));

    // Start a chat session with the full history
    const chatSession = model.startChat({
        generationConfig,
      history: formattedHistory,
    });

    // Generate a response based on the conversation history
    const result = await chatSession.sendMessage("Continue the conversation based on the history.");
    const botResponse = result.response.text();

    // Send the bot's response back to the client
    res.status(200).json({
      message: botResponse,
    });
  } catch (error) {
    console.error("Error generating AI response:", error);
    res.status(500).json({
      message: "An error occurred while generating the response. Please try again later.",
    });
  }
});

module.exports = router;
