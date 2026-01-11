import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using Flash for speed

export async function summarizeText(text: string, subject?: string, from?: string) {
    try {
        const prompt = `
      Você é um assistente de e-mail inteligente. 
      Resuma o seguinte e-mail de forma concisa (máximo 2 sentenças), focando no objetivo principal e em qualquer ação necessária.
      
      Assunto: ${subject || "N/A"}
      De: ${from || "N/A"}
      Conteúdo: ${text.substring(0, 5000)} ...
      
      Resumo:
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        throw error;
    }
}
