import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, model = "gemini-2.0-flash" } = req.body;
  const apiKey = process.env.AIHUBMIX_API_KEY;

  if (!apiKey) {
    console.error("AIHUBMIX_API_KEY is missing in environment");
    return res.status(500).json({ error: "AIHUBMIX_API_KEY not configured. Please add it to Vercel Environment Variables." });
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
}
