import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({});
async function run() {
  const result = await ai.models.embedContent({
    model: "text-embedding-004",
    contents: "Hello world",
  });
  console.log(result.embeddings?.[0]?.values?.slice(0, 5));
}
run();
