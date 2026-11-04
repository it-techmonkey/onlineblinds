import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { environment, work, storeDomain } from './env.mjs';

export function cli(args, { capture = false } = {}) {
  const env = environment();
  // Never inherit CLI flags that could target or publish a different theme.
  for (const key of Object.keys(env)) if (key.startsWith('SHOPIFY_FLAG_')) delete env[key];
  Object.assign(env, {
    SHOPIFY_FLAG_STORE: storeDomain(environment()),
    SHOPIFY_CLI_NO_ANALYTICS: '1',
    SHOPIFY_CLI_NO_AUTOUPDATE: '1',
    SHOPIFY_CLI_NO_COLOR: '1',
  });
  if (!env.SHOPIFY_CLI_THEME_TOKEN) throw new Error('SHOPIFY_CLI_THEME_TOKEN is missing.');
  const result = spawnSync(process.execPath, [path.join(work, 'tooling/node_modules/@shopify/cli/bin/run.js'), ...args], {
    env, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) throw new Error(`Shopify CLI failed (${result.status}). ${capture ? result.stderr : ''}`);
  return capture ? result.stdout : undefined;
}

if (process.argv[1]?.endsWith('cli.mjs')) {
  const args = process.argv.slice(2);
  if (args[0] !== 'theme' || !['list', 'check', 'pull'].includes(args[1])) {
    throw new Error('Only list/check/pull are allowed here. Use the guarded preview uploader for writes.');
  }
  cli(args);
}
