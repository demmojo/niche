import { Response } from "express";
import { ByokRequest } from "./byokMiddleware";
import { LLMPenaltyBox, Provider as LLMProvider } from "./LLMPenaltyBox";
import { streamText, createDataStreamResponse } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const penaltyBox = LLMPenaltyBox.getInstance();

export async function generateContentStreamHandler(
  req: ByokRequest,
  res: Response,
) {
  try {
    const { model, params } = req.body;

    // We only explicitly support Gemini here as requested for the MVP, but you can add others
    const provider: LLMProvider = "gemini";

    if (!penaltyBox.canAttempt(provider)) {
      return res
        .status(503)
        .json({
          error: `Provider ${provider} is currently in the Penalty Box due to repeated failures.`,
        });
    }

    const key = req.llmApiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("No Gemini API key available.");

    const google = createGoogleGenerativeAI({
      apiKey: key,
    });

    // Handle early disconnect and pass abort signal
    const abortController = new AbortController();
    req.on("close", () => {
      abortController.abort();
    });

    let totalChunksSent = 0;

    return createDataStreamResponse({
      execute: (dataStream) => {
        const stream = streamText({
          model: google(model),
          messages: [{ role: "user", content: params.contents }],
          abortSignal: abortController.signal,
          onChunk: (event) => {
            totalChunksSent++;
            // Enforce chunk segmentation if length > 64KB
            const chunkStr = event.chunk.textDelta;
            if (chunkStr && chunkStr.length > 32000) {
              // ~64KB
              // For safe chunking without corrupting UTF-8 or JSON, we just write the safe parts
              // or let Vercel AI SDK handle the JSON encoding mathematically via dataStream
              // dataStream.writeData automatically stringifies and manages encoding.
              let offset = 0;
              while (offset < chunkStr.length) {
                const slice = chunkStr.slice(offset, offset + 32000);
                dataStream.writeMessageAnnotation({
                  type: "chunk-segmented",
                  text: slice,
                });
                offset += 32000;
              }
            }
          },
          onFinish: () => {
            penaltyBox.recordResult(provider, 200);
          },
        });

        // Error handling inside the stream execution
        stream
          .mergeIntoDataStream(dataStream, {
            sendReasoning: true,
          })
          .catch((err) => {
            dataStream.writeMessageAnnotation({
              error: err.name === "AbortError" ? "ABORTED" : "STREAM_FAILED",
              message: err.message,
            });
            if (err.name === "AbortError") {
              // Early disconnect heuristic for refund (< 10 chunks as a heuristic)
              if (totalChunksSent < 10) {
                // Refund logic here (pseudo-code, integrate with your credit system)
                // refundCredit(req.user.uid);
              }
            } else {
              penaltyBox.recordResult(provider, 500);
            }
          });
      },
    })(req, res);
  } catch (error: any) {
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
}
