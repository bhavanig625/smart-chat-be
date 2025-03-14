const axios = require("axios");
require("dotenv").config();

class groq {
  async generateChatResponse(context, query) {
    console.log("Generating chat response for:", query, context);
    try {
      const today = new Date();
      const response = await axios.post(
        `${process.env.GROQ_API_URL}/chat/completions`,
        {
          model: process.env.LLAMA_MODEL_ID,
          messages: [
            {
              role: "system",
              content: `You are an intelligent assistant that summarizes conversations naturally, without explicitly saying 'here is a summary' and that prioritizes the most recent information. Just provide the most important details in a natural and user-friendly way. Do not analyze patterns in greetings or point out repeated messages—just engage in a normal conversation.
              If no context is available, greet the user warmly and briefly explain the purpose of this smart chat. Do not say "No data found"; instead, offer helpful suggestions like "How can I assist you today?"  
              Todays date is ${today}. Use this for date-based reasoning and finding the latest information.
              - For example, if a user says "next Wednesday," infer the actual date and provide it.
              - If a user mentions a relative day like "next Wednesday" or "this Friday", **always return the full date (YYYY-MM-DD) in your response** along with the weekday.
              - If the user asks like "What is the date?" provide the **relative exact date fo the event**.
              - If a past date is required, infer the most relevant recent date.
              - Keep responses clear and conversational.
              - When multiple entries exist, always use the latest timestamp and ignore outdated values unless explicitly asked for history.
              - Summarize in a natural, user-friendly way without listing context numbers or timestamps unless the user specifically asks for them.
              - If the user asks for an updated value, assume they mean the most recent entry.
              - If no relevant data exists, inform the user instead of assuming.
              `,
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
