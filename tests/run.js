#!/usr/bin/env node
/* End-to-end test of the app bundle (www/) and the web build (index.html), in WebKit and Chromium.
   Runs iOS's real JS layer: Capacitor's native-bridge.js plus the plugin stubs JSExport.swift generates,
   with method lists read from the installed Swift sources. Only the Swift layer below is faked, following
   the rules in those sources. It cannot stand in for an Xcode build, the real plugins or a device.
   Usage: npm test, or node tests/run.js [webkit|chromium]   (screenshots: tests/output/) */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { webkit, chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const WWW = path.join(ROOT, 'www');
const CAP = path.join(ROOT, 'node_modules', '@capacitor');
const CAP_CORE = path.join(CAP, 'ios', 'Capacitor', 'Capacitor');
const OUTPUT = path.join(__dirname, 'output');
const LEVELS_BAKED_SHA256 = '4a487a8f24bf40437ded6e9f05ad8b3493918da9828457458d60ae1c159483c9';   // rule: never re-bake levels 73, 74, 79, 89
const CDN_PROBE = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.txt': 'text/plain' };
const PHONES = { se: { width: 375, height: 667 }, i15: { width: 393, height: 852 }, max: { width: 440, height: 956 } };
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
const SAVED = { stars: { 1: 3, 2: 2 }, best: { 1: 9 }, coins: 777, extras: { undo: 1, vac: 0, shake: 0 }, chests: 0, unlocked: 7 };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const note = s => console.log('     ' + s);
const section = s => console.log('\n' + s);
const tally = { passed: 0, failed: 0 };
const check = (name, ok, extra) => {
  ok ? tally.passed++ : tally.failed++;
  console.log(`${ok ? '  ok ' : 'HATA '} ${name}${!ok && extra !== undefined ? '  => ' + JSON.stringify(extra).slice(0, 400) : ''}`);
};

/* ---------- iOS's JS layer ---------- */
/* same output as JSExport.exportJS */
function pluginStub(file) {
  const src = fs.readFileSync(file, 'utf8');
  const name = (src.match(/jsName\s*=\s*"([^"]+)"/) || [])[1];
  if (!name) throw new Error('no jsName in ' + file);
  const methods = [...src.matchAll(/CAPPluginMethod\(name:\s*"([^"]+)",\s*returnType:\s*(CAPPluginReturn\w+)\)/g)];
  const lines = [`(function(w) {
var a = (w.Capacitor = w.Capacitor || {});
var p = (a.Plugins = a.Plugins || {});
var t = (p['${name}'] = {});
t.addListener = function(eventName, callback) { return w.Capacitor.addListener('${name}', eventName, callback); }
t.removeAllListeners = function() { return w.Capacitor.nativePromise('${name}', 'removeAllListeners'); }`];
  for (const [, m, rt] of methods) {
    if (rt === 'CAPPluginReturnPromise') lines.push(`t['${m}'] = function(_options) { return w.Capacitor.nativePromise('${name}', '${m}', _options); }`);
    else if (rt === 'CAPPluginReturnCallback') lines.push(`t['${m}'] = function(_options, _callback) { return w.Capacitor.nativeCallback('${name}', '${m}', _options, _callback); }`);
    else lines.push(`t['${m}'] = function(_options) { return w.Capacitor.nativeCallback('${name}', '${m}', _options); }`);
  }
  lines.push('})(window);');
  return lines.join('\n');
}
const STUBS = [
  ...['CapacitorHttp', 'Console', 'WebView', 'CapacitorCookies', 'SystemBars'].map(n => path.join(CAP_CORE, 'Plugins', n + '.swift')),
  path.join(CAP, 'app', 'ios', 'Sources', 'AppPlugin', 'AppPlugin.swift'),
  path.join(CAP, 'haptics', 'ios', 'Sources', 'HapticsPlugin', 'HapticsPlugin.swift'),
  path.join(CAP, 'preferences', 'ios', 'Sources', 'PreferencesPlugin', 'PreferencesPlugin.swift'),
].map(pluginStub).join('\n');
const BRIDGE = fs.readFileSync(path.join(CAP_CORE, 'assets', 'native-bridge.js'), 'utf8');

/* the Swift layer: HapticsPlugin, PreferencesPlugin and AppPlugin, rule for rule */
function fakeSwift(seed, opts) {
  return `(() => {
  const N = window.__native = { calls: [], prefs: new Map(${JSON.stringify(Object.entries(seed))}), listeners: [], jsErrors: [], consoleErrors: [], nonString: [], gameRanBeforeKeys: null };
  const LATENCY = ${opts.latency == null ? 15 : opts.latency}, FAIL_KEYS = ${!!opts.failKeys};
  const reply = (m, data, ok, error) => window.Capacitor.fromNative({ callbackId: m.callbackId, pluginId: m.pluginId, methodName: m.methodName, success: ok !== false, data: data || {}, error, save: false });
  const handle = m => {
    const o = m.options || {};
    switch (m.pluginId + '.' + m.methodName) {
      case 'Haptics.impact': N.calls.push({ t: performance.now(), k: 'impact:' + (o.style === 'MEDIUM' ? 'MEDIUM' : o.style === 'LIGHT' ? 'LIGHT' : 'HEAVY') }); return reply(m);
      case 'Haptics.notification': N.calls.push({ t: performance.now(), k: 'notification:' + (o.type === 'WARNING' ? 'WARNING' : o.type === 'ERROR' ? 'ERROR' : 'SUCCESS') }); return reply(m);
      case 'Preferences.keys':
        N.gameRanBeforeKeys = !!window.__pj;
        if (FAIL_KEYS) return reply(m, null, false, { message: 'fake failure' });
        return reply(m, { keys: [...N.prefs.keys()] });
      case 'Preferences.get':
        if (typeof o.key !== 'string') return reply(m, null, false, { message: 'Must provide a key' });
        return reply(m, { value: N.prefs.has(o.key) ? N.prefs.get(o.key) : null });
      case 'Preferences.set':
        if (typeof o.key !== 'string') return reply(m, null, false, { message: 'Must provide a key' });
        if (typeof o.value !== 'string') N.nonString.push(o.key);   // Swift's getString("value", "") turns these into ""
        N.prefs.set(o.key, typeof o.value === 'string' ? o.value : '');
        return reply(m);
      case 'Preferences.remove': N.prefs.delete(o.key); return reply(m);
      case 'App.addListener': N.listeners.push({ eventName: o.eventName, callbackId: m.callbackId }); return;
      case 'Console.log': if (o.level === 'error') N.consoleErrors.push(o.message); return;
      default: return reply(m);
    }
  };
  N.fire = (eventName, data) => N.listeners.filter(l => l.eventName === eventName).forEach(l =>
    window.Capacitor.fromNative({ callbackId: l.callbackId, pluginId: 'App', methodName: 'addListener', success: true, data: Object.assign({}, data), save: true }));
  const bridge = { postMessage(raw) {
    const m = JSON.parse(JSON.stringify(raw));   // WKScriptMessage delivers a structured copy
    if (m.type === 'js.error') { N.jsErrors.push(m.error); return; }
    setTimeout(() => handle(m), m.pluginId === 'Preferences' ? LATENCY : 0);
  } };
  try { Object.defineProperty(window, 'webkit', { value: { messageHandlers: { bridge } }, configurable: true, writable: true }); } catch (e) { window.webkit = { messageHandlers: { bridge } }; }
  window.prompt = s => { try { if (/isEnabled/.test(JSON.parse(s).type)) return 'false'; } catch (e) {} return ''; };   // WKUIDelegate answers these
  N.webVibrations = 0;
  navigator.vibrate = () => { N.webVibrations++; return true; };
  const AC = window.AudioContext || window.webkitAudioContext;
  if (AC) { window.AudioContext = function () { const c = new AC(); N.actx = c; return c; }; window.AudioContext.prototype = AC.prototype; }
})();`;
}
/* same order as CapacitorBridge: globals, bridge, then each plugin */
const initScript = (seed, opts, base) => [
  fakeSwift(seed, opts),
  `window.Capacitor = { DEBUG: true, isLoggingEnabled: true, Plugins: {} }; window.WEBVIEW_SERVER_URL = '${base}';`,
  BRIDGE,
  STUBS,
].join('\n;\n');

async function serve(dir) {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    const f = path.join(dir, p === '/' ? 'index.html' : p);
    fs.readFile(f, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
      res.end(data);
    });
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  return { server, base: `http://127.0.0.1:${server.address().port}/` };
}

/* ---------- checks that need no browser ---------- */
function checkBuild() {
  section('[Kurallar ve build]');
  const baked = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, 'src', 'levels.baked.js'))).digest('hex');
  check('src/levels.baked.js değişmedi', baked === LEVELS_BAKED_SHA256, baked);
  const web = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), app = fs.readFileSync(path.join(WWW, 'index.html'), 'utf8');
  check('web build CDN kullanıyor', web.includes('cdnjs.cloudflare.com') && web.includes('fonts.googleapis.com'));
  const remote = app.match(/https?:\/\/(?!www\.w3\.org)[^"'\s)]+/);
  check('uygulama build\'inde dış adres yok', !remote, remote && remote[0]);
  check('uygulama viewport\'unda yakınlaşma kapalı, web\'de dokunulmadı', /user-scalable=no/.test(app) && !/user-scalable=no/.test(web));
  const bad = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'build.js'), '--target', 'xyz']);
  check('bilinmeyen build hedefi reddediliyor', bad.status !== 0, bad.status);
}

/* ---------- one engine, end to end ---------- */
async function runEngine(engine) {
  const out = path.join(OUTPUT, engine);
  fs.mkdirSync(out, { recursive: true });
  const { server, base } = await serve(WWW);
  const browser = engine === 'webkit'
    ? await webkit.launch()
    : await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  console.log(`\n========== ${engine} ${browser.version()} ==========`);

  const externals = [];
  const newContext = async (viewport = PHONES.i15) => {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: UA });
    await ctx.route('**/*', r => {
      const u = r.request().url();
      if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue();
      externals.push(u); return r.abort('internetdisconnected');
    });
    return ctx;
  };
  const trackErrors = page => {
    page.errs = [];
    page.on('pageerror', e => page.errs.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') page.errs.push('console.error: ' + m.text()); });
  };
  const launch = async (ctx, { seed = {}, opts = {}, wait = true, query = '', before } = {}) => {
    const page = await ctx.newPage();
    trackErrors(page);
    if (before) await page.addInitScript(before);
    await page.addInitScript({ content: initScript(seed, opts, base) });
    if (wait) {
      await page.goto(base + query, { waitUntil: 'load', timeout: 90000 });
      await page.waitForFunction(() => window.__pj && window.__pj.G && window.__pj.save, null, { timeout: 60000 });
      await sleep(600);
    }
    return page;
  };
  const clean = async (page, label) => {
    const n = await page.evaluate(() => ({ js: window.__native.jsErrors, con: window.__native.consoleErrors, nonString: window.__native.nonString }));
    const all = [...page.errs, ...n.js.map(e => 'js.error: ' + e.message), ...n.con.map(e => 'Console: ' + e)];
    check(`${label || 'bu oturumda'} JS hatası yok`, all.length === 0, all);
    check('Preferences\'a metin olmayan değer gitmiyor', n.nonString.length === 0, n.nonString);
  };
  const callsOf = page => page.evaluate(() => window.__native.calls.map(c => c.k));
  const clearCalls = page => page.evaluate(() => { window.__native.calls.length = 0; });
  const lightGap = page => page.evaluate(() => {
    const t = window.__native.calls.filter(c => c.k === 'impact:LIGHT').map(c => c.t); let m = Infinity;
    for (let i = 1; i < t.length; i++) m = Math.min(m, t[i] - t[i - 1]);
    return m;
  });
  const playReady = page => page.waitForFunction(() => __pj.G.screen === 'play' && __pj.G.busy === 0, null, { timeout: 30000 });
  const autoWin = async (page, idx) => {
    await page.evaluate(i => { __pj.enterPlay(i); }, idx);
    await sleep(500);
    await page.evaluate(() => { __pj.autoplay(8); });
    await page.waitForFunction(() => __pj.G.screen === 'result', null, { timeout: 180000 });
    await sleep(2200);
  };
  const fits = (page, selectors) => page.evaluate(ids => {
    const d = document.documentElement, W = innerWidth, H = innerHeight;
    const off = ids.filter(sel => {
      const n = document.querySelector(sel); if (!n) return true;
      const r = n.getBoundingClientRect();
      return r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1 || r.width === 0;
    });
    return { over: d.scrollHeight > H + 1 || d.scrollWidth > W + 1, off };
  }, selectors);

  let ctx, p, s;
  const finish = async () => { await browser.close(); server.close(); };

  /* the game cannot run without WebGL, so everything below would be noise */
  ctx = await newContext(); p = await ctx.newPage();
  await p.goto(base + 'vendor/fonts/OFL-Bungee.txt');
  const gl = await p.evaluate(() => { const g = document.createElement('canvas').getContext('webgl'); return g ? g.getParameter(g.VERSION) : null; });
  check(`WebGL var (${gl})`, !!gl);
  await ctx.close();
  if (!gl) { await finish(); return; }

  section('[1] Gerçek köprü: platform ve eklentiler');
  ctx = await newContext();
  p = await launch(ctx, { seed: { 'pj-seen-help': '1' } });
  s = await p.evaluate(() => ({
    isNative: Capacitor.isNativePlatform(), plat: Capacitor.getPlatform(), our: Native.isNative,
    plugins: ['Haptics', 'Preferences', 'App'].every(n => !!Capacitor.Plugins[n]),
    styles: [...document.querySelectorAll('link[rel=stylesheet]')].map(l => l.getAttribute('href')),
    scripts: [...document.scripts].map(x => x.getAttribute('src')).filter(Boolean),
  }));
  check('isNativePlatform true, platform ios', s.isNative === true && s.plat === 'ios', s);
  check('oyun native olduğunu görüyor', s.our === true, s);
  check('Haptics, Preferences ve App enjekte', s.plugins, s);
  check('script ve font yolları yerel', s.scripts.every(x => x.startsWith('vendor/')) && s.styles.every(x => x.startsWith('vendor/')), s);
  await clean(p); await ctx.close();

  section('[2] Açılış aralığı: kayıt geri yüklenirken ekranda ne var');
  ctx = await newContext();
  p = await launch(ctx, { seed: { 'pj-save-v1': JSON.stringify(SAVED) }, opts: { latency: 1500 }, wait: false });
  await p.goto(base, { waitUntil: 'commit' });
  await p.waitForFunction(() => document.getElementById('app') && document.readyState !== 'loading', null, { timeout: 60000 });
  await sleep(700);
  s = await p.evaluate(() => {
    const vis = sel => { const n = document.querySelector(sel); if (!n) return false; const r = n.getBoundingClientRect(), c = getComputedStyle(n); return !n.hidden && c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
    return { started: !!window.__pj, app: getComputedStyle(document.getElementById('app')).visibility, bg: getComputedStyle(document.documentElement).backgroundColor,
      visible: ['#home', '#hudTop', '#hudBottom', '#gl', '#btnPlay', '#settingsOv', '#pauseOv', '#helpOv', '#failOv', '#buyOv', '#result', '#guideBanner', '#tut'].filter(vis) };
  });
  check('oyun geri yüklemeden önce başlamadı', s.started === false, s);
  check('aralıkta hazırlanmamış arayüz görünmüyor', s.app === 'hidden' && s.visible.length === 0, s);
  check('aralıkta zemin oyunun rengi', s.bg === 'rgb(29, 19, 70)', s.bg);
  await p.screenshot({ path: path.join(out, 'acilis-araligi.png') });
  await p.waitForFunction(() => window.__pj && window.__pj.save, null, { timeout: 60000 });
  await sleep(300);
  s = await p.evaluate(() => ({ coins: __pj.save().coins, ran: window.__native.gameRanBeforeKeys, app: getComputedStyle(document.getElementById('app')).visibility, home: !document.getElementById('home').hidden }));
  check('oyun kayıtla başladı (777 jeton)', s.coins === 777 && s.ran === false, s);
  check('başlayınca ana ekran görünür oldu', s.app === 'visible' && s.home, s);
  await clean(p); await ctx.close();

  section('[3] Debug girişleri uygulamada kapalı');
  ctx = await newContext();
  p = await launch(ctx, { query: '?level=45', before: () => { window.claude = { hot: { ready(cb) { window.__hotUsed = true; cb({}); } } }; } });
  s = await p.evaluate(() => ({ screen: __pj.G.screen, hot: !!window.__hotUsed }));
  check('?level= yok sayılıyor', s.screen === 'home', s);
  check('window.claude.hot yok sayılıyor', s.hot === false, s);
  await clean(p); await ctx.close();

  section('[4] Titreşim gücü ve 40 ms kısıtlama');
  ctx = await newContext();
  p = await launch(ctx);
  s = await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const C = window.__native.calls, rows = {};
    const take = async f => { C.length = 0; await wait(60); f(); await wait(30); return C.map(c => c.k).join(','); };
    for (const v of [5, 10, 11, 20, 21, 30]) rows[v] = await take(() => Native.haptic(v));
    rows.list = await take(() => Native.haptic([8, 40, 8]));
    rows.win = await take(() => Native.hapticWin());
    rows.lightBurst = (await take(() => { for (let i = 0; i < 10; i++) Native.haptic(6); })).split(',').length;
    await wait(60); Native.haptic(6); await wait(30); rows.lightAfterGap = C.length;
    rows.mediumBurst = (await take(() => { for (let i = 0; i < 5; i++) Native.haptic(15); })).split(',').length;
    return rows;
  });
  check('≤ 10 ms LIGHT', s[5] === 'impact:LIGHT' && s[10] === 'impact:LIGHT', s);
  check('11–20 ms MEDIUM', s[11] === 'impact:MEDIUM' && s[20] === 'impact:MEDIUM', s);
  check('> 20 ms HEAVY', s[21] === 'impact:HEAVY' && s[30] === 'impact:HEAVY', s);
  check('dizi WARNING', s.list === 'notification:WARNING', s);
  check('kazanma SUCCESS', s.win === 'notification:SUCCESS', s);
  check('hafif vuruş kısıtlı: 10 çağrıdan 1\'i gidiyor, aradan sonra yenisi', s.lightBurst === 1 && s.lightAfterGap === 2, s);
  check('orta vuruş kısıtlanmıyor', s.mediumBurst === 5, s);
  s = await p.evaluate(() => window.__native.webVibrations);
  check('uygulamada navigator.vibrate kullanılmıyor', s === 0, s);
  await clean(p); await ctx.close();

  section('[5] İlk kurulum ve gerçek dokunuşla oynama');
  ctx = await newContext();
  p = await launch(ctx);
  s = await p.evaluate(() => ({ coins: __pj.save().coins, screen: __pj.G.screen }));
  check('boş kayıtla ana ekran, 50 jeton', s.screen === 'home' && s.coins === 50, s);
  await p.tap('#btnPlay');
  await playReady(p); await sleep(300);
  s = await p.evaluate(() => ({ ctx: window.__native.actx ? window.__native.actx.state : null, ac: typeof window.AudioContext }));
  const HAS_AUDIO = s.ac !== 'undefined';
  if (HAS_AUDIO) check('ilk dokunuşla WebAudio açıldı', s.ctx === 'running', s);
  else note('bu motorda AudioContext yok: ses kontrolleri atlanıyor');
  await p.screenshot({ path: path.join(out, 'bolum1.png') });

  const drag = await p.evaluate(() => {
    const st = __pj.G.st, occ = new Set();
    st.blocks.forEach(b => { for (let x = b.x; x < b.x + b.w; x++) for (let y = b.y; y < b.y + b.h; y++) occ.add(x + ',' + y); });
    for (const b of st.blocks) {
      if (b.fixed) continue;
      const self = new Set(); for (let x = b.x; x < b.x + b.w; x++) for (let y = b.y; y < b.y + b.h; y++) self.add(x + ',' + y);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if ((b.axis === 'h' && dy) || (b.axis === 'v' && dx)) continue;
        let n = 0;
        for (let k = 1; k <= 3; k++) {
          let ok = true;
          for (let x = b.x; x < b.x + b.w; x++) for (let y = b.y; y < b.y + b.h; y++) {
            const X = x + dx * k, Y = y + dy * k;
            if (X < 0 || Y < 0 || X >= st.W || Y >= st.H || (occ.has(X + ',' + Y) && !self.has(X + ',' + Y))) ok = false;
          }
          if (!ok) break; n = k;
        }
        if (n) return { from: __pj.screenOf(b.x + b.w / 2, b.y + b.h / 2, 0.3), to: __pj.screenOf(b.x + b.w / 2 + dx * n, b.y + b.h / 2 + dy * n, 0.3), n };
      }
    }
    return null;
  });
  check('sürüklenecek blok bulundu', !!drag, drag);
  if (drag) {
    const before = await p.evaluate(() => ({ moves: __pj.G.moves, calls: window.__native.calls.length }));
    await p.mouse.move(drag.from.x, drag.from.y); await p.mouse.down();
    for (let i = 1; i <= 24; i++) { await p.mouse.move(drag.from.x + (drag.to.x - drag.from.x) * i / 24, drag.from.y + (drag.to.y - drag.from.y) * i / 24); await sleep(8); }
    await p.mouse.up(); await sleep(500);
    s = await p.evaluate(() => ({ moves: __pj.G.moves, calls: window.__native.calls.map(c => c.k) }));
    check(`sürükleme hamle yaptı (${drag.n} kare)`, s.moves > before.moves, s);
    check('sürüklemede hafif vuruş geldi', s.calls.slice(before.calls).includes('impact:LIGHT'), s.calls);
    const gap = await lightGap(p);
    check('hafif vuruşlar arası ≥ 40 ms', gap === Infinity || gap >= 39, gap);
  }

  section('[6] Arka plan ve geri dönüş');
  await p.evaluate(() => window.__native.fire('appStateChange', { isActive: false }));
  await sleep(250);
  s = await p.evaluate(() => ({ pause: !document.getElementById('pauseOv').hidden, frozen: __pj.G.pauseAt != null, st: window.__native.actx && window.__native.actx.state }));
  check('duraklama ekranı açıldı, saat durdu', s.pause && s.frozen, s);
  if (HAS_AUDIO) check('WebAudio suspended', s.st === 'suspended', s);
  await p.screenshot({ path: path.join(out, 'duraklama.png') });
  await p.evaluate(() => window.__native.fire('appStateChange', { isActive: true }));
  await sleep(300);
  s = await p.evaluate(() => ({ pause: !document.getElementById('pauseOv').hidden, st: window.__native.actx && window.__native.actx.state }));
  check('dönüşte duraklama ekranı bekliyor', s.pause, s);
  if (HAS_AUDIO) check('dönüşte WebAudio running', s.st === 'running', s);
  await p.tap('#btnResume'); await sleep(300);
  s = await p.evaluate(() => ({ pause: !document.getElementById('pauseOv').hidden, frozen: __pj.G.pauseAt != null }));
  check('Devam Et ile oyun sürdü', !s.pause && !s.frozen, s);
  for (let i = 0; i < 12; i++) await p.evaluate(a => window.__native.fire('appStateChange', { isActive: a }), i % 2 === 1);
  await sleep(300);
  await clean(p, 'hızlı geçişler dahil'); await ctx.close();
  ctx = await newContext();
  p = await launch(ctx, { seed: { 'pj-seen-help': '1' } });
  await p.evaluate(() => window.__native.fire('appStateChange', { isActive: false }));
  await sleep(100);
  s = await p.evaluate(() => ({ pause: !document.getElementById('pauseOv').hidden, screen: __pj.G.screen }));
  check('ana ekranda duraklama ekranı açılmıyor', !s.pause && s.screen === 'home', s);
  await clean(p); await ctx.close();

  section('[7] Tam oturum, kapatıp açma, depolama silinmesi');
  ctx = await newContext();
  p = await launch(ctx);
  await autoWin(p, 0);
  let calls = await callsOf(p);
  const counts = {}; calls.forEach(k => { counts[k] = (counts[k] || 0) + 1; });
  note('çağrılar: ' + JSON.stringify(counts));
  check('kazanmada tam 1 SUCCESS', counts['notification:SUCCESS'] === 1, counts);
  const gapAll = await lightGap(p);
  check('tüm oturumda hafif vuruşlar arası ≥ 40 ms', gapAll === Infinity || gapAll >= 39, gapAll);
  const first = await p.evaluate(() => ({ prefs: Object.fromEntries(window.__native.prefs), save: localStorage.getItem('pj-save-v1'), level: localStorage.getItem('pj-level'), game: __pj.save() }));
  check('kayıt iki depoda aynı', first.save === first.prefs['pj-save-v1'] && first.level === first.prefs['pj-level'], first.prefs);
  check('1. bölüm bitti, jeton arttı', first.game.unlocked === 2 && first.game.coins > 50, first.game);
  await clean(p); await p.close();
  p = await launch(ctx, { seed: first.prefs });
  s = await p.evaluate(() => __pj.save());
  check('kapat-aç: ilerleme aynı', s.unlocked === first.game.unlocked && s.coins === first.game.coins, s);
  await clean(p); await ctx.close();
  ctx = await newContext();   // brand-new storage: as if iOS evicted localStorage
  p = await launch(ctx, { seed: first.prefs });
  s = await p.evaluate(() => ({ game: __pj.save(), ls: localStorage.getItem('pj-save-v1') }));
  check('iOS localStorage\'ı silse de ilerleme geri geldi', s.game.unlocked === first.game.unlocked && s.game.coins === first.game.coins && !!s.ls, s);
  await clean(p);

  section('[8] Ayarlar: gerçek dokunuş, kalıcılık, sıfırlama');
  await p.tap('#btnSettings'); await sleep(250);
  await p.screenshot({ path: path.join(out, 'ayarlar.png') });
  await clearCalls(p);
  await p.tap('#setHaptics'); await sleep(120);
  s = await p.evaluate(() => ({ pref: window.__native.prefs.get('pj-haptics'), ls: localStorage.getItem('pj-haptics'), row: document.getElementById('setHaptics').textContent.trim(), calls: window.__native.calls.length }));
  check('Titreşim kapandı, iki depoya yazıldı, titremedi', s.pref === '0' && s.ls === '0' && s.row === 'Titreşim: Kapalı' && s.calls === 0, s);
  await p.tap('#setClose'); await sleep(150);
  await p.evaluate(() => { __pj.enterPlay(0); }); await sleep(400);
  await p.evaluate(() => { __pj.autoplay(8); });
  await p.waitForFunction(() => __pj.G.moves >= 2, null, { timeout: 90000 }); await sleep(300);
  calls = await callsOf(p);
  check('Titreşim kapalıyken oyunda çağrı yok', calls.length === 0, calls);
  const prefsOff = await p.evaluate(() => Object.fromEntries(window.__native.prefs));
  await ctx.close();
  ctx = await newContext();
  p = await launch(ctx, { seed: prefsOff });
  s = await p.evaluate(() => document.getElementById('setHaptics').textContent.trim());
  check('kapat-aç: Titreşim hâlâ kapalı', s === 'Titreşim: Kapalı', s);
  await p.tap('#btnSettings'); await sleep(200);
  await p.tap('#setHaptics'); await sleep(120);
  calls = await callsOf(p);
  check('tekrar açınca örnek titreşim', calls.length === 1, calls);
  await p.tap('#setSound'); await sleep(120);
  check('Ses kapandı, kaydedildi', (await p.evaluate(() => window.__native.prefs.get('pj-muted'))) === '1');
  await clearCalls(p);
  await p.tap('#setHaptics'); await p.tap('#setHaptics'); await sleep(120);
  calls = await callsOf(p);
  check('Ses kapalıyken Titreşim açık olsa da çağrı yok', calls.length === 0, calls);
  await p.tap('#setSound'); await sleep(100);
  await p.tap('#setReset'); await sleep(60); await p.tap('#setReset'); await sleep(300);
  const prefsReset = await p.evaluate(() => Object.fromEntries(window.__native.prefs));
  check('sıfırlama Preferences\'a yansıdı', JSON.parse(prefsReset['pj-save-v1']).coins === 50 && prefsReset['pj-level'] === '0', prefsReset);
  check('ipucu anahtarları Preferences\'tan silindi', !Object.keys(prefsReset).some(k => k.startsWith('pj-tut-')), Object.keys(prefsReset));
  await clean(p); await ctx.close();
  ctx = await newContext();
  p = await launch(ctx, { seed: prefsReset });
  s = await p.evaluate(() => ({ game: __pj.save(), tut: Object.keys(localStorage).filter(k => k.startsWith('pj-tut-')) }));
  check('sıfırlama sonrası kapat-aç: eski kayıt geri gelmiyor', s.game.coins === 50 && s.game.unlocked === 1 && s.tut.length === 0, s);
  await clean(p); await ctx.close();

  section('[9] Preferences hata verirse');
  ctx = await newContext();
  p = await launch(ctx, { opts: { failKeys: true } });
  s = await p.evaluate(() => ({ screen: __pj.G.screen, coins: __pj.save().coins }));
  check('oyun yine açılıyor', s.screen === 'home' && s.coins === 50, s);
  await ctx.close();

  section('[10] Silkele ve havlu');
  ctx = await newContext();
  p = await launch(ctx, { seed: { 'pj-seen-help': '1' } });
  await p.evaluate(() => { __pj.enterPlay(0); });
  await playReady(p); await sleep(300);
  await clearCalls(p);
  await p.tap('#bShake'); await sleep(350);
  const dirBtn = await p.$('#shakePick button[data-dir]');
  if (dirBtn) { await dirBtn.tap(); await sleep(1600); }
  calls = await callsOf(p);
  check('Silkele WARNING', calls.includes('notification:WARNING'), calls);
  await clean(p); await ctx.close();
  ctx = await newContext();
  p = await launch(ctx, { seed: { 'pj-seen-help': '1' } });
  await autoWin(p, 35);
  calls = await callsOf(p);
  note(`36. bölüm: ${calls.length} çağrı, WARNING=${calls.filter(k => k === 'notification:WARNING').length}`);
  check('36. bölüm (havlu) bitti, tam 1 SUCCESS', calls.filter(k => k === 'notification:SUCCESS').length === 1, calls);
  await clean(p); await ctx.close();

  section('[11] Ekran boyları: taşma ve esneme');
  for (const [name, vp] of Object.entries(PHONES)) {
    ctx = await newContext(vp);
    p = await launch(ctx, { seed: { 'pj-seen-help': '1', 'pj-save-v1': JSON.stringify(SAVED) } });
    s = await fits(p, ['#btnSettings', '#btnPlay']);
    check(`${vp.width}×${vp.height} ana ekran sığıyor`, !s.over && s.off.length === 0, s);
    await p.screenshot({ path: path.join(out, `ana-${name}.png`) });
    await p.evaluate(() => { __pj.enterPlay(6); }); await sleep(900);
    s = await fits(p, ['#btnPause', '#bUndo', '#bVac', '#bShake']);
    check(`${vp.width}×${vp.height} bölüm ekranı sığıyor`, !s.over && s.off.length === 0, s);
    await p.screenshot({ path: path.join(out, `bolum-${name}.png`) });
    await p.evaluate(() => { window.scrollTo(0, 400); document.documentElement.scrollTop = 400; document.body.scrollTop = 400; }); await sleep(60);
    s = await p.evaluate(() => ({ y: scrollY, h: document.documentElement.scrollTop, b: document.body.scrollTop }));
    check(`${vp.width}×${vp.height} sayfa kaydırılamıyor`, s.y === 0 && s.h === 0 && s.b === 0, s);
    await clean(p, `${vp.width}×${vp.height}`); await ctx.close();
  }

  section('[12] İnternet');
  check('uygulama hiçbir dış adrese istek yapmadı', externals.length === 0, externals.slice(0, 5));

  section('[13] Saf web: index.html, Capacitor yok, CDN açık');
  const online = await fetch(CDN_PROBE, { method: 'HEAD', signal: AbortSignal.timeout(8000) }).then(r => r.ok).catch(() => false);
  if (!online) note('CDN\'e ulaşılamadı: web bölümü ATLANDI, sonuç bu bölümü kapsamıyor');
  else {
    const web = await serve(ROOT);
    const webCtx = await browser.newContext({ viewport: PHONES.i15, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: UA });
    const openWeb = async query => {
      const page = await webCtx.newPage();
      trackErrors(page);
      await page.addInitScript(() => { window.__vib = []; navigator.vibrate = v => { window.__vib.push(v); return true; }; });
      await page.goto(web.base + query, { waitUntil: 'load', timeout: 90000 });
      await page.waitForFunction(() => window.__pj && window.__pj.save && document.getElementById('app').classList.contains('ready'), null, { timeout: 60000 });
      await sleep(500);
      return page;
    };
    p = await openWeb('');
    s = await p.evaluate(() => ({ native: Native.isNative, cap: typeof window.Capacitor, screen: __pj.G.screen, vis: getComputedStyle(document.getElementById('app')).visibility, three: THREE.REVISION, gsap: gsap.version }));
    check('Capacitor yok, ana ekran görünür', s.native === false && s.cap === 'undefined' && s.screen === 'home' && s.vis === 'visible', s);
    check('CDN sürümleri aynı', s.three === '128' && s.gsap === '3.12.5', s);
    await p.screenshot({ path: path.join(out, 'web-ana.png') });
    s = await p.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      await wait(60); Native.haptic(8); await wait(60); Native.haptic(30); Native.haptic([8, 40, 8]); Native.hapticWin();
      return JSON.stringify(window.__vib);
    });
    check('navigator.vibrate ms ve diziyi aynen alıyor', s === '[8,30,[8,40,8],30]', s);
    await p.tap('#btnSettings'); await sleep(200);
    await p.tap('#setHaptics'); await sleep(100);
    check('Titreşim ayarı kaydediliyor', (await p.evaluate(() => localStorage.getItem('pj-haptics'))) === '0');
    check('ana ekranda konsol temiz', p.errs.length === 0, p.errs);
    await p.close();
    p = await openWeb('?level=45');
    s = await p.evaluate(() => ({ screen: __pj.G.screen, idx: __pj.G.idx, row: document.getElementById('setHaptics').textContent.trim() }));
    check('?level=45 çalışıyor, ayar korundu', s.screen === 'play' && s.idx === 44 && s.row === 'Titreşim: Kapalı', s);
    check('bölümde konsol temiz', p.errs.length === 0, p.errs);
    await p.close(); await webCtx.close(); web.server.close();
  }

  await finish();
}

(async () => {
  const only = process.argv[2];
  if (only && only !== 'webkit' && only !== 'chromium') throw new Error(`unknown engine: ${only}`);
  checkBuild();
  for (const engine of only ? [only] : ['webkit', 'chromium']) await runEngine(engine);
  console.log(`\nSONUÇ: ${tally.passed} geçti, ${tally.failed} kaldı`);
  process.exit(tally.failed ? 1 : 0);
})().catch(e => { console.error('TEST DURDU:', e); process.exit(2); });
