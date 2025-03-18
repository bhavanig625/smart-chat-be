const axios = require("axios");
require("dotenv").config();

class groq {
  async generateChatResponse(context, query) {
    console.log("Generating chat response...");
    try {
      const today = new Date();
      const systemPrompt = process.env.GROQ_SYSTEM_PROMPT.replace(
        "{today}",
        today
      );
      const response = await axios.post(
        `${process.env.GROQ_API_URL}/chat/completions`,
        {
          model: process.env.LLAMA_MODEL_ID,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Context:\n${context}\n\nUser Query: ${query}`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
        }
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating chat response:", error);
      throw error;
    }
  }
}
module.exports = groq;
