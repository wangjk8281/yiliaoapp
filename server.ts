import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AIHUBMIX Proxy - Image Generation
  app.post("/api/generate-image", async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.AIHUBMIX_API_KEY;

    if (!apiKey) {
      console.error("AIHUBMIX_API_KEY is missing in environment");
      return res.status(500).json({ error: "AIHUBMIX_API_KEY not configured. Please add it to Settings -> Secrets." });
    }

    try {
      const response = await fetch("https://aihubmix.com/gemini/v1beta/models/gemini-1.5-flash:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt || "draw a tree" }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: { aspectRatio: "1:1", imageSize: "1k" },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AIHUBMIX Image API Error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: "AIHUBMIX API failed", details: errorText });
      }

      const data = await response.json();
      const candidates = data.candidates || [];
      const parts = candidates[0]?.content?.parts || [];
      const imagePart = parts.find((p: any) => p.inlineData);

      if (imagePart) {
        res.json({ 
          imageUrl: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`,
          text: parts.find((p: any) => p.text)?.text || ""
        });
      } else {
        res.status(404).json({ error: "No image generated in response" });
      }
    } catch (error: any) {
      console.error("Proxy Error (Image):", error);
      res.status(500).json({ error: "Internal server error during image generation", message: error.message });
    }
  });

  // API Route for AIHUBMIX Proxy - Text Generation (Medical Document)
  app.post("/api/generate-text", async (req, res) => {
    const { prompt, model = "gemini-2.0-flash" } = req.body;
    const apiKey = process.env.AIHUBMIX_API_KEY;

    if (!apiKey) {
      console.error("AIHUBMIX_API_KEY is missing in environment");
      return res.status(500).json({ error: "AIHUBMIX_API_KEY not configured. Please add it to Settings -> Secrets." });
    }

    try {
      const response = await fetch(`https://aihubmix.com/gemini/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AIHUBMIX Text API Error (${response.status}):`, errorText);
        return res.status(response.status).json({ error: "AIHUBMIX Text API failed", details: errorText });
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        return res.status(500).json({ error: "AIHUBMIX returned no text content" });
      }

      res.json({ text });
    } catch (error: any) {
      console.error("Proxy Error (Text):", error);
      res.status(500).json({ error: "Internal server error during text generation", message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Resolve the built assets relative to this file so startup does not depend on the shell cwd.
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
