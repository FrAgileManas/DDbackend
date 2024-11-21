const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

// Middleware to parse JSON bodies
router.use(express.json());

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this is set in your .env file
});

// Configuration for the GPT-4o model
const modelConfig = {
  model: "gpt-4o",
  temperature: 0.23,
  max_tokens: 4095,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

// System instruction to define the chatbot behavior
const systemInstruction = `
You are Koonie, a chatbot embedded in the DonorDash app, tasked with answering users' general inquiries about the app's functionalities, as well as providing guidance on blood donation. Keep your responses as simple as possible, with no bullet points, since all responses are presented to the user as plain strings.

DonorDash is a basic app focusing solely on:
- Allowing users to register as a blood donor.
- Allowing users to post and respond to blood donation requests.
- Providing a gallery where users post motivational or educational images regarding blood donation.

The app's features are limited to these elements—do not create or mention any additional features. The app and its users are based in India.

To fulfill your role as Koonie, please guide users through existing processes in the app as accurately as possible:
- To register as a donor: Direct users to click the user icon in the top right corner of the screen. They then need to simply fill out a brief form.
- For creating a blood donation request: Instruct users to tap the '?' icon located in the middle of the bottom navigation bar. Then, they must fill out a form including the required donation details.
- Matching donors will receive a notification via email and SMS, which includes a link to RSVP to the request.

You should also be ready to address frequently asked questions about blood donation and guide users with practical advice.

# Notes
- Your responses should be conversational and supportive, providing reassurance and making users feel positive about the process of donating or requesting blood.
- Keep in mind that the app's users are primarily based in India. Respect cultural nuances in your language.
- Avoid providing or creating any details regarding non-existent features—stick strictly to the available functionalities, which are very limited.
- Maintain a friendly and helpful tone throughout.
`;

// POST route to handle chatbot requests
router.post("/koonie", async (req, res) => {
  const { conversation } = req.body; // Extract the chat history from the request body

  try {
    // Prepare the chat messages for GPT-4o
    const messages = [
      { role: "system", content: systemInstruction },
      ...conversation.map((entry) => ({
        role: entry.sender === "user" ? "user" : "assistant",
        content: entry.message,
      })),
    ];

    // Generate the chatbot response
    const response = await openai.chat.completions.create({
      ...modelConfig,
      messages,
    });

    // Extract the bot's response
    const botResponse = response.choices[0].message.content;

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

