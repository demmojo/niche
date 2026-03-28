import { bench, describe } from "vitest";
import {
  calculateCosineSimilarity,
  fastL2NormalizeInPlace,
  calculateOrthogonalDistance,
} from "../../utils/scoringEngine";

describe("scoringEngine performance", () => {
  const vec1 = new Float32Array(768).fill(0).map(() => Math.random());
  const vec2 = new Float32Array(768).fill(0).map(() => Math.random());

  fastL2NormalizeInPlace(vec1);
  fastL2NormalizeInPlace(vec2);

  bench(
    "calculateCosineSimilarity",
    () => {
      calculateCosineSimilarity(vec1, vec2);
    },
    { time: 100 },
  );

  bench(
    "fastL2NormalizeInPlace",
    () => {
      const vec = new Float32Array(768).fill(0).map(() => Math.random());
      fastL2NormalizeInPlace(vec);
    },
    { time: 100 },
  );

  bench(
    "calculateOrthogonalDistance",
    () => {
      const scratchpad = new Float32Array(768);
      calculateOrthogonalDistance(vec1, vec2, scratchpad);
    },
    { time: 100 },
  );
});
