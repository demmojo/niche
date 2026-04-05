import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: "123" });
console.log(ai.batches.create.toString());
