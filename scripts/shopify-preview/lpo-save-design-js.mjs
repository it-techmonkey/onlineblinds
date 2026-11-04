// Saves shopify-migration/lpo/design.js as LPO's shared design JavaScript.
// The JS is stored once on LPO's design theme, so one editor session is enough.
// Opens the given migration config (default: the Day & Night pilot) in the
// automation browser, replaces the JS, saves, and reads it back.
import fs from 'node:fs';
import {initialize, call} from './lpo-mcp.mjs';
import {editorSession} from './lpo-editor-session.mjs';

const configUuid = process.argv[2] || 'clfhanm6jjqw';
const read = (r) => r.structuredContent || JSON.parse(r.content.find((c) => c.type === 'text').text);
await initialize();
const stored = read(await call('config_get', {configUuid}));
if (!stored.name.startsWith('OB Preview -')) throw new Error('Not a migration config');
const code = fs.readFileSync('shopify-migration/lpo/design.js', 'utf8');
const ui = await editorSession();
try {
  // Always reload so the list includes recently created configs.
  await ui.page.goto('https://admin.shopify.com/store/online-blinds-express/apps/live-product-options');
  await ui.frame.getByText('OB Preview -').first().waitFor({timeout: 60000});
  const sessionId = await ui.open(configUuid, stored.name);
  const before = (await call('draft_getDesignJS', {sessionId})).content.find((c) => c.type === 'text')?.text || '';
  fs.writeFileSync('.shopify-work/design-js-before-' + new Date().toISOString().slice(0, 10) + '.js', before);
  await call('draft_saveDesignJS', {sessionId, customJS: code});
  await call('draft_save', {sessionId, configUuid});
  const after = (await call('draft_getDesignJS', {sessionId})).content.find((c) => c.type === 'text')?.text || '';
  if (!after.includes(code.slice(0, 200)) || Math.abs(after.length - code.length) > 50) throw new Error('Design JS did not read back as saved');
  const saved = read(await call('config_get', {configUuid}));
  if (saved.enabled !== stored.enabled) throw new Error('Enabled state changed');
  console.log(`Saved shared design JS: ${before.length} -> ${after.length} bytes`);
} finally {
  if (ui.created) await ui.page.close();
  await ui.browser.close();
}
