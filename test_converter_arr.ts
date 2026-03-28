import { z } from "zod";
const a = z.array(z.string()).describe("A list");
console.log(a._def.type);
console.log(a.element._def.type);
