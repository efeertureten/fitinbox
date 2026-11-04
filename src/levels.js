/* ==========================================================================
   FIT IN BOX — LEVEL BOOK (Sawtooth Zorluk Eğrisi:
   1–9 Rahat Başlangıç | 15, 25, 35... ZOR | 20, 30, 40... SÜPER ZOR (Zero Gap)
   x1, x2 ve x6, x7 bölümleri bol boşluklu nefes alma bölümleri)
   ========================================================================== */
(function (global) {
  'use strict';
  const PJ = global.PJ;

  const PHASE_NAMES = ['', 'Temel Yerleşim', 'Akıcı Kutular', 'Plaj Havlusu', 'Takı Kutusu & Organizer', 'Usta Paketleyici'];
  const INTROS = {
    1: '👆 Parlayan kapıya dokun: eşya içeri kayar!',
    2: '👆 Kutudaki eşyayı tut ve boşluğa kaydır!',
    4: 'Yeni: El konsolu 1×3. Kaydırarak kapı önünü aç.',
    7: 'Kutu büyüdü: 6×6. Rahatça yerleştir.',
    13: 'Dar kapı: eşyanın eni kapıya sığmalı.',
    15: 'Sadece 2 boşluk hakkın var. Yerleştirmeden önce düşün!',
    16: 'Nefes molası: 8 boşluk hakkın var.',
    20: 'Tek kare bile boş kalmamalı. Önce köşeleri doldur.',
    21: 'Yeni: ↔ ↕ oklu eşyalar yalnızca ok yönünde kayar.',
    25: 'Oklu eşyaları doğru eksendeki kapıdan gönder.',
    26: 'Yeni: Sabit bölme yerinden oynamaz.',
    30: 'Sıfır boşluk! Büyük eşyalara yer bırak.',
    35: 'Aynı kenardaki kapıları dikkatli kullan.',
    36: 'Yeni: Plaj havlusu. Duvara itmeye devam et: 1×3 → 1×2.',
    40: 'Tüm havluları sıkıştır, kutuyu %100 doldur.',
    45: 'Havluyu sıkıştırmak için arkasına sert eşya koy.',
    50: 'Sıfır boşluk: her kare dolmalı.',
    61: 'Yeni: Takı kutusu. Kıpırdamaz olunca kapağını tak.',
    64: 'Yeni: Organizer 2×3. Geniş kapıyı ona sakla.',
    70: 'Takı kutularını kilitle, sıfır boşlukla kapat.'
  };

  const HARD_LEVELS = new Set([15, 25, 35, 45, 55, 65, 75, 85, 95]);
  const SUPER_HARD_LEVELS = new Set([20, 30, 40, 50, 60, 70, 80, 90, 100]);
  /* Sawtooth ısı dizisi (n % 10): x0=Süper Zor(1.0), x1-x2=Rahat, x5=Zor(0.85), x6-x7=Nefes Alma */
  const HEAT = [1.0, 0.12, 0.20, 0.38, 0.52, 0.85, 0.18, 0.28, 0.50, 0.68];
  const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
  const phaseOf = n => n <= 15 ? 1 : n <= 35 ? 2 : n <= 60 ? 3 : n <= 85 ? 4 : 5;

  function tierOf(n) {
    if (SUPER_HARD_LEVELS.has(n)) return 'super';
    if (HARD_LEVELS.has(n)) return 'hard';
    const mod = n % 10;
    if (n <= 9 || mod === 1 || mod === 2 || mod === 6 || mod === 7) return 'easy';
    return 'normal';
  }

  function gridOf(n) {
    if (n <= 6) return [5, 5];
    if (n <= 35) return [6, 6];
    if (n <= 60) return [6, 7];
    if (n <= 85 || n === 90) return [7, 7];
    return [7, 8];
  }

  /* Boşluk hakkı doğrudan kare sayısı olarak tanımlanır (oran yuvarlaması kaymasın):
     1–3: 6 | 4–6: 5 | 7–9: 7 | 10: 4 | ZOR: 2–3 | SÜPER ZOR: 0 | nefes (x1,x2,x6,x7): 8–14 */
  const BREATH_GAPS = { 36: 8, 42: 10, 49: 12, 56: 14 };   // alan → nefes bölümü boşluğu
  const NORMAL_GAPS = { 36: 5, 42: 7, 49: 9, 56: 10 };     // alan → standart bölüm boşluğu
  function isBreather(n) { const m = n % 10; return m === 1 || m === 2 || m === 6 || m === 7; }
  function gapsOf(n, W, H) {
    const N = W * H;
    if (SUPER_HARD_LEVELS.has(n)) return 0;          // 20, 30, 40... → SIFIR BOŞLUK (%100 dolu)
    if (n <= 3) return 6;                            // 5×5, ferah başlangıç
    if (n <= 6) return 5;                            // 5×5
    if (n <= 9) return 7;                            // 6×6
    if (n === 10) return 4;
    if (HARD_LEVELS.has(n)) return n <= 35 ? 2 : 3;  // 15, 25, 35 → 2 · 45…95 → 3
    if (isBreather(n)) return BREATH_GAPS[N] || Math.round(N * 0.25);
    return NORMAL_GAPS[N] || Math.round(N * 0.18);
  }
  function fillOf(n, W, H) { return 1 - gapsOf(n, W, H) / (W * H); }

  function towelsOf(n) {
    if (n < 36) return 0;
    if (SUPER_HARD_LEVELS.has(n)) return n <= 70 ? 2 : 3;
    if (HARD_LEVELS.has(n)) return n <= 55 ? 2 : 3;
    const mod = n % 10;
    if (mod === 1 || mod === 2 || mod === 6 || mod === 7) return 1;
    return n <= 44 ? 1 : 2;
  }

  function boxesOf(n) {
    if (n < 61) return 0;
    if (SUPER_HARD_LEVELS.has(n)) return n <= 80 ? 2 : 3;
    if (HARD_LEVELS.has(n)) return 2;
    const mod = n % 10;
    if (mod === 1 || mod === 2 || mod === 6 || mod === 7) return 1;
    return n <= 74 ? 1 : 2;
  }

  function gateSpec(n) {
    const tier = tierOf(n);
    if (n <= 12) return { count: 4, lens: [3, 4], minLong: 4 };
    if (tier === 'easy') return { count: 4, lens: [3, 4], minLong: 3 };
    if (tier === 'super') {
      if (n <= 40) return { count: 4, lens: [2, 3], narrow: 1, minLong: 2 };
      return { count: 5, lens: [2, 3], minLong: 2 };
    }
    if (tier === 'hard') {
      if (n <= 25) return { count: 4, lens: [2, 3], narrow: 1, minLong: 2 };
      return { count: 3, lens: [2, 3], minLong: 2 };
    }
    if (n <= 30) return { count: 4, lens: [2, 3], minLong: 3 };
    return { count: 4, lens: [2, 3], minLong: 2 };
  }

  function makeGates(W, H, spec, R) {
    const ri = (a, b) => a + Math.floor(R() * (b - a + 1));
    const sides = ['top', 'right', 'bottom', 'left'];
    for (let t = 0; t < 300; t++) {
      const order = sides.slice();
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      const per = { top: 1, right: 1, bottom: 1, left: 1 };
      if (spec.count === 3) per[order[0]] = 0;
      if (spec.count === 5) per[order[0]] = 2;
      if (spec.count === 6) { per[order[0]] = 2; per[order[1]] = 2; }
      if (spec.count === 4 && spec.paired) { per[order[0]] = 2; per[order[1]] = 0; }
      const gates = [];
      let ok = true;
      for (const side of sides) {
        const L = (side === 'left' || side === 'right') ? H : W;
        if (per[side] === 1) {
          const len = Math.min(L, ri(spec.lens[0], spec.lens[1]));
          gates.push({ side, start: ri(0, L - len), len });
        } else if (per[side] === 2) {
          const l1 = ri(2, Math.min(3, spec.lens[1])), l2 = ri(spec.lens[0], spec.lens[1]);
          if (l1 + l2 + 1 > L) { ok = false; break; }
          const s1 = ri(0, L - l1 - l2 - 1), s2 = ri(s1 + l1 + 1, L - l2);
          gates.push({ side, start: s1, len: l1 }, { side, start: s2, len: l2 });
        }
      }
      if (!ok) continue;
      for (let k = 0; k < (spec.narrow || 0); k++) { const g = gates[Math.floor(R() * gates.length)]; g.len = 2; }
      if (gates.filter(g => g.len >= 3).length < (spec.minLong || 0)) continue;
      return gates;
    }
    return sides.map(side => ({ side, start: 0, len: 3 }));
  }

  function designLevel(n, variant) {
    variant = variant || 0;
    const phase = phaseOf(n), tier = tierOf(n), h = HEAT[n % 10], [W, H] = gridOf(n), N = W * H;
    const gapCount = gapsOf(n, W, H), fillTarget = fillOf(n, W, H);
    const items = {
      perfume: n <= 6 ? 0.15 : 0.18,
      passport: n <= 6 ? 1.35 : 1.15,
      console: n >= 4 ? 1.35 : 0,
      kit: n <= 6 ? 1.45 : 1.15,
      organizer: n >= 64 ? (n >= 71 ? 1.5 : 1.15) : 0
    };
    if (SUPER_HARD_LEVELS.has(n)) Object.assign(items, { perfume: 0.15, kit: 1.1, organizer: n >= 64 ? 1.0 : 0 });
    const axisByItem = {};
    if (n >= 21) axisByItem.passport = n === 21 ? 0.65 : (tier === 'easy' ? 0.20 : Math.min(0.55, lerp(0.28, 0.52, h)));
    if (n >= 31) axisByItem.console = n === 31 ? 0.55 : (tier === 'easy' ? 0.15 : lerp(0.22, 0.42, h));
    if (n >= 71) axisByItem.organizer = tier === 'easy' ? 0.15 : 0.35;
    if (n >= 36 && n <= 38) { axisByItem.passport = 0.15; axisByItem.console = 0; }
    if (n >= 61 && n <= 63) axisByItem.console = 0.15;
    if (n >= 64 && n <= 66) axisByItem.organizer = 0;
    const minItems = {};
    if (n === 4) minItems.console = 1;
    if (n >= 64) minItems.organizer = (n >= 75 && (tier === 'hard' || tier === 'super')) ? 2 : 1;
    let obstacles = n < 26 ? 0 : (tier === 'easy' && n < 50 ? 0 : n <= 55 ? 1 : 2);
    if (SUPER_HARD_LEVELS.has(n) && n >= 40) obstacles = 2;
    const preplaced = n <= 3 ? 3 : n <= 60 ? 2 : 3;   // 1–3: içeride hazır 3 eşya → kısa kuyruk
    const preShuffle = (n < 14 || tier === 'easy') ? 0 : ((tier === 'hard' || tier === 'super') ? 2 : 1);
    const maxOnes = n <= 6 ? 2 : (fillTarget >= 1 ? 1 : (tier === 'easy' ? 3 : 2));
    const targetCells = N - gapCount;
    const R = PJ.mulberry32(Math.imul(n + 1, 0x2C1B3C6D) ^ Math.imul(variant + 1, 0x297A2D39));
    const gates = makeGates(W, H, gateSpec(n), R);
    const titleLabel = tier === 'super' ? 'Süper Zor Kutu' : tier === 'hard' ? 'Zor Kutu' : tier === 'easy' ? 'Ferah Kutu' : 'Standart Kutu';
    return {
      n, phase, tier, phaseName: PHASE_NAMES[phase],
      name: titleLabel,
      code: 'BOX-' + String(n).padStart(2, '0'),
      W, H, seed: n * 101 + variant * 7919,
      fillTarget, gapPattern: gapCount <= 3 ? 'scatter' : 'pocket',
      zeroGap: SUPER_HARD_LEVELS.has(n) || fillTarget >= 1,
      items, axisByItem, minItems, gates, obstacles, preplaced, preShuffle,
      shuffle: phase <= 2 ? 0 : (tier !== 'easy' ? 0.04 : 0.01),
      soft: towelsOf(n), caps: boxesOf(n), maxOnes,
      minQueue: n <= 3 ? 3 : n <= 6 ? 4 : Math.max(4, Math.round(targetCells / 3.6) - preplaced - 1),
      minGatesUsed: (n <= 10 || tier === 'easy') ? 2 : Math.min(gates.length, 3),
      boosters: phase <= 3 ? { undo: 5, vac: 2, shake: 2 } : phase === 4 ? { undo: 4, vac: 2, shake: 2 } : { undo: 4, vac: 1, shake: 2 },
      intro: INTROS[n] || (tier === 'super' ? 'Sıfır boşluk: kutuda tek kare boş kalmamalı.' : tier === 'hard' ? 'Boşluk hakkın çok az: dikkatli yerleştir.' : null)
    };
  }

  const ENDLESS_SIZES = [[7, 7], [7, 8], [6, 8], [7, 8]];
  function endlessLevel(n, variant) {
    variant = variant || 0;
    const k = n - 101, [W, H] = ENDLESS_SIZES[k % ENDLESS_SIZES.length];
    const zero = n % 10 === 0, hard = n % 10 === 5;
    const tier = zero ? 'super' : hard ? 'hard' : (n % 10 <= 2 || n % 10 === 6 || n % 10 === 7) ? 'easy' : 'normal';
    const R = PJ.mulberry32(Math.imul(n + 1, 0x2C1B3C6D) ^ Math.imul(variant + 1, 0x297A2D39));
    return {
      n, phase: 5, tier, phaseName: 'Sonsuz Kutu', name: zero ? 'Süper Zor Kutu' : hard ? 'Zor Kutu' : 'Sonsuz Kutu',
      code: 'BOX-' + n, W, H, seed: n * 101 + variant * 7919,
      fillTarget: 1 - (zero ? 0 : hard ? 3 : tier === 'easy' ? (BREATH_GAPS[W * H] || 12) : (NORMAL_GAPS[W * H] || 9)) / (W * H),
      gapPattern: hard ? 'scatter' : 'pocket', zeroGap: zero,
      items: { perfume: 0.15, passport: 1.0, console: 1.1, kit: 0.9, organizer: 1.3 },
      axisByItem: { passport: 0.45, console: 0.35, organizer: 0.35 }, minItems: { organizer: 1 },
      gates: makeGates(W, H, zero ? { count: 5, lens: [2, 3], minLong: 2 } : { count: 4, lens: [2, 3], minLong: 2 }, R),
      obstacles: 2, preplaced: 3, preShuffle: 2, shuffle: 0.04, soft: 2, caps: 2, maxOnes: zero ? 1 : 3,
      minQueue: 7, minGatesUsed: 3, boosters: { undo: 4, vac: 1, shake: 2 }, intro: null
    };
  }

  function buildLevel(i) {
    const n = i + 1, baked = (global.PJ.BAKED || {})[n];
    const make = v => n <= 100 ? designLevel(n, v) : endlessLevel(n, v);
    if (baked) {
      const cfg = Object.assign(make(baked.v), { attempt: baked.a, attempts: 600 });
      const lv = PJ.generateLevel(cfg);
      if (lv) { lv.cfg = cfg; lv.index = i; lv.baked = lv.attempt === baked.a; return lv; }
    }
    for (let v = 0; v < 12; v++) {
      const cfg = Object.assign(make(v), { attempts: 900 });
      const lv = PJ.generateLevel(cfg);
      if (lv) { lv.cfg = cfg; lv.index = i; lv.baked = false; return lv; }
    }
    return null;
  }

  PJ.designLevel = designLevel;
  PJ.endlessLevel = endlessLevel;
  PJ.buildLevel = buildLevel;
  PJ.phaseOf = phaseOf;
  PJ.tierOf = tierOf;
  PJ.LEVEL_COUNT = 100;
})(typeof window !== 'undefined' ? window : globalThis);
