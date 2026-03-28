import { z } from "zod";
const str = z.string();
console.log(str._def.type);
const arr = z.array(z.string());
console.log(arr._def.type);
const opt = z.string().optional();
console.log(opt._def.type);
