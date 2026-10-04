// Brauzerda ssenariy bajarib skrinshot olish (SwiftShader). Ishlatish:
//   NODE_PATH=$(npm root) node tools/scenario.mjs <ssenariy.mjs> <chiqish.png> [url-yo'li] [kenglik] [balandlik]
// Ssenariy fayli: export default async (page) => { ... }  — sahifa tayyor bo'lgandan keyin chaqiriladi.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [,, scen, out = 'shot.png', path = '/index.html?q=orta&empty=1', w = '1280', h = '800'] = process.argv;
const port = process.env.PORT || 8765;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack || ''}`));
await page.goto(`http://127.0.0.1:${port}${path}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
if (scen && scen !== '-') {
  const mod = await import(pathToFileURL(resolve(scen)).href);
  await mod.default(page);
}
await page.waitForTimeout(Number(process.env.WAIT || 500));
await page.screenshot({ path: out });
console.log(logs.join('\n'));
await browser.close();
