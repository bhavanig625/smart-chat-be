const Groq = require("../utils/groq");
const Qdrant = require("../utils/qdrant");

class DataProcessingService {
  constructor() {
    this.groq = new Groq();
    this.qdrant = new Qdrant();
  }

  async insert(userId, text) {
    if (!text) {
      throw new Error("Text is required");
    }
    try {
      return await this.qdrant.insertData(userId, text);
    } catch (error) {
      console.error("Insert Error:", error);
      throw new Error("Failed to insert data");
    }
  }

  async retrieveData(userId, query) {
    if (!query) {
      throw new Error("Query is required");
    }

    try {
      const searchResults = await this.qdrant.searchQdrant(userId, query);

      //   if (!searchResults || searchResults.length === 0) {
      //     return "No relevant data found. Please add more details.";
      //   }

      // 📝 Format Qdrant results as context
      const context = searchResults
        .map(
          (item, index) =>
            `Context ${index + 1}: ${item.payload.text} (Timestamp: ${
              item.payload.timestamp
            })`
        )
        .join("\n");

      // 🤖 Generate Chat Response
      return await this.groq.generateChatResponse(context, query);
    } catch (error) {
      console.error("Retrieve Error:", error);
      throw new Error("Failed to retrieve data");
    }
  }
}

module.exports = new DataProcessingService(); // Singleton instance
