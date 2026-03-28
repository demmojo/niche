const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

const API_URL =
  process.env.NICHE_API_URL || "http://localhost:3000/api/webhooks/telemetry";
const PRODUCT_ID = process.env.NICHE_PRODUCT_ID || "demo-product-1";

function parseTasks(content) {
  const lines = content.split("\n");
  const updates = [];

  lines.forEach((line) => {
    // Match Markdown checkbox tasks: - [x] 1.1 Add dark mode feature-id:frontend-dark-mode
    const match = line.match(
      /^\s*-\s*\[([xX ])\]\s*(.*?)(?:\s*feature-id:([a-zA-Z0-9_-]+))?$/,
    );
    if (match) {
      const isChecked = match[1].toLowerCase() === "x";
      const text = match[2].trim();
      const featureId = match[3];

      updates.push({
        taskId: text,
        status: isChecked ? "completed" : "pending",
        featureId: featureId || null,
        productId: PRODUCT_ID,
      });
    }
  });

  return updates;
}

function sendTelemetry(update) {
  const url = new URL(API_URL);
  const client = url.protocol === "https:" ? https : http;

  const data = JSON.stringify(update);

  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  };

  const req = client.request(options, (res) => {
    if (res.statusCode === 200) {
      console.log(
        `[SUCCESS] Synced: ${update.taskId.substring(0, 30)}... -> ${update.status}`,
      );
    } else {
      console.error(
        `[ERROR] Failed to sync ${update.taskId.substring(0, 30)}... (Status: ${res.statusCode})`,
      );
    }
  });

  req.on("error", (error) => {
    console.error(`[NETWORK ERROR] Could not reach NicheAI: ${error.message}`);
  });

  req.write(data);
  req.end();
}

function main() {
  const taskFile = process.argv[2] || "tasks.md";
  const filePath = path.resolve(process.cwd(), taskFile);

  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const updates = parseTasks(content);

  if (updates.length === 0) {
    console.log("[INFO] No tasks found in file.");
    return;
  }

  console.log(
    `[INFO] Found ${updates.length} tasks. Syncing with NicheAI Dashboard...`,
  );

  updates.forEach((update) => {
    if (update.status === "completed") {
      sendTelemetry(update);
    }
  });
}

main();
