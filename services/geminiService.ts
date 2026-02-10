
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Analyzes an incident description using Google Gemini AI.
 * Follows the latest @google/genai guidelines.
 */
export async function analyzeIncident(description: string) {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    console.error("Gemini API Key is missing or undefined. skipping AI analysis.");
    return null;
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analitza la següent descripció d'un incident i classifica'l segons el protocol LOPIVI. 
      Descripció: "${description}"`,
      config: {
        systemInstruction: "Ets un expert en protecció de menors (Delegat de Protecció). Analitza la descripció i suggereix quins tipus de violència s'identifiquen i quina seria la gravetat inicial segons el protocol (Lleu/Greu). Respon en format JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTypes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Tipus de violència detectats (Física, Psicològica, Sexual, etc.)"
            },
            severity: {
              type: Type.STRING,
              description: "Gravetat suggerida: Lleu o Greu"
            },
            reasoning: {
              type: Type.STRING,
              description: "Breu explicació de l'anàlisi"
            },
            immediateActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Accions immediates recomanades"
            }
          },
          required: ["suggestedTypes", "severity", "reasoning"]
        }
      }
    });

    // Fix: Safely access the .text property as per guidelines
    const jsonStr = response.text?.trim();
    if (!jsonStr) {
      console.warn("Gemini returned an empty response.");
      return null;
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error analyzing incident with Gemini:", error);
    return null;
  }
}
