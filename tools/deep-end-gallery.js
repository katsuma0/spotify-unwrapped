// Renders every stat of one batch (or the whole vault) into the page and screenshots
// the deep list, so new cards can be eyeballed at desktop and phone widths.
// usage: node tools/deep-end-gallery.js --persona devotee [--extra batch.js] [--only batchName] --out /dir [--width 1100] [--dark] [--limit 40]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const extras = []; args.forEach((a, i) => { if (a === '--extra') extras.push(args[i + 1]); });
const persona = opt('--persona', 'devotee'), only = opt('--only', null), out = opt('--out', '/tmp/gallery');
const width = +opt('--width', 1100), dark = args.includes('--dark'), limit = +opt('--limit', 400), offset = +opt('--offset', 0);
const ROOT = path.resolve(__dirname, '..');
const PORT = 8900 + Math.floor(Math.random() * 90);
(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '-d', ROOT, '--bind', '127.0.0.1'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: dark ? 'dark' : 'light' });
  const errs = [];
  page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://127.0.0.1:' + PORT + '/index.html');
  for (const ex of extras) await page.addScriptTag({ path: ex });
  if (persona === 'zip') await page.setInputFiles('#fileInput', path.join(ROOT, 'my_spotify_data.zip'));
  else await page.evaluate((k) => loadSample(k), persona);
  await page.waitForFunction(() => typeof fillQueue !== 'undefined' && fillQueue.length === 0, null, { timeout: 60000 });
  const n = await page.evaluate(([only, limit, offset]) => {
    const wrap = document.getElementById('deepList');
    wrap.innerHTML = ''; fillQueue = []; onPage = new Set();
    const pool = buildPool(lastStats, curDeep).filter(e => (!only || e.src === only) && (() => { try { return !e.avail || e.avail(); } catch (err) { return false; } })());
    curPool = pool;
    const picked = pool.sort((a, b) => a.w - b.w).slice(offset, offset + limit);
    for (const blk of picked) { const card = makeCard(blk); wrap.append(card); }
    layoutDeep();
    for (const card of wrap.querySelectorAll('.dcard')) fillCard(card);
    document.getElementById('deepAnchor').scrollIntoView();
    return picked.length;
  }, [only, limit, offset]);
  fs.mkdirSync(out, { recursive: true });
  const top = await page.evaluate(() => document.getElementById('deepList').getBoundingClientRect().top + window.scrollY);
  const height = await page.evaluate(() => document.getElementById('deepList').scrollHeight);
  const H = 1600;
  let i = 0;
  for (let y = 0; y < height; y += H) {
    await page.setViewportSize({ width, height: Math.min(H, height - y + 10) });
    await page.evaluate((yy) => window.scrollTo(0, yy), top + y);
    await page.waitForTimeout(80);
    await page.screenshot({ path: path.join(out, `${persona}-${width}${dark ? '-dark' : ''}-${String(i++).padStart(2, '0')}.png`) });
  }
  console.log(`${n} cards, ${i} screenshots in ${out}, console issues: ${errs.length}`);
  for (const e of errs.slice(0, 10)) console.log('  ' + e.slice(0, 200));
  await browser.close(); srv.kill();
})().catch(e => { console.error(e); process.exit(2); });
