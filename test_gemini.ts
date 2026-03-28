import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'What is the latest news about Typeform?',
    config: {
      tools: [{ googleSearch: {} }],
    }
  });
  console.log(JSON.stringify(response.candidates?.[0]?.groundingMetadata, null, 2));
}
test().catch(console.error);
