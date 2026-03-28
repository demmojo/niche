import { z } from "zod";
const b = z.boolean().describe("true/false");
console.log(b._def.type);
const n = z.number();
console.log(n._def.type);
