import fs from "fs";
import path from "path";

export const provisionNpmrc = (stagingDir: string) => {
  if (process.env.NPM_TOKEN) {
    fs.writeFileSync(
      path.join(stagingDir, ".npmrc"),
      `//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}\n`,
      { mode: 0o600 },
    );
  }
};
import child_process from "child_process";

export const hydrateDependencies = (stagingDir: string) => {
  child_process.spawnSync(
    "npm",
    ["ci", "--prefer-offline", "--no-audit", "--fund=false"],
    {
      cwd: stagingDir,
      shell: false,
    },
  );
};
