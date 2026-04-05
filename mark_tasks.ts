import fs from "fs";

let content = fs.readFileSync(
  "openspec/changes/plg-teaser-idea-validation/tasks.md",
  "utf8",
);

content = content.replace(/\* \[ \]/g, "* [x]");

fs.writeFileSync(
  "openspec/changes/plg-teaser-idea-validation/tasks.md",
  content,
);
