// Returns the automation browser's LPO tab to the config list so no open
// editor can overwrite sessionless config updates on its next save.
import {initialize, call} from './lpo-mcp.mjs';
import {editorSession} from './lpo-editor-session.mjs';
await initialize();
const ui = await editorSession();
try {
  await ui.page.goto('https://admin.shopify.com/store/online-blinds-express/apps/live-product-options');
  await ui.page.waitForTimeout(8000);
  const open = ((await call('session_list')).structuredContent?.sessions || []).filter((s) => s.activeConfigUuid);
  console.log(open.length ? 'Editors still attached: ' + open.map((s) => s.activeConfigUuid).join(',') : 'No LPO editors open');
} finally { await ui.browser.close(); }
