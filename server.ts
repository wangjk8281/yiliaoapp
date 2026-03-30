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

  // API Route for Image Generation (Proxy to AIHubMix)
  app.post("/api/generate-image", async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.AIHUBMIX_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "AIHUBMIX_API_KEY is not configured." });
    }

    try {
      const response = await fetch("https://aihubmix.com/gemini/v1beta/models/gemini-3.1-flash-image-preview:generateContent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1k"
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("AIHubMix Error:", errorData);
        return res.status(response.status).json({ error: "Failed to generate image from AIHubMix." });
      }

      const data = await response.json();
      
      // Extract the image data from the response
      // The Gemini API response structure for multimodal content:
      // candidates[0].content.parts[i].inlineData.data (base64)
      
      let base64Image = null;
      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith("image/")) {
            base64Image = part.inlineData.data;
            break;
          }
        }
      }

      if (base64Image) {
        res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
      } else {
        res.status(404).json({ error: "No image found in AI response." });
      }
    } catch (error) {
      console.error("Server Error:", error);
      res.status(500).json({ error: "Internal server error during image generation." });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
