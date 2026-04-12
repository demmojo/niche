import child_process from "child_process";

export const runBackgroundGC = () => {
  const child = child_process.spawn(
    process.execPath,
    [__filename, "--run-gc"],
    {
      detached: true,
      stdio: "ignore",
    },
  );
  child.unref();
};

if (process.argv.includes("--run-gc")) {
  // Execute opendir logic here, sweeping .tmp/ and .openspec-failed-artifacts/
}
