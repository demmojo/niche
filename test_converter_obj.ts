import { z } from "zod";
const obj = z.object({ a: z.string() });
console.log(typeof obj.shape);
console.log(obj.shape.a._def.type);
