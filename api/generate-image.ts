import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  const apiKey = process.env.AIHUBMIX_API_KEY;

  if (!apiKey) {
    console.error("AIHUBMIX_API_KEY is missing in environment");
    return res.status(500).json({ error: "AIHUBMIX_API_KEY not configured. Please add it to Vercel Environment Variables." });
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
}
