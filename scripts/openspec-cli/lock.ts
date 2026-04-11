import * as fs from "fs";
import * as path from "path";
import * as lockfile from "proper-lockfile";

const TMP_DIR = path.resolve(process.cwd(), ".openspec", ".tmp");
const LOCK_FILE = path.join(TMP_DIR, "openspec.lock");

export async function acquireGlobalLock(): Promise<() => Promise<void>> {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }
  if (!fs.existsSync(LOCK_FILE)) {
    fs.writeFileSync(LOCK_FILE, "", { flag: "a" });
  }

  try {
    const release = await lockfile.lock(LOCK_FILE, {
      retries: {
        retries: 5,
        factor: 1.5,
        minTimeout: 200,
        maxTimeout: 1000,
      },
      stale: 30000,
      update: 5000,
    });
    return release;
  } catch (error: any) {
    throw new Error(`Failed to acquire OpenSpec global lock: ${error.message}`);
  }
}
