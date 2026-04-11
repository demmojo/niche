#!/usr/bin/env tsx
import * as fs from "fs";
import * as path from "path";
import { execSync, spawn } from "child_process";
import * as crypto from "crypto";

const TEST_DIR = path.resolve(process.cwd(), ".tmp", "sigkill-test");

function main() {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
  process.chdir(TEST_DIR);

  execSync("git init");
  execSync('git config user.email "test@example.com"');
  execSync('git config user.name "Test User"');
  fs.writeFileSync("initial.txt", "base state");
  execSync("git add .");
  execSync('git commit -m "Initial commit"');

  console.log("Starting a fake background process simulating `openspec start`...");
  
  // We'll write a small node script that stages an intent and then sleeps indefinitely
  const scriptContent = `
import { stageIntents } from "${path.resolve(process.cwd(), "../../scripts/openspec-cli/stage.js").replace(/\\/g, "/")}";
import { TerminalPresenter } from "${path.resolve(process.cwd(), "../../scripts/openspec-cli/presenter.js").replace(/\\/g, "/")}";

const presenter = new TerminalPresenter(true, true);
const intents = [
  { kind: "createFile", absolutePath: "${path.resolve(TEST_DIR, "sigkill.txt").replace(/\\/g, "/")}", content: "partial content" }
];

console.log("Staging...");
const { token, branchName } = stageIntents(intents, { nonInteractive: true, json: false } as any, presenter);
console.log("READY:" + branchName);

// Sleep forever to simulate a hang mid-generation
setTimeout(() => {}, 100000);
`;

  fs.writeFileSync("test-script.ts", scriptContent);

  const child = spawn("npx", ["tsx", "test-script.ts"], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    const out = data.toString();
    process.stdout.write(out);
    
    if (out.includes("READY:")) {
      const branchName = out.split("READY:")[1].trim();
      console.log(`Killing process simulating SIGKILL...`);
      child.kill("SIGKILL");

      setTimeout(() => {
        console.log("Checking git status...");
        const branches = execSync("git branch --list").toString();
        
        if (branches.includes(branchName)) {
          console.log(`✅ Success: Worktree branch ${branchName} preserved in isolation.`);
        } else {
          console.error("❌ Error: Worktree branch lost.");
          process.exit(1);
        }

        const baseFiles = fs.readdirSync(process.cwd());
        if (baseFiles.includes("sigkill.txt")) {
          console.error("❌ Error: Worktree file leaked into base branch.");
          process.exit(1);
        } else {
          console.log("✅ Success: Base branch remains uncorrupted.");
        }

        console.log("✅ Rollback stability test passed!");
        process.exit(0);
      }, 500);
    }
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(data);
  });
}

main();
