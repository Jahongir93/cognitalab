// Sahna skrinshoti (dasturiy render — SwiftShader). Ishlatish: node tools/screenshot.mjs <url-yo'li> <chiqish.png> [kenglik] [balandlik]
import { chromium } from 'playwright';
const [,, path = '/index.html', out = 'shot.png', w = '1280', h = '800'] = process.argv;
const port = process.env.PORT || 8765;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(`http://127.0.0.1:${port}${path}`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
await page.waitForTimeout(Number(process.env.WAIT || 2500));
await page.screenshot({ path: out });
console.log(logs.join('\n'));
await browser.close();
