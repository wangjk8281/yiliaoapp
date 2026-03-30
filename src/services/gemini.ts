import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function chatWithAI(message: string, context?: any, apiKey?: string) {
  const client = apiKey ? new GoogleGenAI({ apiKey }) : ai;
  const systemInstruction = `你是一个专业的医疗AI助手，名为 MedDoc AI。
你的目标是辅助医生完成临床工作，包括生成病程记录、提取化验单指标、查询医疗知识库等。

核心逻辑：
1. **上下文感知**：如果用户选择了特定患者，你的回复应基于该患者的数据。
2. **意图路由**：
   - 如果用户询问药物用量、指南等，触发“知识库”模式，必须附带来源引用。
   - 如果用户要求写病历、查房记录，触发“文书生成”模式。
   - 如果用户上传化验单照片，触发“指标提取”模式。
3. **安全约束**：
   - 严禁直接下达医嘱。
   - 如果无法在知识库找到权威来源，必须添加警告：“该回答未匹配本地权威指南，仅供参考，请谨慎采纳。”
4. **格式要求**：使用 Markdown 格式，支持表格和加粗。`;

  const prompt = context 
    ? `当前患者上下文: ${JSON.stringify(context)}\n\n用户指令: ${message}`
    : message;

  const response = await client.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction,
      temperature: 0.7,
    }
  });

  return response.text;
}

export async function generateImage(prompt: string) {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate image.");
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}
