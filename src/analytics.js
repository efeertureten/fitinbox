/* ==========================================================================
   Fit in Box — playtest analytics (window.PJA, global trackEvent)
   Web build: events go to PostHog when window.PJ_ANALYTICS = { key, host, release } is present.
   App build: no config is injected → events stay on the device (console + last 200 in memory).
   Screens/overlays are derived from the DOM (hidden attributes), so the game only calls a few hooks:
     PJA.levelStart(info) · PJA.levelWin(info) · PJA.levelFail(info) · PJA.booster(kind, source)
     PJA.buy(kind, price, where) · PJA.reject(text) · PJA.tutorial(kind) · PJA.chest(info) · PJA.frame(dt)
   ========================================================================== */
(function (g) {
  'use strict';
  const cfg = g.PJ_ANALYTICS || null;
  const OPT_KEY = 'pj-analytics-off', SEEN_KEY = 'pj-analytics-seen', TESTER_KEY = 'pj-tester';
  const ls = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  const now = () => performance.now();
  const r1 = x => Math.round(x * 10) / 10;

  /* ---------- tester name from ?u=ali (kept for later visits) ---------- */
  const qp = new URLSearchParams(location.search);
  let tester = (qp.get('u') || ls.get(TESTER_KEY) || '').trim().toLowerCase();
  if (!/^[\p{L}0-9_.-]{1,24}$/u.test(tester)) tester = '';
  if (tester) ls.set(TESTER_KEY, tester);
  if (qp.has('noanalytics')) ls.set(OPT_KEY, '1');

  /* ---------- transport ---------- */
  const log = [];                       // last 200 events (also the app build's only sink)
  const pending = [];                   // events captured before PostHog finished loading
  let ph = null, optedOut = ls.get(OPT_KEY) === '1';
  const base = {
    release: (cfg && cfg.release) || 'local',
    platform: (g.Capacitor && g.Capacitor.isNativePlatform && g.Capacitor.isNativePlatform()) ? 'app' : 'web',
    tester: tester || null,
    screen_w: screen.width, screen_h: screen.height, dpr: Math.round((g.devicePixelRatio || 1) * 100) / 100,
    touch: 'ontouchstart' in g || navigator.maxTouchPoints > 0,
    lang: navigator.language || ''
  };
  function send(name, props, beacon) {
    const p = Object.assign({}, props || {});
    log.push({ t: Date.now(), name, props: p }); if (log.length > 200) log.shift();
    if (cfg && cfg.debug) console.debug('[PJA]', name, p);
    if (optedOut || !cfg || !cfg.key) return;
    if (ph) ph.capture(name, p, beacon ? { transport: 'sendBeacon' } : undefined);
    else pending.push([name, p]);
  }
  function loadPostHog() {
    if (!cfg || !cfg.key || optedOut) return;
    const s = document.createElement('script');
    s.async = true; s.crossOrigin = 'anonymous';
    s.src = cfg.host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
    s.onload = () => {
      const p = g.posthog; if (!p || !p.init) return;
      p.init(cfg.key, {
        api_host: cfg.host,
        person_profiles: 'identified_only',
        capture_pageview: true, capture_pageleave: true, autocapture: true,
        session_recording: { maskAllInputs: true, recordCrossOriginIframes: false },
        loaded: inst => {
          ph = inst;
          inst.register(base);
          if (tester) inst.identify('tester:' + tester, { name: tester, first_release: base.release });
          pending.splice(0).forEach(([n, pr]) => inst.capture(n, pr));
        }
      });
    };
    document.head.appendChild(s);
  }

  /* ---------- screen time (derived from what is visible) ---------- */
  const $ = id => document.getElementById(id);
  const OVERLAYS = ['settingsOv', 'buyOv', 'helpOv', 'pauseOv', 'failOv', 'queueOv'];
  function currentScreen() {
    const vis = id => { const n = $(id); return n && !n.hidden; };
    if (vis('result')) return 'result';
    for (const id of OVERLAYS) if (vis(id)) return id.replace('Ov', '');
    if (vis('home')) return vis('panelShop') ? 'shop' : vis('panelMap') ? 'map' : 'home';
    if (vis('hudTop')) return 'play';
    return 'boot';
  }
  let scr = null, scrT0 = now(), visible = !document.hidden;
  const screenTotals = {};
  function closeScreen(beacon) {
    if (!scr) return;
    const sec = visible ? (now() - scrT0) / 1000 : 0;
    if (sec >= 0.3 && scr !== 'boot') {
      screenTotals[scr] = (screenTotals[scr] || 0) + sec;
      send('screen_time', { screen: scr, duration_sec: r1(sec), level: lvl ? lvl.level : null }, beacon);
    }
  }
  function syncScreen() {
    const s = currentScreen();
    if (s === scr) return;
    const prev = scr;
    closeScreen();
    scr = s; scrT0 = now();
    if (s !== 'boot') send('screen_view', { screen: s, from: prev, level: lvl ? lvl.level : null });
    if (lvl && (s === 'home' || s === 'shop' || s === 'map')) endLevel('quit');
    if (lvl) lvl.paused = s !== 'play';
  }

  /* ---------- level sessions ---------- */
  let lvl = null, stats = () => ({});
  const attempts = {};
  const sess = { t0: now(), started: 0, won: 0, failed: 0, maxLevel: 0, boosters: 0 };
  function lvlActive() { return lvl && !lvl.paused && visible; }
  function endLevel(outcome, extra, beacon) {
    if (!lvl) return;
    const L = lvl; lvl = null;
    const st = stats() || {};
    const fr = L.frames;
    send(outcome === 'win' ? 'level_win' : 'level_end', Object.assign({
      outcome, level: L.level, tier: L.tier, grid: L.grid, gaps: L.gaps, attempt: L.attempt,
      time_sec: r1(L.activeMs / 1000), moves: st.moves, boosters_used: st.boostersUsed, power_used: st.powerUsed,
      queue_left: st.queueLeft, fill_pct: st.fillPct, fails: L.fails, rejects: L.rejects, reject_reasons: L.reasons,
      fps_avg: fr.n ? Math.round(fr.n / (fr.sum || 1)) : null, slow_frame_pct: fr.n ? Math.round(fr.slow / fr.n * 100) : null
    }, extra || {}), beacon);
  }
  const PJA = {
    track: (name, props) => send(name, props),
    events: () => log.slice(),
    setStats(fn) { stats = fn; },
    levelStart(info) {
      syncScreen();                                   // close the previous screen before this level owns the time
      if (lvl) endLevel(lvl.level === info.level ? 'restart' : 'switch');
      attempts[info.level] = (attempts[info.level] || 0) + 1;
      lvl = { level: info.level, tier: info.tier, grid: info.grid, gaps: info.gaps, attempt: attempts[info.level],
        activeMs: 0, lastT: 0, fails: 0, rejects: 0, reasons: {}, paused: false, frames: { n: 0, sum: 0, slow: 0 } };
      sess.started++; sess.maxLevel = Math.max(sess.maxLevel, info.level);
      send('level_start', Object.assign({ attempt: lvl.attempt }, info));
      syncScreen();
    },
    levelWin(info) { sess.won++; endLevel('win', info); },
    levelFail(info) {
      if (!lvl) return;
      lvl.fails++; sess.failed++;
      const st = stats() || {};
      send('level_fail', Object.assign({ level: lvl.level, tier: lvl.tier, attempt: lvl.attempt, time_sec: r1(lvl.activeMs / 1000),
        moves: st.moves, queue_left: st.queueLeft, fill_pct: st.fillPct }, info || {}));
    },
    booster(kind, source) {
      sess.boosters++;
      send('booster_use', { kind, source, level: lvl ? lvl.level : null, tier: lvl ? lvl.tier : null });
    },
    buy(kind, price, where) { send('booster_buy', { kind, price, where, level: lvl ? lvl.level : null }); },
    offer(kind, canAfford) { send('booster_offer', { kind, can_afford: canAfford, level: lvl ? lvl.level : null }); },
    reject(text) {
      const reason = String(text || '').replace(/\d+/g, '#').slice(0, 60);
      if (lvl) { lvl.rejects++; lvl.reasons[reason] = (lvl.reasons[reason] || 0) + 1; }
      send('move_rejected', { reason, level: lvl ? lvl.level : null });
    },
    tutorial(kind) { send('tutorial_step', { kind, level: lvl ? lvl.level : null, time_sec: lvl ? r1(lvl.activeMs / 1000) : null }); },
    chest(info) { send('chest_open', info); },
    feature(name, props) { send('feature_use', Object.assign({ feature: name, screen: scr, level: lvl ? lvl.level : null }, props || {})); },
    frame() {
      const t = now();
      if (!lvlActive()) { if (lvl) lvl.lastT = 0; return; }
      const d = lvl.lastT ? Math.min(1000, t - lvl.lastT) : 0;   // real wall time; gaps >1 s (tab hidden) are dropped
      lvl.lastT = t;
      if (!d) return;
      lvl.activeMs += d;
      const f = lvl.frames; f.n++; f.sum += d / 1000; if (d > 34) f.slow++;
    }
  };
  g.PJA = PJA;
  g.trackEvent = (name, data) => send(name, data);      // name used in IOS_MAGAZA_PLANI.md, Adım 3

  /* ---------- lifecycle ---------- */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { closeScreen(true); visible = false; }
    else { visible = true; scrT0 = now(); }
  });
  g.addEventListener('pagehide', () => {
    if (lvl) endLevel('abandon', null, true);
    closeScreen(true);
    send('session_end', { duration_sec: r1((now() - sess.t0) / 1000), levels_started: sess.started, levels_won: sess.won,
      fails: sess.failed, max_level: sess.maxLevel, boosters: sess.boosters,
      screen_totals: Object.fromEntries(Object.entries(screenTotals).map(([k, v]) => [k, r1(v)])) }, true);
  });
  let errCount = 0;
  g.addEventListener('error', e => { if (errCount++ < 10) send('js_error', { message: String(e.message).slice(0, 200), source: (e.filename || '').split('/').pop(), line: e.lineno }); });
  g.addEventListener('unhandledrejection', e => { if (errCount++ < 10) send('js_error', { message: String(e.reason && e.reason.message || e.reason).slice(0, 200), source: 'promise' }); });

  /* ---------- first-visit notice (web playtest only) ---------- */
  function notice() {
    if (!cfg || !cfg.key || ls.get(SEEN_KEY)) return;
    const box = document.createElement('div');
    box.className = 'pja-note'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Test sürümü bilgisi');
    box.innerHTML = '<b>🧪 Test sürümü</b><span>Oynayışın anonim olarak ölçülür: süreler, bölümler, kullanılan özellikler ve ekran kaydı. Kişisel bilgi toplanmaz.</span>' +
      '<div><button type="button" data-a="ok">Tamam</button><button type="button" data-a="off">Ölçme</button></div>';
    const css = document.createElement('style');
    css.textContent = '.pja-note{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:999;width:min(92vw,380px);' +
      'display:grid;gap:6px;padding:12px 14px;border-radius:16px;background:rgba(18,12,52,.96);color:#fff;border:2px solid #7C70F0;' +
      'box-shadow:0 10px 26px rgba(0,0,0,.45);font:600 13px/1.35 Fredoka,system-ui,sans-serif}.pja-note b{font-size:14px}' +
      '.pja-note div{display:flex;gap:8px;justify-content:flex-end}.pja-note button{font:700 13px Fredoka,system-ui,sans-serif;border-radius:10px;padding:7px 14px;border:2px solid #0E0B32;cursor:pointer}' +
      '.pja-note [data-a=ok]{background:#3BD34A;color:#06280C}.pja-note [data-a=off]{background:transparent;color:#C3CEFF;border-color:#4A40A8}';
    document.head.appendChild(css); document.body.appendChild(box);
    box.addEventListener('click', e => {
      const a = e.target.closest('button'); if (!a) return;
      ls.set(SEEN_KEY, '1');
      if (a.dataset.a === 'off') {
        send('analytics_opt_out', {});
        optedOut = true; ls.set(OPT_KEY, '1');
        if (ph) ph.opt_out_capturing();
      }
      box.remove();
    });
  }

  function boot() {
    const mo = new MutationObserver(syncScreen);
    ['result', 'home', 'panelShop', 'panelMap', 'hudTop'].concat(OVERLAYS).forEach(id => { const n = $(id); if (n) mo.observe(n, { attributes: true, attributeFilter: ['hidden'] }); });
    send('session_start', { entry: qp.has('level') ? 'deeplink' : 'home', referrer: document.referrer ? new URL(document.referrer).hostname : null,
      returning: !!ls.get('pj-save-v1') });
    syncScreen();
    loadPostHog();
    notice();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
