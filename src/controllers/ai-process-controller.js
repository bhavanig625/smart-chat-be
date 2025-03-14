const DataProcessingService = require("../services/DataProcessingService");

class AIProcessController {
  async trainModel(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
      const insertResponse = await DataProcessingService.insert(
        req.user.uid,
        text
      );
      if (!insertResponse || insertResponse.error) {
        throw new Error(insertResponse.error);
      }
      return res.status(200).json({
        message: "Your info has been successfully processed and saved!",
      });
    } catch (error) {
      console.error("Training model error:", error);
      return res.status(500).json({ error: "Failed to train model" });
    }
  }

  async retieveData(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
    }
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    try {
      const response = await DataProcessingService.retrieveData(
        req.user.uid,
        query
      );
      return res.status(200).json({ message: response });
    } catch (error) {
      console.error("Retrieve Error :", error);
      return res.status(500).json({ error: "Failed to retrieve data" });
    }
  }
}

module.exports = new AIProcessController();
