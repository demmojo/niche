import { describe, it, expect, vi } from "vitest";
import { acquireGlobalLock } from "../lock.js";
import * as fs from "fs";
import * as path from "path";

describe("Global Workspace Locking", () => {
  it("should create lock directory and acquire lock successfully", async () => {
    const tmpDir = path.resolve(process.cwd(), ".openspec", ".tmp");
    const lockFile = path.join(tmpDir, "openspec.lock");
    if (fs.existsSync(lockFile)) fs.rmSync(lockFile, { force: true });
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });

    const release = await acquireGlobalLock();
    expect(typeof release).toBe("function");

    expect(fs.existsSync(lockFile)).toBe(true);

    await release();
  });

  it("should fail to acquire lock if already locked by another process (simulated)", async () => {
    const release1 = await acquireGlobalLock();

    // Attempting to lock again without releasing should throw EBUSY or timeout
    await expect(acquireGlobalLock()).rejects.toThrow(/Failed to acquire/);

    await release1();
  });
});
