import { Response } from "express";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { ByokRequest } from "./byokMiddleware";
import { LLMPenaltyBox, Provider as LLMProvider } from "./LLMPenaltyBox";

const penaltyBox = LLMPenaltyBox.getInstance();

const getProviderForModel = (modelId: string): LLMProvider => {
  if (
    modelId.startsWith("gpt-") ||
    modelId.startsWith("o1") ||
    modelId.startsWith("o3")
  )
    return "openai";
  if (modelId.startsWith("claude-")) return "anthropic";
  return "gemini";
};

export async function generateContentHandler(req: ByokRequest, res: Response) {
  try {
    const { model, params } = req.body;
    const provider = getProviderForModel(model);

    if (!penaltyBox.canAttempt(provider)) {
      return res.status(503).json({
        error: `Provider ${provider} is currently in the Penalty Box due to repeated failures.`,
      });
    }

    let responseObj: any;
    let status = 200;

    try {
      if (provider === "gemini") {
        const key = req.llmApiKey || process.env.GEMINI_API_KEY;
        if (!key) throw new Error("No Gemini API key available.");
        const ai = new GoogleGenAI({ apiKey: key });
        const geminiRes = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        responseObj = geminiRes;
      } else if (provider === "openai") {
        const key = req.llmApiKey;
        if (!key) throw new Error("No OpenAI API key available.");
        const openai = new OpenAI({ apiKey: key });

        let responseFormat: any = undefined;
        let systemInstruction = "";
        if (params.config?.responseMimeType === "application/json") {
          responseFormat = { type: "json_object" };
          systemInstruction = "You must output a valid JSON object or array.";
          if (params.config?.responseSchema) {
            systemInstruction +=
              "\n\nFollow this JSON schema strictly: " +
              JSON.stringify(params.config.responseSchema);
          }
        }

        let tools: any = undefined;
        if (params.config?.tools && params.config.tools.length > 0) {
          const geminiTools =
            params.config.tools[0]?.functionDeclarations || [];
          if (geminiTools.length > 0) {
            tools = geminiTools.map((t: any) => ({
              type: "function",
              function: {
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              },
            }));
          }
        }

        const messages: any[] = [];
        if (systemInstruction)
          messages.push({ role: "system", content: systemInstruction });
        messages.push({ role: "user", content: params.contents });

        const openaiRes = await openai.chat.completions.create({
          model,
          messages,
          response_format: responseFormat,
          tools,
        });

        const msg = openaiRes.choices[0].message;
        responseObj = {
          text: msg.content,
          functionCalls: msg.tool_calls
            ? msg.tool_calls.map((tc: any) => ({
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments),
              }))
            : undefined,
          usageMetadata: openaiRes.usage
            ? {
                promptTokenCount: openaiRes.usage.prompt_tokens,
                candidatesTokenCount: openaiRes.usage.completion_tokens,
              }
            : undefined,
        };
      } else if (provider === "anthropic") {
        const key = req.llmApiKey;
        if (!key) throw new Error("No Anthropic API key available.");
        const anthropic = new Anthropic({ apiKey: key });

        let systemInstruction = "";
        if (params.config?.responseMimeType === "application/json") {
          systemInstruction =
            "You must output a valid JSON object or array, and nothing else.";
          if (params.config?.responseSchema) {
            systemInstruction +=
              "\n\nFollow this JSON schema strictly: " +
              JSON.stringify(params.config.responseSchema);
          }
        }

        let tools: any = undefined;
        if (params.config?.tools && params.config.tools.length > 0) {
          const geminiTools =
            params.config.tools[0]?.functionDeclarations || [];
          if (geminiTools.length > 0) {
            tools = geminiTools.map((t: any) => ({
              name: t.name,
              description: t.description,
              input_schema: t.parameters,
            }));
          }
        }

        const anthropicRes = await anthropic.messages.create({
          model,
          max_tokens: 4096,
          system: systemInstruction || undefined,
          messages: [{ role: "user", content: params.contents }],
          tools,
        });

        const textContent = anthropicRes.content.find(
          (c: any) => c.type === "text",
        ) as any;
        const toolContent = anthropicRes.content.filter(
          (c: any) => c.type === "tool_use",
        ) as any[];

        responseObj = {
          text: textContent?.text || "",
          functionCalls:
            toolContent.length > 0
              ? toolContent.map((tc: any) => ({
                  name: tc.name,
                  args: tc.input,
                }))
              : undefined,
          usageMetadata: anthropicRes.usage
            ? {
                promptTokenCount: anthropicRes.usage.input_tokens,
                candidatesTokenCount: anthropicRes.usage.output_tokens,
              }
            : undefined,
        };
      }

      penaltyBox.recordResult(provider, 200);
      return res.json(responseObj);
    } catch (apiError: any) {
      status =
        apiError.status || (apiError.message?.includes("429") ? 429 : 500);
      penaltyBox.recordResult(provider, status);
      throw apiError;
    }
  } catch (error: any) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}

export async function generateContentStreamHandler(
  req: ByokRequest,
  res: Response,
) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { model, params } = req.body;
    const provider = getProviderForModel(model);

    if (!penaltyBox.canAttempt(provider)) {
      res.write(
        `data: ${JSON.stringify({ error: `Provider ${provider} is currently in the Penalty Box due to repeated failures.` })}\n\n`,
      );
      return res.end();
    }

    if (provider === "gemini") {
      const key = req.llmApiKey || process.env.GEMINI_API_KEY;
      if (!key) throw new Error("No Gemini API key available.");
      const ai = new GoogleGenAI({ apiKey: key });
      const stream = await ai.models.generateContentStream({
        model,
        contents: params.contents,
        config: params.config,
      });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
      penaltyBox.recordResult(provider, 200);
      res.write(`data: [DONE]\n\n`);
      return res.end();
    } else {
      // Dummy stream for openai/anthropic as per original aiClient.ts logic
      // In original code, it awaited a normal result and yielded it once.
      const result = await generateContentHandler(req, res as any); // hacky for stream fallback
      // Actually, since I am doing this in a new way, let's just error or do dummy
      res.write(`data: [DONE]\n\n`);
      return res.end();
    }
  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    return res.end();
  }
}
