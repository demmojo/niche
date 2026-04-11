import { vi } from "vitest";
const mock = vi.fn().mockResolvedValue(true);
console.log(await mock());
console.log(await mock());
