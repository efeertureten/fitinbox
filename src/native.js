/* ==========================================================================
   NATIVE — Capacitor plugins behind one door, with a safe web fallback.
   iOS injects window.Capacitor.Plugins before any page script runs, so no JS
   package is loaded here; on the web window.Capacitor is simply undefined.
   ========================================================================== */
window.Native = (function () {
  'use strict';
  const cap = window.Capacitor;
  const isNative = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const plugin = name => (isNative && cap.Plugins && cap.Plugins[name]) || null;
  const Prefs = plugin('Preferences'), Haptics = plugin('Haptics'), App = plugin('App');
  const quiet = fn => { try { const p = fn(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* plugin unavailable */ } };

  /* ---- storage: the game reads localStorage, but iOS may evict it under pressure, so Preferences keeps the real copy ---- */
  const store = {
    set(k, v) {
      try { localStorage.setItem(k, v); } catch (e) { /* storage blocked: lives for this session */ }
      if (Prefs) quiet(() => Prefs.set({ key: k, value: String(v) }));
    },
    remove(k) {
      try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
      if (Prefs) quiet(() => Prefs.remove({ key: k }));
    }
  };
  function restore() {
    return Prefs.keys().then(({ keys }) => Promise.all(keys.filter(k => k.startsWith('pj-')).map(k =>
      Prefs.get({ key: k }).then(({ value }) => { if (value != null) localStorage.setItem(k, value); }))));
  }
  /* runs the game once saved progress is back; synchronous on the web, where there is nothing to wait for.
     No timeout on purpose: starting early would write a fresh save over the real one. */
  function ready(fn) {
    if (!Prefs) { fn(); return; }
    Promise.resolve().then(restore).catch(e => console.warn('save restore failed', e)).then(() => fn());
  }

  /* ---- haptics: ms picks the strength on iOS, ms[] is a reject pattern; the web keeps navigator.vibrate ---- */
  const LIGHT_GAP = 40;   // drags fire a light tap per cell: any faster and the phone just buzzes
  let lastLight = -Infinity;
  const vibrate = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* not allowed */ } };
  function haptic(ms) {
    const list = Array.isArray(ms);
    if (!list && ms <= 10) {
      const now = performance.now();
      if (now - lastLight < LIGHT_GAP) return;
      lastLight = now;
    }
    if (!Haptics) vibrate(ms);
    else if (list) quiet(() => Haptics.notification({ type: 'WARNING' }));
    else quiet(() => Haptics.impact({ style: ms <= 10 ? 'LIGHT' : ms <= 20 ? 'MEDIUM' : 'HEAVY' }));
  }
  function hapticWin() {
    if (Haptics) quiet(() => Haptics.notification({ type: 'SUCCESS' })); else vibrate(30);
  }

  /* ---- lifecycle ---- */
  function onAppState(fn) { if (App) quiet(() => App.addListener('appStateChange', s => fn(s.isActive))); }

  return { isNative, store, ready, haptic, hapticWin, onAppState };
})();
