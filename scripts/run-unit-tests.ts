import { spawnSync } from "node:child_process";

const testFiles = [
  "lib/window-spec.test.ts",
  "lib/draft-persistence.test.ts",
  "lib/services/addressParsing.test.ts",
  "lib/trades/tradeDefinitions.test.ts",
  "src/lib/mobile/remedy/heuristics.test.ts",
] as const;

function runOne(file: string) {
  const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const result = spawnSync(cmd, ["--no-install", "tsx", file], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const file of testFiles) {
  runOne(file);
}

