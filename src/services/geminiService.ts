export const generateMedicalDocument = async (patientData: any, inputContent: string, docType: string) => {
  const prompt = `
    你是一个专业的医疗AI助手。请根据以下患者数据和医生输入的内容，生成一份结构化的${docType}。
    
    患者基础数据:
    ${JSON.stringify(patientData, null, 2)}
    
    医生输入/转写内容:
    ${inputContent}
    
    要求:
    1. 严格遵守卫健委病历书写规范。
    2. 输出格式为结构化的JSON，包含各个必填字段。
    3. 术语使用规范，符合ICD-10标准。
    4. 如果输入信息不足，请在JSON中标记缺失项。
    
    输出示例格式:
    {
      "title": "入院记录",
      "sections": [
        { "title": "主诉", "content": "..." },
        { "title": "现病史", "content": "..." }
      ],
      "quality_check": [
        { "field": "过敏史", "status": "missing", "message": "未提及药物过敏史" }
      ]
    }
  `;

  try {
    const response = await fetch("/api/generate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: "gemini-2.0-flash" })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown backend error" }));
      throw new Error(errorData.error || errorData.details || "Backend text generation failed");
    }
    const data = await response.json();
    return JSON.parse(data.text || "{}");
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    alert("生成失败: " + error.message);
    return null;
  }
};

export const performQualityCheck = async (content: string) => {
  const prompt = `
    请对以下医疗文书内容进行实时质控校验。
    
    文书内容:
    ${content}
    
    请从以下维度进行检查:
    1. 完整性 (必填字段是否缺失)
    2. 逻辑一致性 (症状-诊断-用药匹配性)
    3. 规范性 (符合书写规范)
    4. 药物安全性 (过敏史/禁忌症)
    
    输出格式为JSON数组:
    [
      { "dimension": "完整性", "issue": "主诉缺失时间维度", "severity": "P1", "suggestion": "请补充症状持续时长" }
    ]
  `;

  try {
    const response = await fetch("/api/generate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, model: "gemini-2.0-flash" })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown backend error" }));
      throw new Error(errorData.error || errorData.details || "Backend QC check failed");
    }
    const data = await response.json();
    return JSON.parse(data.text || "[]");
  } catch (error: any) {
    console.error("AI QC Error:", error);
    return [];
  }
};
