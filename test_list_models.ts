import * as dotenv from "dotenv";
dotenv.config();

async function run() {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models?key=" +
      process.env.GEMINI_API_KEY,
  );
  const data = await response.json();
  console.log(data.models.map((m: any) => m.name));
}
run();
