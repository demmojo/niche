const { GoogleGenAI } = require("@google/genai");
console.log(Object.keys(GoogleGenAI.prototype));
const ai = new GoogleGenAI({ apiKey: "DUMMY" });
console.log(Object.keys(ai.models));
