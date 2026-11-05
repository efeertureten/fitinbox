#!/usr/bin/env node
/* Assemble the single-file game: src/page.html + CDN libs + engine/levels/game → index.html
   --target app: same page with local vendor/ paths instead of CDNs → www/ (offline, for Capacitor) */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const targetFlag = process.argv.indexOf('--target');
const target = targetFlag < 0 ? 'web' : process.argv[targetFlag + 1];
if (target !== 'web' && target !== 'app') throw new Error(`unknown --target: ${target}`);

const page = read('src/page.html').replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '');
const cut = page.search(/<svg width="0" height="0"|<div id="app">/);   // body starts at the shared SVG sprites (if any), else at #app
const head = page.slice(0, cut).trim(), body = page.slice(cut).trim();
const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1E1448">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}[hidden]{display:none!important}</style>
${head}
</head>
<body>
${body}
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script>
${read('src/engine.js')}
${read('src/levels.js')}
${read('src/levels.baked.js')}
${read('src/icons.js')}
</script>
<script>
${read('src/hud-icons.js')}
</script>
<script>
${read('src/home-icons.js')}
</script>
<script>
${read('src/game.js')}
</script>
</body>
</html>
`;

const APP_SWAPS = [
  // WKWebView honours these limits, so pinch and double-tap zoom stay off in the app
  ['<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
   '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">'],
  ['<link rel="preconnect" href="https://fonts.googleapis.com">\n', ''],
  ['<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n', ''],
  ['<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bungee&family=DM+Mono:wght@500&family=Fredoka:wght@500;600;700&display=swap">',
   '<link rel="stylesheet" href="vendor/fonts/fonts.css">'],
  ['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'vendor/three.min.js'],
  ['https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', 'vendor/gsap.min.js'],
];

if (target === 'app') {
  const app = APP_SWAPS.reduce((out, [from, to]) => {
    if (!out.includes(from)) throw new Error(`--target app: not found in page: ${from}`);
    return out.replace(from, () => to);
  }, html);
  const remote = app.match(/https?:\/\/(?!www\.w3\.org)[^"'\s)]+/);   // the store build must open with no network
  if (remote) throw new Error(`--target app: remote URL left in page: ${remote[0]}`);
  const www = path.join(ROOT, 'www');
  fs.rmSync(www, { recursive: true, force: true });
  fs.cpSync(path.join(ROOT, 'vendor'), path.join(www, 'vendor'), { recursive: true });
  fs.writeFileSync(path.join(www, 'index.html'), app);
  console.log('www/index.html', (app.length / 1024).toFixed(1) + ' KB');
} else {
  fs.writeFileSync(path.join(ROOT, 'index.html'), html);
  console.log('index.html', (html.length / 1024).toFixed(1) + ' KB');
}
