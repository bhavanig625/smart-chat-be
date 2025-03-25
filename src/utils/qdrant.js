const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();
const axios = require("axios");

class qdrant {
  constructor() {
    this.QDRANT_URL = process.env.QDRANT_ENDPOINT_URL;
    this.QDRANT_API_KEY = process.env.QDRANT_API_KEY;
    this.QDRANT_SEARCH_RESULT_COUNT = process.env.QDRANT_SEARCH_RESULT_COUNT;
  }

  async checkCollectionExists(collectionName) {
    try {
      console.log("Checking if collection exists:", collectionName);
      const response = await axios.get(
        `${this.QDRANT_URL}/collections/${collectionName}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.QDRANT_API_KEY}`,
          },
        }
      );

      if (response.status === 200) {
        console.log(`✅ Collection ${collectionName} exists.`);
        return true;
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`⚠️ Collection ${collectionName} does NOT exist.`);
        return false;
      }
      console.error("Error checking collection:", error);
      return false;
    }
  }

  async createCollection(collectionName) {
    try {
      console.log("Creating collection:", collectionName);
      const response = await axios.put(
        `${this.QDRANT_URL}/collections/${collectionName}`,
        {
          vectors: { size: 384, distance: "Cosine" },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.QDRANT_API_KEY}`,
          },
        }
      );
      if (response.status === 200) {
        console.log(`✅ Collection ${collectionName} created successfully.`);
        return true;
      }
    } catch (error) {
      console.error("❌ Error creating collection:", error.message);
      return false;
    }
  }

  async ensureUserCollection(collectionName) {
    const exists = await this.checkCollectionExists(collectionName);
    if (!exists) {
      await this.createCollection(collectionName);
    }
  }

  // async generateFastEmbedding(text) {
  //   return new Promise((resolve, reject) => {
  //     console.log("Generating fastText embedding for:", text);

  //     const pythonExecutable = path.join(
  //       process.cwd(),
  //       "venv",
  //       "bin",
  //       "python.exe"
  //     );
  //     const scriptPath = path.join(process.cwd(), "src/scripts", "script.py");
  //     const pythonProcess = spawn("python3", [scriptPath, text]);

  //     let output = "";
  //     let errorOutput = "";

  //     pythonProcess.stdout.on("data", (data) => {
  //       output += data.toString();
  //     });

  //     pythonProcess.stderr.on("data", (data) => {
  //       errorOutput += data.toString();
  //     });

  //     pythonProcess.on("close", (code) => {
  //       if (code === 0) {
  //         const vector = Array.from(
  //           new Float32Array(output.trim().split(",").map(parseFloat))
  //         );
  //         resolve(vector);
  //       } else {
  //         reject(
  //           new Error(
  //             `Python script exited with code ${code}: ${errorOutput.trim()}`
  //           )
  //         );
  //       }
  //     });
  //   });
  // }

  async generateFastEmbedding(text) {
    return new Promise((resolve, reject) => {
      console.log("Generating fastText embedding for:", text);

      const scriptPath = path.join(process.cwd(), "src/scripts", "script.py");

      const pythonProcess = spawn("python", [scriptPath, text]);

      let output = "";

      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          const vector = Array.from(
            new Float32Array(output.trim().split(",").map(parseFloat))
          );

          resolve(vector);
        } else {
          reject(
            new Error(
              `Python script exited with code ${code}: ${errorOutput.trim()}`
            )
          );
        }
      });
    });
  }

  async getFastEmbedding(text) {
    try {
      console.log("Fetching embedding");
      const response = await fetch(
        `${process.env.PYTHON_EMBED_API}/${encodeURIComponent(text)}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding[0];
    } catch (error) {
      console.error("Error fetching embedding:", error);
      throw error;
    }
  }

  async insertData(collectionName, text) {
    try {
      console.log("Inserting data into Qdrant:", collectionName, text);
      await this.ensureUserCollection(collectionName);
      //Generate vector embeddings
      const embedding = await this.getFastEmbedding(text);
      const cleanVector = embedding.map((v) => (isNaN(v) ? 0 : v));
      const timestamp = new Date();

      const points = [
        {
          id: Date.now(),
          vector: cleanVector,
          payload: { text, timestamp },
        },
      ];
      console.log("Inserting data into collection:", collectionName);

      const response = await axios.put(
        `${this.QDRANT_URL}/collections/${collectionName}/points`,
        { points },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.QDRANT_API_KEY}`,
          },
        }
      );

      const data = await response.data;
      if (response.status !== 200) {
        console.error("Error inserting data:", data);
        return data;
      }
      console.log("Data inserted successfully:");
      return data;
    } catch (error) {
      console.error("Error inserting data:", error);
      return { error: error.message };
    }
  }

  async searchQdrant(collectionName, query, top = 3, filter = null) {
    try {
      top = parseInt(this.QDRANT_SEARCH_RESULT_COUNT);
      await this.ensureUserCollection(collectionName);
      const queryEmbedding = await this.getFastEmbedding(query);
      if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        throw new Error("Invalid query embedding: Must be a non-empty array.");
      }
      console.log("Searching Qdrant :", collectionName);

      const cleanedVector = queryEmbedding.map((v) => (isNaN(v) ? 0 : v));
      const timestamp = new Date();
      const payload = {
        vector: cleanedVector,
        top,
        timestamp,
      };

      if (filter) {
        payload.filter = filter;
      }

      const countResponse = await axios.post(
        `${this.QDRANT_URL}/collections/${collectionName}/points/count`,
        { exact: true },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.QDRANT_API_KEY}`,
          },
        }
      );
      if (countResponse.data.result.count === 0) {
        console.log(
          `⚠️ No vectors in collection ${collectionName}, returning empty results.`
        );
        return [];
      }

      const response = await axios.post(
        `${this.QDRANT_URL}/collections/${collectionName}/points/search`,
        {
          vector: cleanedVector,
          top: top,
          with_payload: true,
        },
        { headers: { Authorization: `Bearer ${this.QDRANT_API_KEY}` } }
      );

      const sortedResults = response.data.result.sort((a, b) => {
        return new Date(b.payload.timestamp) - new Date(a.payload.timestamp);
      });

      // console.log("✅ Qdrant Data searched:", sortedResults);
      return sortedResults;
    } catch (error) {
      console.error(
        "❌ Error searching Qdrant:",
        error.response?.data || error.message
      );
      return null;
    }
  }
}
module.exports = qdrant;
