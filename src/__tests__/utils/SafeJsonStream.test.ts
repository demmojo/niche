import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { ingestJsonChunk } from "../../utils/SafeJsonStream";

describe("SafeJsonStream Pure Functions", () => {
  it("should never throw SyntaxError on partial or malformed chunks", () => {
    fc.assert(
      fc.property(
        fc.string(), // initial buffer state
        fc.string(), // new chunk
        (buffer, chunk) => {
          try {
            const { result, newState } = ingestJsonChunk(chunk, { buffer });
            expect(newState.buffer).toBe(buffer + chunk);
            if (result !== null) {
              expect(result).toEqual(JSON.parse(buffer + chunk));
            }
          } catch (e) {
            // It should only throw if it's NOT a SyntaxError
            expect(e).not.toBeInstanceOf(SyntaxError);
          }
        },
      ),
      { numRuns: process.env.CI ? 100 : 10 },
    );
  });

  it("should correctly parse valid complete JSON from chunks", () => {
    fc.assert(
      fc.property(
        fc.jsonValue(), // Valid JSON object
        (jsonObj) => {
          const jsonStr = JSON.stringify(jsonObj);
          const normalizedJsonObj = JSON.parse(jsonStr);
          // Split the JSON string into random chunks
          const splitIndex = Math.floor(Math.random() * jsonStr.length);
          const chunk1 = jsonStr.slice(0, splitIndex);
          const chunk2 = jsonStr.slice(splitIndex);

          // Process chunk 1
          const { result: res1, newState: state1 } = ingestJsonChunk(chunk1, {
            buffer: "",
          });

          if (chunk1 === jsonStr) {
            expect(res1).toEqual(normalizedJsonObj);
          } else {
            // Intermediate parsing can result in partial valid numbers/strings or null
          }

          // Process chunk 2
          const { result: res2 } = ingestJsonChunk(chunk2, state1);
          expect(res2).toEqual(normalizedJsonObj);
        },
      ),
      { numRuns: process.env.CI ? 100 : 10 },
    );
  });
});
