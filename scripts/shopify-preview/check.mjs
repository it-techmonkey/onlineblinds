import fs from 'node:fs';
import path from 'node:path';
import { cli } from './cli.mjs';
import { environment, root, work, themePath } from './env.mjs';
const result = JSON.parse(cli(['theme', 'check', '--path', themePath, '--output', 'json'], { capture: true }));
fs.writeFileSync(path.join(work, 'theme-check.json'), JSON.stringify(result, null, 2));
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const secretValues = Object.entries(environment()).filter(([k, v]) => /TOKEN|SECRET|PASSWORD|PRIVATE_KEY/.test(k) && v.length >= 16).map(([,v]) => v);
const lpoSecret=path.join(work,'lpo-mcp-secret.json');
if(fs.existsSync(lpoSecret)){
  const authorization=JSON.parse(fs.readFileSync(lpoSecret,'utf8')).headers?.Authorization;
  if(authorization)secretValues.push(authorization,authorization.replace(/^Bearer\s+/i,''));
}
let scanned = 0;
for (const file of walk(themePath)) {
  if (!/\.(liquid|json|js|css)$/.test(file)) continue;
  const contents = fs.readFileSync(file, 'utf8');
  if (secretValues.some(secret => contents.includes(secret))) throw new Error(`Credential found in theme output: ${path.relative(root, file)}`);
  if (contents.includes('__OB_ASSET_')) throw new Error(`Unresolved asset in ${file}`);
  scanned++;
}
console.log(JSON.stringify({ errors: result.reduce((n,r) => n + r.errorCount,0), warnings: result.reduce((n,r) => n + r.warningCount,0), filesScannedForCredentials: scanned }));
