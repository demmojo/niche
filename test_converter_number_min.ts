import { z } from "zod";
const num = z.number().min(1).max(5);
console.log(num._def.type);
console.log(num._def.checks);
