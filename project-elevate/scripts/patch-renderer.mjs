import { readFileSync, writeFileSync, readdirSync } from "fs";
import { resolve } from "path";

const assetsDir = resolve(".output/public/assets");
const assets = readdirSync(assetsDir);
const js  = assets.find(f => f.startsWith("index-") && f.endsWith(".js"));
const css = assets.find(f => f.startsWith("styles-") && f.endsWith(".css"));
if (!js || !css) { console.error("assets not found"); process.exit(1); }

const templatePath = resolve(".output/server/_chunks/renderer-template.mjs");
let content = readFileSync(templatePath, "utf8");

// The dev script tag as it appears inside the JS string literal
const devTag   = '<script type=\\"module\\" src=\\"/src/start.ts\\"><\\/script>';
const prodTags = '<link rel=\\"stylesheet\\" href=\\"/assets/' + css + '\\"><script type=\\"module\\" src=\\"/assets/' + js + '\\"><\\/script>';

if (!content.includes(devTag)) { console.error("dev tag not found in template"); process.exit(1); }
const patched = content.split(devTag).join(prodTags);
writeFileSync(templatePath, patched);
console.log("patched:", js, css);