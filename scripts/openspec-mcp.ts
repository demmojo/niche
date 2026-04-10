#!/usr/bin/env tsx
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { CliOptionsSchema } from "./openspec-cli/schema.js";

// We'll import the business logic without exiting on error.
// We should probably mock process.exit or the presenter to capture output.
import { proposePlan } from "./openspec-cli/propose.js";
import { startFeature } from "./openspec-cli/start.js";
import { applyStaged, statusStaged } from "./openspec-cli/stage.js";
import { archiveFeature } from "./openspec-cli/archive.js";
import { TerminalPresenter } from "./openspec-cli/presenter.js";

const server = new Server(
  {
    name: "openspec-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

const OpenSpecStageArgs = z.object({
  command: z
    .enum(["propose", "start", "archive"])
    .describe("The openspec command to stage"),
  featureNameOrPlanPath: z
    .string()
    .describe("The feature name or path to plan"),
  force: z
    .boolean()
    .optional()
    .describe("Whether to bypass staging (force apply)"),
});

const OpenSpecApplyArgs = z.object({
  token: z.string().describe("The commit token to apply"),
  force: z
    .boolean()
    .optional()
    .describe("Force apply regardless of TOCTOU drift"),
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "openspec_stage",
        description:
          "Stage an OpenSpec mutative command (propose, start, archive)",
        inputSchema: {
          type: "object",
          properties: {
            command: { type: "string", enum: ["propose", "start", "archive"] },
            featureNameOrPlanPath: { type: "string" },
            force: { type: "boolean" },
          },
          required: ["command", "featureNameOrPlanPath"],
        },
      },
      {
        name: "openspec_apply",
        description: "Apply a staged OpenSpec intent using its token",
        inputSchema: {
          type: "object",
          properties: {
            token: { type: "string" },
            force: { type: "boolean" },
          },
          required: ["token"],
        },
      },
      {
        name: "openspec_status",
        description: "List pending staged OpenSpec tokens",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// A hack to capture output from the CLI logic instead of printing to stdout
async function runWithCapturedStdout(fn: () => Promise<void>): Promise<string> {
  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);

  let captured = "";
  process.stdout.write = (
    chunk: string | Uint8Array,
    encoding?: any,
    cb?: any,
  ) => {
    captured += chunk.toString();
    return true;
  };
  process.stderr.write = (
    chunk: string | Uint8Array,
    encoding?: any,
    cb?: any,
  ) => {
    captured += chunk.toString();
    return true;
  };

  const originalExit = process.exit;
  process.exit = ((code?: number) => {
    throw new Error(`Process exited with code ${code}`);
  }) as any;

  try {
    await fn();
  } catch (error: any) {
    captured += `\nError: ${error.message}`;
  } finally {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    process.exit = originalExit;
  }

  return captured;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "openspec_stage": {
      const args = OpenSpecStageArgs.parse(request.params.arguments);
      const output = await runWithCapturedStdout(async () => {
        const opts = CliOptionsSchema.parse({
          nonInteractive: true,
          json: true,
          stage: true,
          force: args.force || false,
        });

        if (args.command === "propose") {
          await proposePlan(args.featureNameOrPlanPath, opts);
        } else if (args.command === "start") {
          await startFeature(args.featureNameOrPlanPath, opts);
        } else if (args.command === "archive") {
          await archiveFeature(args.featureNameOrPlanPath, opts);
        }
      });
      return {
        content: [{ type: "text", text: output }],
      };
    }
    case "openspec_apply": {
      const args = OpenSpecApplyArgs.parse(request.params.arguments);
      const output = await runWithCapturedStdout(async () => {
        const opts = CliOptionsSchema.parse({
          nonInteractive: true,
          json: true,
          token: args.token,
          force: args.force || false,
        });
        await applyStaged(opts);
      });
      return {
        content: [{ type: "text", text: output }],
      };
    }
    case "openspec_status": {
      const output = await runWithCapturedStdout(async () => {
        const opts = CliOptionsSchema.parse({
          nonInteractive: true,
          json: true,
        });
        await statusStaged(opts);
      });
      return {
        content: [{ type: "text", text: output }],
      };
    }
    default:
      throw new Error(`Tool not found: ${request.params.name}`);
  }
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OpenSpec MCP server running on stdio");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
