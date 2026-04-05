import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import { Command } from "commander";
import { z } from "zod";
import { enqueueTask } from "../src/server/cloudTasks.js";

// Minimal presenter mimicking TerminalPresenter to avoid TS errors
class TerminalPresenter {
  constructor(private isJson: boolean = false) {}
  log(msg: string) {
    if (!this.isJson) console.log(msg);
    else console.error(msg);
  }
  error(msg: string) {
    console.error(msg);
  }
  success(msg: string) {
    if (!this.isJson) console.log(`✅ ${msg}`);
    else console.log(JSON.stringify({ status: "success", msg }));
  }
  fail(msg: string) {
    if (!this.isJson) console.error(`❌ ${msg}`);
    else console.error(JSON.stringify({ status: "error", msg }));
    process.exit(1);
  }
}

const ConfigSchema = z
  .object({
    file: z.string().optional(),
    sitemap: z.string().optional(),
    queue: z.string().default("marketIntelligence"),
    workerUrl: z.string().default("/api/workers/static-crawler"),
    json: z.boolean().default(false),
    dryRun: z.boolean().default(false),
    projectId: z.string().default("demo-nicheai"),
    location: z.string().default("us-central1"),
  })
  .refine((data) => data.file || data.sitemap, {
    message: "Must provide either --file or --sitemap",
  });

export function hashDomain(urlStr: string): string {
  try {
    const url = new URL(
      urlStr.startsWith("http") ? urlStr : `https://${urlStr}`,
    );
    const domain = url.hostname.replace(/^www\./, "");
    return crypto.createHash("md5").update(domain).digest("hex");
  } catch (e) {
    return crypto.createHash("md5").update(urlStr).digest("hex");
  }
}

export async function parseSitemap(xmlString: string): Promise<string[]> {
  const urls: string[] = [];
  const regex = /<loc>(.*?)<\/loc>/g;
  let match;
  while ((match = regex.exec(xmlString)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

export async function processSeedUrls(
  urls: string[],
  mockCreateTask: (request: any) => Promise<any>,
  config: {
    projectId: string;
    location: string;
    queue: string;
    workerUrl: string;
  },
) {
  // Track the next available delay per domain hash to stagger them
  const domainDelays = new Map<string, number>();

  // Base delay parameters
  const STAGGER_SECONDS = 10; // offset each URL on the same domain by 10s

  for (const url of urls) {
    const hash = hashDomain(url);
    const currentDelay = domainDelays.get(hash) || 0;

    // scheduleTime in seconds from epoch
    const scheduleTimeSeconds = Math.floor(Date.now() / 1000) + currentDelay;

    const task = {
      httpRequest: {
        httpMethod: "POST",
        url: config.workerUrl,
        body: Buffer.from(JSON.stringify({ domain: url })).toString("base64"),
        headers: {
          "Content-Type": "application/json",
        },
      },
      scheduleTime: {
        seconds: scheduleTimeSeconds,
      },
    };

    const parent = `projects/${config.projectId}/locations/${config.location}/queues/${config.queue}`;

    await mockCreateTask({
      parent,
      task,
    });

    // Stagger the next one for this domain
    domainDelays.set(hash, currentDelay + STAGGER_SECONDS);
  }
}

async function main() {
  const program = new Command();

  program
    .name("seed-domains")
    .description(
      "Parse XML sitemaps and canonical URLs, dispatching them to Cloud Tasks.",
    )
    .option("-f, --file <path>", "Path to a text file with one URL per line")
    .option("-s, --sitemap <path>", "Path to an XML sitemap file")
    .option(
      "-q, --queue <name>",
      "Cloud Tasks queue name",
      "marketIntelligence",
    )
    .option(
      "-w, --worker-url <path>",
      "Worker endpoint path",
      "/api/workers/static-crawler",
    )
    .option("--json", "Output JSON", false)
    .option("--dry-run", "Dry run (do not dispatch)", false)
    .parse(process.argv);

  const opts = program.opts();
  const presenter = new TerminalPresenter(opts.json);

  const parsed = ConfigSchema.safeParse(opts);
  if (!parsed.success) {
    presenter.fail(`Invalid arguments: ${parsed.error.message}`);
    return;
  }

  const config = parsed.data;
  let urls: string[] = [];

  try {
    if (config.file) {
      const content = await fs.readFile(path.resolve(config.file), "utf-8");
      urls = content
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    } else if (config.sitemap) {
      const content = await fs.readFile(path.resolve(config.sitemap), "utf-8");
      urls = await parseSitemap(content);
    }
  } catch (err: any) {
    presenter.fail(`Failed to read input file: ${err.message}`);
    return;
  }

  if (urls.length === 0) {
    presenter.fail("No URLs found in input");
    return;
  }

  presenter.log(`Found ${urls.length} URLs. Dispatching...`);

  try {
    // For the actual execution, we provide an adapter to `enqueueTask`
    const realCreateTask = async (request: any) => {
      if (config.dryRun) {
        presenter.log(
          `[DRY RUN] Would enqueue ${request.task.httpRequest.url} to ${request.parent} with scheduleTime ${request.task.scheduleTime.seconds}`,
        );
        return;
      }

      // Calculate delay based on scheduleTime
      const nowSeconds = Math.floor(Date.now() / 1000);
      const delaySeconds = Math.max(
        0,
        request.task.scheduleTime.seconds - nowSeconds,
      );

      // Note: we extract `domain` instead of `url` because the worker expects `{ domain: string }`
      // Wait, `processSeedUrls` currently packs `{ url }` into the base64 payload.
      // So the worker needs to parse `url` or `domain`.
      // Let's modify the worker or just use `url` payload here and modify worker to accept `url` OR `domain`.
      // The instructions say "Dispatch URLs into a master Cloud Tasks queue".

      const payloadString = Buffer.from(
        request.task.httpRequest.body,
        "base64",
      ).toString("utf-8");
      const payload = JSON.parse(payloadString);
      // Ensure the payload matches what the worker expects
      const finalPayload = { domain: payload.url || payload.domain };

      await enqueueTask(
        config.queue,
        config.workerUrl,
        finalPayload,
        delaySeconds,
      );
    };

    await processSeedUrls(urls, realCreateTask, {
      projectId: config.projectId,
      location: config.location,
      queue: config.queue,
      workerUrl: config.workerUrl,
    });

    presenter.success(
      `Dispatched ${urls.length} URLs${config.dryRun ? " (dry-run)" : ""}`,
    );
  } catch (err: any) {
    presenter.fail(`Dispatch failed: ${err.message}`);
  }
}

// Only run if executed directly
if (
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1].endsWith("seed-domains.ts")
) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
