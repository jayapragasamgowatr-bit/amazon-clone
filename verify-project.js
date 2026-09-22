const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const roots = [
  path.join(__dirname, "..", "server"),
  path.join(__dirname, "..", "client"),
];

const files = [];

for (const root of roots) {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".js") || entry.name.endsWith(".mjs")) files.push(full);
    }
  };
  walk(root);
}

for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

console.log(`Verified ${files.length} JavaScript files.`);
