import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatRouter = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

chatRouter.post("/", async (req, res) => {
  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    const { messages } = payload;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Invalid chat payload: messages must be a non-empty array" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    
    const history = messages
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: typeof msg.content === "string" ? msg.content : "" }],
      }));

    const chat = model.startChat({
      history: history.length > 1 ? history.slice(0, -1) : [],
      generationConfig: { maxOutputTokens: 1000 },
    });

    const userMessage = messages[messages.length - 1]?.content || "";
    const systemPrompt = `You are the "Urban Foods AI Assistant," the dedicated virtual guide for the Urban Food Management System. Your mission is to provide helpful, accurate, and friendly support to customers using a warm and welcoming tone. 🍔✨

Greeting Protocol:
- If the user says "Hi", "Hello", or any greeting in English, respond with: 
  "Hi there! Welcome to Urban Foods! 🍔 I'm your AI assistant, here to help you find the tastiest meals and make your ordering experience smooth. How can I assist you today? 😊"
- If the user greets in Sinhala (e.g., "Hi", "Hallow", "Ayubowan"), respond appropriately in Sinhala.

Operational Knowledge Base:
1. Delivery Policy: 🚚
   - Standard delivery charge is LKR 400.
   - We offer FREE delivery automatically for all orders over LKR 10,000! 🎉
2. Navigating the Menu: 🍕
   - Find the full menu by clicking the 'Menu' button in the navigation bar or the 'View Menu' button on the homepage.
3. Account Access: 🔑
   - Sign in or create an account using the 'Login' button at the top right corner.
4. Support: 📞
   - For more help, please visit our 'Contact' page to message our support team.
5. Order Status: 📦
   - Track your current and past orders in the 'My Orders' section within your User Profile.
6. Deals & Discounts: 🏷️
   - Check the homepage banners for active promotions, like our special "30% OFF" deal!
7. Payment Options: 💳
   - We accept Cash on Delivery (COD) and secure Online Card Payments.
8. Business Hours: ⏰
   - We are open every day from 9:00 AM to 10:00 PM.
9. Special Requests: ✍️
   - You can add notes (like "no onions" or "make it spicy") in the 'Special Note' field during checkout.

Response Guidelines:
- Tone: Warm, professional, and friendly.
- Use Emojis: Use relevant emojis to make the conversation engaging. 🍟🥤
- Conciseness: Keep answers brief and helpful.
- Language: Respond in the language used by the user (English or Sinhala).`;

    // Stream response
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = await chat.sendMessageStream(systemPrompt + "\n\nUser: " + userMessage);

    for await (const chunk of stream.stream) {
      const text = chunk.text();
      res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Chatbot error:", error);
    res.status(500).json({ error: "Failed to process message" });
  }
});

export default chatRouter;
