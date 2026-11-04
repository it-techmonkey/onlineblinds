import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const work = path.join(root, '.shopify-work');
export const themePath = path.join(root, 'shopify-theme');

export function environment() {
  const env = { ...process.env };
  for (const file of ['.env', '.env.local']) {
    const filename = path.join(root, file);
    if (fs.existsSync(filename)) Object.assign(env, parseEnv(fs.readFileSync(filename, 'utf8')));
  }
  return env;
}

export function storeDomain(env = environment()) {
  const domain = (env.SHOPIFY_FLAG_STORE || env.SHOPIFY_STORE_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(domain)) throw new Error('A myshopify.com store domain is required.');
  return domain;
}

// This inspection client deliberately accepts queries only. Product, app, order,
// domain and existing-theme mutations are outside this migration's authorization.
export async function readAdmin(query, variables = {}) {
  if (/\bmutation\b/.test(query)) throw new Error('Read-only client: mutations are forbidden.');
  const env = environment();
  const response = await fetch(`https://${storeDomain(env)}/admin/api/2026-10/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': env.SHOPIFY_ADMIN_ACCESS_TOKEN },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Shopify read failed: HTTP ${response.status}`);
  const result = await response.json();
  if (result.errors) throw new Error(JSON.stringify(result.errors));
  return result.data;
}
