// Deep-end harness. Serves the repo over http, loads a persona (or the sample zip),
// renders EVERY available stat in the vault into an offscreen box, and reports
// errors, empty cards, and copy-rule violations. Also checks the real 101 deal,
// the swap button, and the sticky shuffle.
//
// usage: node tools/deep-end-check.js [--persona devotee|nightowl|explorer|commuter|weekender|podcaster|zip|simple|all]  (all = every persona plus zip and simple)
//                      [--extra /path/batch.js ...] [--only batchName] [--shot /dir] [--json out.json] [--quiet]
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const extras = []; args.forEach((a, i) => { if (a === '--extra') extras.push(args[i + 1]); });
const persona = opt('--persona', 'all');
const only = opt('--only', null);
const shotDir = opt('--shot', null);
const jsonOut = opt('--json', null);
const quiet = args.includes('--quiet');
const PERSONAS = ['devotee', 'nightowl', 'explorer', 'commuter', 'weekender', 'podcaster'];
const list = persona === 'all' ? PERSONAS.concat(['zip', 'simple']) : persona.split(',');
const PORT = 8900 + Math.floor(Math.random() * 90);

// Pull the one-year account-data file out of the sample zip, so the account-data
// path is tested without a second fixture in the repo.
function simpleSlice() {
  const out = path.join(os.tmpdir(), 'unwrapped-StreamingHistory_music_0.json');
  if (!fs.existsSync(out)) {
    execFileSync('python3', ['-I', '-c', "import zipfile,sys;z=zipfile.ZipFile(sys.argv[1]);open(sys.argv[2],'wb').write(z.read('Spotify Account Data/StreamingHistory_music_0.json'))", path.join(ROOT, 'my_spotify_data.zip'), out]);
  }
  return out;
}

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '-d', ROOT, '--bind', '127.0.0.1'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const browser = await chromium.launch();
  const report = { personas: {}, summary: {} };
  let totalErr = 0, totalEmpty = 0, totalFlags = 0;
  for (const key of list) {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    const console_ = [];
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) console_.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', e => console_.push('pageerror: ' + e.message));
    await page.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load' });
    for (const ex of extras) await page.addScriptTag({ path: ex });
    if (key === 'zip') {
      await page.setInputFiles('#fileInput', path.join(ROOT, 'my_spotify_data.zip'));
    } else if (key === 'simple') {
      // account-data only: no seconds, skip, shuffle, album, platform, or podcasts
      await page.setInputFiles('#fileInput', simpleSlice());
    } else {
      await page.evaluate((k) => loadSample(k), key);
    }
    await page.waitForSelector('#deepList .dcard', { timeout: 60000 });
    await page.waitForFunction(() => typeof fillQueue !== 'undefined' && fillQueue.length === 0, null, { timeout: 60000 });

    const res = await page.evaluate((only) => {
      const box = document.createElement('div');
      box.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px;';
      document.body.append(box);
      const pool = buildPool(lastStats, curDeep);
      const out = [];
      const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
      for (const e of pool) {
        if (only && e.src !== only) continue;
        const rec = { t: e.t, s: e.s || '', src: e.src || 'core', w: e.w, sz: e.sz, fam: e.fam || '', flags: [] };
        let avail = true;
        try { avail = !e.avail || !!e.avail(); } catch (err) { rec.status = 'avail-threw'; rec.err = String(err && err.stack || err).slice(0, 300); out.push(rec); continue; }
        if (!avail) { rec.status = 'hidden'; out.push(rec); continue; }
        const body = document.createElement('div');
        box.append(body);
        const t0 = performance.now();
        try { e.r(body); } catch (err) { rec.status = 'error'; rec.err = String(err && err.stack || err).slice(0, 400); out.push(rec); body.remove(); continue; }
        rec.ms = Math.round(performance.now() - t0);
        const text = (body.textContent || '').replace(/\s+/g, ' ').trim();
        const visual = body.querySelector('svg, .meterbar, .podium, .waffle, .rlist, .tiles, input, button, .cloud, .stackbar, .versus');
        rec.status = (text.length || visual) ? 'ok' : 'empty';
        const stat = (e.t || '') + ' ' + (e.s || '');
        if (/\u2014/.test(stat)) rec.flags.push('emdash-title');
        if (/\u2014/.test(text)) rec.flags.push('emdash-text');
        if (EMOJI.test(stat + ' ' + text)) rec.flags.push('emoji');
        if (/\bNaN\b|\bundefined\b|\bnull\b|Infinity/.test(text)) rec.flags.push('bad-number');
        if (/!/.test(stat)) rec.flags.push('bang-title');
        if (/[A-Za-z]:\s*$/.test(text) || /\bby\s*$/.test(text)) rec.flags.push('dangling-text');
        if (!(e.sz === 2 || e.sz === 3 || e.sz === 4 || e.sz === 6)) rec.flags.push('bad-size');
        if (!(e.w >= 1 && e.w <= 10)) rec.flags.push('bad-tier');
        if (body.scrollWidth > 620) rec.flags.push('overflow-' + body.scrollWidth);
        rec.sample = text.slice(0, 160);
        out.push(rec);
        body.remove();
      }
      box.remove();
      // the real deal
      const cards = [...document.querySelectorAll('#deepList .dcard')];
      const deal = {
        count: cards.length,
        emptyOnPage: cards.filter(c => { const b = c.querySelector(':scope > div'); return !b || (!(b.textContent || '').trim() && !b.querySelector('svg, input, .waffle, .meterbar, .podium')); }).map(c => c.querySelector('h3').textContent),
        sizes: cards.map(c => c.dataset.sz),
        note: document.getElementById('deepNote').textContent,
        poolSize: pool.length,
        availSize: curPool.length,
        spans: cards.map(c => c.style.gridColumn),
      };
      return { out, deal };
    }, only);

    // swap check: swap the first three cards, make sure titles change and bodies fill
    const swap = await page.evaluate(() => {
      const r = [];
      const cards = [...document.querySelectorAll('#deepList .dcard')].slice(0, 3);
      for (const c of cards) {
        const before = c.querySelector('h3').textContent;
        const btn = c.querySelector('.swapbtn');
        if (!btn) { r.push({ before, ok: false, why: 'no button' }); continue; }
        const idx = [...document.querySelectorAll('#deepList .dcard')].indexOf(c);
        btn.click();
        const after = document.querySelectorAll('#deepList .dcard')[idx];
        const title = after.querySelector('h3').textContent;
        const body = after.querySelector(':scope > div');
        const filled = !!(body && ((body.textContent || '').trim() || body.querySelector('svg, input, .waffle, .meterbar, .podium')));
        r.push({ before, after: title, ok: title !== before && filled, filled });
      }
      return { swaps: r, count: document.querySelectorAll('#deepList .dcard').length };
    });
    // three redeals, count must hold
    const redeals = [];
    for (let k = 0; k < 3; k++) {
      await page.evaluate(() => dealDeep());
      await page.waitForFunction(() => fillQueue.length === 0, null, { timeout: 60000 });
      redeals.push(await page.evaluate(() => document.querySelectorAll('#deepList .dcard').length));
    }
    // sticky shuffle visibility after scrolling into the deep end
    await page.evaluate(() => { document.getElementById('deepAnchor').scrollIntoView(); window.scrollBy(0, 200); });
    await page.waitForTimeout(150);
    const sticky = await page.evaluate(() => document.getElementById('stickyShuffle').classList.contains('on'));
    // mobile layout: no horizontal overflow at 375px
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(250);
    const mobile = await page.evaluate(() => ({ docW: document.documentElement.scrollWidth, cols: getComputedStyle(document.getElementById('deepList')).gridTemplateColumns.split(' ').length, wideCards: [...document.querySelectorAll('#deepList .dcard')].filter(c => c.scrollWidth > c.clientWidth + 2).map(c => c.querySelector('h3').textContent) }));
    if (shotDir) {
      fs.mkdirSync(shotDir, { recursive: true });
      await page.evaluate(() => document.getElementById('deepAnchor').scrollIntoView());
      await page.screenshot({ path: path.join(shotDir, key + '-mobile.png'), fullPage: false });
      await page.setViewportSize({ width: 1100, height: 900 });
      await page.waitForTimeout(250);
      await page.evaluate(() => document.getElementById('deepAnchor').scrollIntoView());
      await page.screenshot({ path: path.join(shotDir, key + '-desktop.png'), fullPage: false });
    }
    await page.setViewportSize({ width: 1100, height: 900 });

    const out = res.out;
    const errs = out.filter(r => r.status === 'error' || r.status === 'avail-threw');
    const empties = out.filter(r => r.status === 'empty');
    const flagged = out.filter(r => r.flags.length);
    const slow = out.filter(r => r.ms > 80);
    const deepWarn = console_.filter(c => /deep block failed|vault batch failed|pageerror|error/i.test(c));
    totalErr += errs.length + deepWarn.length; totalEmpty += empties.length; totalFlags += flagged.length;
    report.personas[key] = { total: out.length, ok: out.filter(r => r.status === 'ok').length, hidden: out.filter(r => r.status === 'hidden').length, errors: errs, empties, flagged, slow, console: deepWarn, deal: res.deal, swap, redeals, sticky, mobile };
    if (!quiet) {
      console.log(`\n== ${key}: ${out.length} entries, ${report.personas[key].ok} ok, ${report.personas[key].hidden} hidden, ${errs.length} errors, ${empties.length} empty, ${flagged.length} flagged`);
      console.log(`   deal: ${res.deal.count} cards (pool ${res.deal.poolSize}, available ${res.deal.availSize}), empty on page: ${res.deal.emptyOnPage.length}, redeals: ${redeals.join('/')}, swaps ok: ${swap.swaps.filter(s => s.ok).length}/${swap.swaps.length}, sticky: ${sticky}, mobile docW ${mobile.docW} cols ${mobile.cols} wide ${mobile.wideCards.length}`);
      for (const e of errs) console.log('   ERROR  ' + e.t + ' [' + e.src + ']: ' + (e.err || '').split('\n')[0]);
      for (const e of empties) console.log('   EMPTY  ' + e.t + ' [' + e.src + ']');
      for (const e of flagged) console.log('   FLAG   ' + e.t + ' [' + e.src + '] ' + e.flags.join(',') + ' :: ' + e.sample.slice(0, 90));
      for (const e of slow) console.log('   SLOW   ' + e.t + ' [' + e.src + '] ' + e.ms + 'ms');
      for (const c of deepWarn) console.log('   CONSOLE ' + c.slice(0, 200));
      if (res.deal.emptyOnPage.length) console.log('   EMPTY ON PAGE: ' + res.deal.emptyOnPage.join(' | '));
      if (mobile.wideCards.length) console.log('   MOBILE OVERFLOW: ' + mobile.wideCards.slice(0, 8).join(' | '));
    }
    await page.close();
  }
  report.summary = { errors: totalErr, empties: totalEmpty, flagged: totalFlags };
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(report, null, 1));
  console.log(`\nTOTAL errors ${totalErr}, empties ${totalEmpty}, flagged ${totalFlags}`);
  await browser.close();
  srv.kill();
  process.exit(totalErr ? 1 : 0);
})().catch(e => { console.error('HARNESS FAILED', e); process.exit(2); });
