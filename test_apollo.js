import dotenv from "dotenv";
dotenv.config();
async function run() {
  const apiKey = process.env.APOLLO_API_KEY;
  console.log("Key exists?", !!apiKey);
  if (!apiKey) return;
  const res = await fetch(
    "https://api.apollo.io/v1/organizations/enrich?domain=tally.so",
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
    },
  );
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text.substring(0, 100));
}
run();
