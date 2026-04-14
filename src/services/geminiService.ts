import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export const getGemini = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY not found in environment");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export const analyzeRisk = async (nome: string, servico: string) => {
  const ai = getGemini();
  if (!ai) return ["Erro: API Key não configurada"];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise os riscos para o fornecedor "${nome}" que presta o serviço de "${servico}". Forneça exatamente 3 marcadores de risco curtos e profissionais em português.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 150,
      }
    });

    const text = response.text || "";
    return text.split('\n').filter(line => line.trim()).slice(0, 3);
  } catch (error) {
    console.error("Gemini Error:", error);
    return ["Erro na análise de IA"];
  }
};

export const generateClause = async (data: any) => {
  const ai = getGemini();
  if (!ai) return "Erro: API Key não configurada";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Redija uma cláusula jurídica profissional em português para um contrato com os seguintes dados: ${JSON.stringify(data)}. O tom deve ser formal e jurídico.`,
      config: {
        temperature: 0.5,
      }
    });

    return response.text || "Erro ao gerar cláusula";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erro na geração de cláusula via IA";
  }
};
