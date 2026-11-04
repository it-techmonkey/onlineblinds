// Pushes only the named files to the published Online Blinds theme (200474362240).
// Run build.mjs and check.mjs first. Never deletes files or touches other themes.
// Usage: node scripts/shopify-preview/push-live.mjs sections/ob-newsletter.liquid [more files]
import fs from 'node:fs';
import path from 'node:path';
import {cli} from './cli.mjs';
import {themePath} from './env.mjs';

const files = process.argv.slice(2);
if (!files.length) throw new Error('Name the theme files to push, e.g. sections/ob-newsletter.liquid');
for (const f of files) if (!fs.existsSync(path.join(themePath, f))) throw new Error(`Not found in shopify-theme: ${f}`);
const args = ['theme', 'push', '--path', themePath, '--theme', '200474362240', '--nodelete', '--allow-live', '--json'];
for (const f of files) args.push('--only', f);
const result = JSON.parse(cli(args, {capture: true}));
console.log(`Pushed ${files.join(', ')} to ${result.theme?.name} (${result.theme?.role})`);
