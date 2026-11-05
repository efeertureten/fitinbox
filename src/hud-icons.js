/* v7 HUD icons — inline SVG strings (ids prefixed "q7" to avoid clashes). */
(function (g) {
  const O = '#2A1406';
  const sp = (x, y, s, c, o) => `<path d="M${x} ${y - s}q${s * .16} ${s * .84} ${s} ${s}q${-s * .84} ${s * .16} ${-s} ${s}q${-s * .16} ${-s * .84} ${-s} ${-s}q${s * .84} ${-s * .16} ${s} ${-s}z" fill="${c || '#fff'}"${o ? ` opacity="${o}"` : ''}/>`;

  const DEFS = `<svg width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>
    <radialGradient id="q7CoinOuter" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#FFF7B8"/><stop offset=".42" stop-color="#FFD53A"/><stop offset=".85" stop-color="#F2A310"/><stop offset="1" stop-color="#D9860A"/></radialGradient>
    <radialGradient id="q7CoinInner" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#FFE466"/><stop offset="1" stop-color="#F0A615"/></radialGradient>
    <linearGradient id="q7Lock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E7A867"/><stop offset=".55" stop-color="#C47A3C"/><stop offset="1" stop-color="#9A5524"/></linearGradient>
    <radialGradient id="q7Glow" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#FFD84A" stop-opacity=".55"/><stop offset="1" stop-color="#FFD84A" stop-opacity="0"/></radialGradient>
    <linearGradient id="q7FlameO" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF7A2A"/><stop offset=".6" stop-color="#F4401C"/><stop offset="1" stop-color="#D7261A"/></linearGradient>
    <linearGradient id="q7FlameI" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE45C"/><stop offset="1" stop-color="#FF9A1F"/></linearGradient>
    <linearGradient id="q7Handle" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9A5A2C"/><stop offset=".45" stop-color="#C9844A"/><stop offset="1" stop-color="#7A421C"/></linearGradient>
    <linearGradient id="q7Straw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE3A0"/><stop offset=".55" stop-color="#EBC06A"/><stop offset="1" stop-color="#C8913A"/></linearGradient>
    <linearGradient id="q7Saucer" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D2A8FF"/><stop offset=".5" stop-color="#9152EC"/><stop offset="1" stop-color="#5E2AB4"/></linearGradient>
    <linearGradient id="q7Dome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D8FFFA"/><stop offset=".5" stop-color="#6FE0DA"/><stop offset="1" stop-color="#2E9EAE"/></linearGradient>
    <linearGradient id="q7Under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF9AD8"/><stop offset="1" stop-color="#E85AB4"/></linearGradient>
    <linearGradient id="q7Arrow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4E9EE"/></linearGradient>
  </defs></svg>`;

  /* gold coin with padlock (40×40); glow + sparkles when big */
  const coin = (glow) => `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" class="q7-coin">
    ${glow ? '<circle cx="20" cy="20" r="20" fill="url(#q7Glow)"/>' : ''}
    <circle cx="20" cy="20" r="16.5" fill="url(#q7CoinOuter)" stroke="#B86E06" stroke-width="1.6"/>
    <circle cx="20" cy="20.5" r="12.6" fill="url(#q7CoinInner)" stroke="#D88A0C" stroke-width="1.2"/>
    <path d="M28.6 13.6A11 11 0 1 0 29.4 27" fill="none" stroke="#FFEE9A" stroke-width="2.6" stroke-linecap="round" opacity=".9"/>
    <path d="M16.2 18.6v-2.4a3.8 3.8 0 0 1 7.6 0v2.4" fill="none" stroke="#7A3F14" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M16.2 18.6v-2.4a3.8 3.8 0 0 1 7.6 0v2.4" fill="none" stroke="#D69256" stroke-width="2" stroke-linecap="round"/>
    <rect x="13.6" y="18" width="12.8" height="10" rx="2.6" fill="url(#q7Lock)" stroke="#7A3F14" stroke-width="1.3"/>
    <path d="M15 19.4h10" stroke="#F4C38E" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>
    <circle cx="20" cy="22.3" r="1.5" fill="#5A2A0C"/><path d="M20 23v2.4" stroke="#5A2A0C" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M10.5 12.5a12 12 0 0 1 6-4.6" stroke="#FFFFFF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>
    ${glow ? sp(33.5, 8.5, 2.6, '#FFF6C0') + sp(6, 32, 2, '#FFF6C0', .85) + '<circle cx="36" cy="27" r=".9" fill="#FFF6C0"/>' : ''}
  </svg>`;

  const flame = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="q7-flame">
    <path d="M12.6 1.6c.6 3.4 3.5 5 5.4 8 1.6 2.6 1.4 6.3-.6 8.6A7.2 7.2 0 0 1 4.6 15c0-2.6 1.3-4.4 2.6-5.6.1 1.6.8 2.8 2 3.4-.5-3.6 1.1-7.2 3.4-11.2z" fill="url(#q7FlameO)" stroke="#8E1A0C" stroke-width=".9" stroke-linejoin="round"/>
    <path d="M12.3 10.2c.4 1.8 2.6 2.8 3 5 .4 2.4-1.2 4.4-3.4 4.4s-3.6-1.8-3.4-3.8c.1-1.3.8-2.2 1.6-2.8 0 .9.4 1.6 1.1 1.9-.2-1.8.2-3.3 1.1-4.7z" fill="url(#q7FlameI)"/>
    <path d="M8 12.6c.2-1 .7-1.8 1.3-2.4" stroke="#FFD2A0" stroke-width="1" stroke-linecap="round" opacity=".7"/>
  </svg>`;

  const skull = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="q7-skull">
    <path d="M12 2.5c-5 0-8.5 3.3-8.5 7.8 0 2.6 1.2 4.3 2.8 5.3v2.6c0 .9.7 1.6 1.6 1.6h8.2c.9 0 1.6-.7 1.6-1.6v-2.6c1.6-1 2.8-2.7 2.8-5.3 0-4.5-3.5-7.8-8.5-7.8z" fill="#F4F1FF" stroke="#2A1640" stroke-width="1.3"/>
    <ellipse cx="8.6" cy="11" rx="2.4" ry="2.6" fill="#2A1640"/><ellipse cx="15.4" cy="11" rx="2.4" ry="2.6" fill="#2A1640"/>
    <path d="M12 13.6l-1.2 2.2h2.4z" fill="#2A1640"/><path d="M9.6 18v2.2M12 18v2.2M14.4 18v2.2" stroke="#2A1640" stroke-width="1.1"/>
  </svg>`;

  /* red exclamation + flame (banner, hard) */
  const alertFlame = `<svg viewBox="0 0 34 30" aria-hidden="true" focusable="false" class="q7-alert">
    <path d="M5.2 3.5h4.4l-.9 15.2H6.1z" fill="#FF3B3B" stroke="#6E0A0A" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="7.4" cy="24.2" r="2.7" fill="#FF3B3B" stroke="#6E0A0A" stroke-width="1.2"/>
    <path d="M6.2 5l.4 9" stroke="#FFB0A0" stroke-width="1" stroke-linecap="round"/>
    <g transform="translate(10 3) scale(1.05)">
      <path d="M12.6 1.6c.6 3.4 3.5 5 5.4 8 1.6 2.6 1.4 6.3-.6 8.6A7.2 7.2 0 0 1 4.6 15c0-2.6 1.3-4.4 2.6-5.6.1 1.6.8 2.8 2 3.4-.5-3.6 1.1-7.2 3.4-11.2z" fill="url(#q7FlameO)" stroke="#8E1A0C" stroke-width=".9" stroke-linejoin="round"/>
      <path d="M12.3 10.2c.4 1.8 2.6 2.8 3 5 .4 2.4-1.2 4.4-3.4 4.4s-3.6-1.8-3.4-3.8c.1-1.3.8-2.2 1.6-2.8 0 .9.4 1.6 1.1 1.9-.2-1.8.2-3.3 1.1-4.7z" fill="url(#q7FlameI)"/>
    </g>
    ${sp(31, 5, 1.8, '#FFE9A0')}<circle cx="2.5" cy="12" r=".9" fill="#FFE9A0"/>
  </svg>`;
  const alert = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="q7-alert1">
    <circle cx="12" cy="12" r="10" fill="#FF4B3B" stroke="#6E0A0A" stroke-width="1.4"/>
    <path d="M12 6.2v7.2" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/><circle cx="12" cy="17.3" r="1.7" fill="#fff"/>
    <path d="M6 8.5a7 7 0 0 1 3-3" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6"/>
  </svg>`;
  const bulb = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="q7-bulb">
    <path d="M12 2.5a7 7 0 0 0-4.2 12.6c.8.6 1.2 1.4 1.2 2.3h6c0-.9.4-1.7 1.2-2.3A7 7 0 0 0 12 2.5z" fill="#FFD84A" stroke="#7A4A06" stroke-width="1.3"/>
    <rect x="8.8" y="17.4" width="6.4" height="3.6" rx="1.2" fill="#B9C2E0" stroke="#3A3F66" stroke-width="1.1"/>
    <path d="M9 7.5a3.6 3.6 0 0 1 3-2.2" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </svg>`;
  const check = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="q7-check">
    <circle cx="12" cy="12" r="10" fill="#38D63A" stroke="#0B5A10" stroke-width="1.4"/>
    <path d="M7 12.4l3.2 3.2L17.2 8.6" stroke="#fff" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  const hand = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" class="q7-hand">
    <path d="M9.2 3.6c0-1 .8-1.7 1.7-1.7s1.7.8 1.7 1.7v6.2l5 .9c1.3.2 2.1 1.4 1.9 2.7l-.8 4.6c-.3 1.9-2 3.3-3.9 3.3H11c-1.2 0-2.3-.6-3-1.6l-3.2-4.7c-.5-.8-.3-1.8.5-2.3.7-.4 1.6-.3 2.1.3l1.8 2z" fill="#FFE0C2" stroke="#4A2410" stroke-width="1.3" stroke-linejoin="round"/>
  </svg>`;

  /* ---- booster icons (64×64) ---- */
  const undo = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" class="boost-svg q7-undo">
    <g transform="translate(0 2)">
      <path d="M33 16A15 15 0 1 1 18.5 33.5" fill="none" stroke="#3A4542" stroke-width="12.5" stroke-linecap="round" opacity=".35" transform="translate(0 2.4)"/>
      <path d="M33 16A15 15 0 1 1 18.5 33.5" fill="none" stroke="url(#q7Arrow)" stroke-width="10" stroke-linecap="round"/>
      <path d="M36.5 5.5v21L19.5 16z" fill="url(#q7Arrow)" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round"/>
      <path d="M38 22.5A12 12 0 0 1 44 33" fill="none" stroke="#C9D2DA" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
    </g>
  </svg>`;
  const broom = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" class="boost-svg q7-broom"><g transform="translate(-6.4 -5.6) scale(1.2)">
    <path d="M7 44q3-3 7-3M5 51q4-2 8-1" stroke="#E9FFE0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M50 5.5L31.5 33" stroke="#4A2410" stroke-width="7.6" stroke-linecap="round"/>
    <path d="M50 5.5L31.5 33" stroke="url(#q7Handle)" stroke-width="5" stroke-linecap="round"/>
    <path d="M48.6 8.4l-7 10.4" stroke="#F0B67E" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>
    <path d="M26.5 32.5l9 6.2-4.8 5.4c-4.6 6.8-9.6 12-16.8 15.4-1.6-.6-2.6-1.8-3-3.4 2.2-6.6 6-12.4 11.2-17z" fill="url(#q7Straw)" stroke="#6E4314" stroke-width="2" stroke-linejoin="round"/>
    <path d="M24.4 38.6l7.6 5.2M20 46.5c3.2-2.6 6-5.6 8.4-8.6M16.6 52.6c3.8-3.4 7-7.4 9.8-11.6M22.6 52.6c2.6-2.4 4.8-5.2 6.8-8" stroke="#B67D2C" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/>
    <path d="M27.8 30.6l9.4 6.6-2.2 3.2-9.4-6.6z" fill="#B7472A" stroke="#4A1A0C" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M28.6 31.8l7.4 5.2" stroke="#F08A6A" stroke-width="1" stroke-linecap="round"/>
    ${sp(14, 17, 4.2, '#F2FFE8')}${sp(46, 40, 3.2, '#F2FFE8')}${sp(52, 26, 2.2, '#F2FFE8', .8)}</g>
  </svg>`;
  const ufo = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" class="boost-svg q7-ufo"><g transform="translate(-3.5 -4.4) scale(1.11)">
    ${sp(13, 15, 3.4, '#FFF7C0')}${sp(52, 13, 3, '#FFF7C0')}<circle cx="47" cy="22" r="1.1" fill="#FFF7C0"/>
    <path d="M17 44q15 9 30 0l-2.6 6.4a2.6 2.6 0 0 1-2.4 1.6H22a2.6 2.6 0 0 1-2.4-1.6z" fill="url(#q7Under)" stroke="#5A1E5E" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="23.5" cy="50.5" r="3" fill="#FFB86A" stroke="#5A1E5E" stroke-width="1.4"/><circle cx="32" cy="52.5" r="3" fill="#FFB86A" stroke="#5A1E5E" stroke-width="1.4"/><circle cx="40.5" cy="50.5" r="3" fill="#FFB86A" stroke="#5A1E5E" stroke-width="1.4"/>
    <ellipse cx="32" cy="38.5" rx="27" ry="10" fill="url(#q7Saucer)" stroke="#2E0F5E" stroke-width="2.2"/>
    <path d="M9 36.5q23-8 46 0" stroke="#E8D2FF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".8"/>
    <path d="M18.5 32a13.5 14 0 0 1 27 0z" fill="url(#q7Dome)" stroke="#1E4E66" stroke-width="2" opacity=".96"/>
    <ellipse cx="32" cy="32.2" rx="14.6" ry="3.2" fill="#FFCC4A" stroke="#7A4A06" stroke-width="1.5"/>
    <path d="M24 26q1.6-6.4 7-8" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".85"/>
    <circle cx="13.5" cy="40" r="2.1" fill="#FFE45C" stroke="#2E0F5E" stroke-width="1"/><circle cx="23" cy="43.4" r="2.1" fill="#5CF2FF" stroke="#2E0F5E" stroke-width="1"/>
    <circle cx="32" cy="44.6" r="2.1" fill="#FF6FC8" stroke="#2E0F5E" stroke-width="1"/><circle cx="41" cy="43.4" r="2.1" fill="#5CF2FF" stroke="#2E0F5E" stroke-width="1"/>
    <circle cx="50.5" cy="40" r="2.1" fill="#FFE45C" stroke="#2E0F5E" stroke-width="1"/></g>
  </svg>`;

  g.Q7 = { DEFS, coin, flame, skull, alertFlame, alert, bulb, check, hand, undo, broom, ufo };
})(typeof window !== 'undefined' ? window : globalThis);
