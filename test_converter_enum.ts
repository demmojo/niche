import { z } from "zod";
const e = z.enum(["A", "B"]).describe("Letter");
console.log(e._def.type);
console.log(e.options);
