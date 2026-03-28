import dotenv from "dotenv";
dotenv.config();

async function run() {
  const exaKey =
    process.env.EXA_API_KEY || process.env.VITE_EXA_API_KEY_SECONDARY;
  console.log("Exa Key exists:", !!exaKey);
  if (!exaKey) return;
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": exaKey,
    },
    body: JSON.stringify({
      query: "Notion and Airtable competitors features",
      numResults: 2,
      useAutoprompt: true,
    }),
  });
  console.log("Exa Status:", res.status);
  const data = await res.json();
  console.log("Exa Response:", JSON.stringify(data, null, 2));
}
run().catch(console.error);
