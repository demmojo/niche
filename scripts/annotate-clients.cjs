const fs = require('fs');

const geminiPath = 'src/utils/geminiClient.ts';
let gcContent = fs.readFileSync(geminiPath, 'utf8');

const gcDocs = `/**
 * A resilient client wrapper for the Google GenAI (Gemini) SDK.
 * 
 * @description
 * This client manages multiple API keys, automatic model fallbacks, rate limiting, and
 * structured JSON extraction. It uses an exponential backoff retry mechanism to ensure
 * requests succeed even under heavy load.
 * 
 * @example
 * \`\`\`ts
 * const result = await withKeyRotation(
 *   async () => await model.generateContent(prompt),
 *   {
 *     modelType: 'pro',
 *     keys: [key1, key2],
 *     fallbackToLite: true
 *   }
 * );
 * \`\`\`
 * 
 * @throws {Error} Throws \`Error\` if all retries and fallbacks fail, or if a \`429 Rate Limit\`
 * is hit and \`fallbackToLite\` is disabled.
 */
export async function withKeyRotation<T>(`;

gcContent = gcContent.replace("export async function withKeyRotation<T>(", gcDocs);
fs.writeFileSync(geminiPath, gcContent);


const aiClientPath = 'src/utils/aiClient.ts';
let acContent = fs.readFileSync(aiClientPath, 'utf8');

const acDocs = `/**
 * The central AI abstraction layer orchestrating requests across multiple providers.
 * 
 * @description
 * Exposes a unified API for generating structured content, SWOT analysis, and chats,
 * hiding the underlying SDK complexities (OpenAI, Gemini, Anthropic) from the UI.
 * 
 * @example
 * \`\`\`ts
 * const swot = await getAutoSwot(competitorData, options);
 * \`\`\`
 * 
 * @throws {Error} Throws if the requested provider is missing an API key, or if the
 * underlying network request (e.g. Gemini \`504 Timeout\`) fails.
 */
export const getAutoSwot = async (`;

acContent = acContent.replace("export const getAutoSwot = async (", acDocs);
fs.writeFileSync(aiClientPath, acContent);

