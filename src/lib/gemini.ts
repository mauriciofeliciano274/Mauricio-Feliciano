import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getRideSupport(message: string, history: { role: string, text: string }[]) {
  const model = "gemini-3-flash-preview";
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: "Você é o assistente de suporte do VaptVupt, um app de transporte. Seja prestativo, educado e ajude passageiros e motoristas com dúvidas sobre corridas, pagamentos e segurança. Se necessário, use a busca do Google para informações atualizadas sobre trânsito ou locais.",
      tools: [{ googleSearch: {} }],
      toolConfig: { includeServerSideToolInvocations: true }
    },
    history: history.map(h => ({ role: h.role, parts: [{ text: h.text }] }))
  });

  const result = await chat.sendMessage({ message });
  return result.text;
}

export async function getPriceEstimate(pickup: string, destination: string) {
  const model = "gemini-3.1-flash-lite-preview";
  const prompt = `Estime o preço de uma corrida de Uber de "${pickup}" para "${destination}" em Reais (BRL). Retorne apenas um número aproximado.`;
  
  const result = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          estimatedPrice: { type: Type.NUMBER }
        },
        required: ["estimatedPrice"]
      }
    }
  });
  
  try {
    const data = JSON.parse(result.text);
    return data.estimatedPrice;
  } catch (e) {
    return 25.0; // Fallback
  }
}
