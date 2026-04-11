import * as fs from "fs";
import { afterEach } from "vitest";

const fdRegistry = new Set<number>();

// Store original functions
const originalOpenSync = fs.openSync;
const originalCloseSync = fs.closeSync;

export function installFdRegistry() {
  // Wrap fs.openSync to track descriptors
  (fs as any).openSync = function (...args: Parameters<typeof originalOpenSync>) {
    const fd = originalOpenSync.apply(this, args);
    fdRegistry.add(fd);
    return fd;
  };

  // Wrap fs.closeSync to untrack descriptors
  (fs as any).closeSync = function (fd: number) {
    fdRegistry.delete(fd);
    return originalCloseSync.apply(this, [fd]);
  };

  afterEach(() => {
    // Clean up any leaked file descriptors to prevent EMFILE errors
    if (fdRegistry.size > 0) {
      console.warn(`[FD Cleanup] Closing ${fdRegistry.size} leaked file descriptors.`);
      for (const fd of Array.from(fdRegistry)) {
        try {
          originalCloseSync(fd);
        } catch (e) {
          // Ignore close errors
        }
      }
      fdRegistry.clear();
    }
  });
}
