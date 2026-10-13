const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const skip = new Set(["node_modules", ".git"]);
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && full.endsWith(".js")) files.push(full);
  }
}
walk(root);

let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) {
    failed += 1;
    process.stderr.write(result.stderr || `Syntax error: ${file}\n`);
  }
}

if (failed) {
  console.error(`${failed} JavaScript file(s) failed syntax validation.`);
  process.exit(1);
}
console.log(`Syntax check passed for ${files.length} JavaScript file(s).`);
