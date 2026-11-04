// Activates or deactivates migration configs by UUID.
// Usage: node scripts/shopify-preview/lpo-set-active.mjs on|off <uuid> [uuid...]
// The published (headless) theme does not load LPO, so active configs only
// render where the LPO embed is present (the unpublished preview theme).
import {initialize, call, updateConfig} from './lpo-mcp.mjs';
const [mode, ...ids] = process.argv.slice(2);
if (!['on', 'off'].includes(mode) || !ids.length) throw new Error('Usage: on|off <uuid...>');
const read = (r) => r.structuredContent || JSON.parse(r.content.find((c) => c.type === 'text').text);
await initialize();
for (const id of ids) {
  await updateConfig(id, {enabled: mode === 'on'}, {allowEnabledChange: true});
  const saved = read(await call('config_get', {configUuid: id}));
  if (saved.enabled !== (mode === 'on')) throw new Error('State did not change for ' + saved.name);
  console.log(`${saved.name}: ${saved.enabled ? 'ACTIVE' : 'inactive'}`);
}
