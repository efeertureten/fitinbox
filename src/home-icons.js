/* v8 home-screen icons (ids prefixed "q8"). */
(function (g) {
  const sp = (x, y, s, c, o) => `<path d="M${x} ${y - s}q${s * .16} ${s * .84} ${s} ${s}q${-s * .84} ${s * .16} ${-s} ${s}q${-s * .16} ${-s * .84} ${-s} ${-s}q${s * .84} ${-s * .16} ${s} ${-s}z" fill="${c || '#fff'}"${o ? ` opacity="${o}"` : ''}/>`;
  const STAR = '50.0,9.0 62.3,36.0 91.8,39.4 70.0,59.5 75.9,88.6 50.0,74.0 24.1,88.6 30.0,59.5 8.2,39.4 37.7,36.0';

  const DEFS = `<svg width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>
    <linearGradient id="q8Star" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE873"/><stop offset=".45" stop-color="#FFB824"/><stop offset="1" stop-color="#F07C0E"/></linearGradient>
    <radialGradient id="q8StarGlow" cx=".5" cy=".5" r=".5"><stop offset=".35" stop-color="#FFC94A" stop-opacity=".55"/><stop offset="1" stop-color="#FFC94A" stop-opacity="0"/></radialGradient>
    <radialGradient id="q8Coin" cx=".36" cy=".3" r=".82"><stop offset="0" stop-color="#FFF5A6"/><stop offset=".45" stop-color="#FFCF33"/><stop offset=".85" stop-color="#F2A010"/><stop offset="1" stop-color="#D8840A"/></radialGradient>
    <radialGradient id="q8CoinIn" cx=".42" cy=".36" r=".75"><stop offset="0" stop-color="#FFDF55"/><stop offset="1" stop-color="#EFA314"/></radialGradient>
    <linearGradient id="q8Wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D7894A"/><stop offset=".55" stop-color="#B8642C"/><stop offset="1" stop-color="#8E4820"/></linearGradient>
    <linearGradient id="q8WoodLid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E39A58"/><stop offset="1" stop-color="#B8642C"/></linearGradient>
    <linearGradient id="q8Gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE27A"/><stop offset=".5" stop-color="#FFC22E"/><stop offset="1" stop-color="#E39A12"/></linearGradient>
    <linearGradient id="q8Awning" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A88BFF"/><stop offset="1" stop-color="#6F4BE0"/></linearGradient>
    <linearGradient id="q8Cream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1CF"/><stop offset="1" stop-color="#EBCB8E"/></linearGradient>
    <linearGradient id="q8Door" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8A5A2A"/><stop offset="1" stop-color="#5E3A16"/></linearGradient>
    <linearGradient id="q8Roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A86A3A"/><stop offset="1" stop-color="#6E3E1A"/></linearGradient>
    <linearGradient id="q8Tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE6B4"/><stop offset="1" stop-color="#EBC47E"/></linearGradient>
    <linearGradient id="q8TileP" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9B7BFF"/><stop offset="1" stop-color="#5D3BD0"/></linearGradient>
  </defs></svg>`;

  /* glossy star with glow (viewBox 0 0 100 100) */
  const star = (glow) => `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" class="q8-star">
    ${glow ? '<circle cx="50" cy="52" r="50" fill="url(#q8StarGlow)"/>' : ''}
    <polygon points="${STAR}" fill="#C85E06" stroke="#C85E06" stroke-width="14" stroke-linejoin="round"/>
    <polygon points="${STAR}" fill="url(#q8Star)" stroke="url(#q8Star)" stroke-width="8" stroke-linejoin="round"/>
    <path d="M50 18l8.6 19.5 13.5 1.6" fill="none" stroke="#FFF6C8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
    <ellipse cx="40" cy="46" rx="11" ry="6.5" fill="#FFFFFF" opacity=".45" transform="rotate(-24 40 46)"/>
    ${glow ? sp(88, 18, 4.5, '#FFF3B0') + sp(14, 80, 3.4, '#FFF3B0', .85) + '<circle cx="93" cy="62" r="1.6" fill="#FFF3B0"/><circle cx="8" cy="22" r="1.4" fill="#FFF3B0"/>' : ''}
  </svg>`;

  /* gold "G" coin (viewBox 0 0 40 40) */
  const gcoin = (glow) => `<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" class="q8-coin">
    ${glow ? '<circle cx="20" cy="20" r="20" fill="url(#q8StarGlow)"/>' : ''}
    <circle cx="20" cy="20" r="16.5" fill="url(#q8Coin)" stroke="#B86E06" stroke-width="1.6"/>
    <circle cx="20" cy="20.4" r="12.6" fill="url(#q8CoinIn)" stroke="#D88A0C" stroke-width="1.2"/>
    <path d="M25.6 15.2A7.6 7.6 0 1 0 27.4 21.4H20.6" fill="none" stroke="#B26A08" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" transform="translate(.4 .9)"/>
    <path d="M25.6 15.2A7.6 7.6 0 1 0 27.4 21.4H20.6" fill="none" stroke="#FFE680" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10.6 12.6a12 12 0 0 1 6-4.6" stroke="#FFFFFF" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".7"/>
    ${glow ? sp(34, 8, 2.6, '#FFF6C0') + sp(5.5, 33, 2, '#FFF6C0', .85) + '<circle cx="36.5" cy="29" r=".9" fill="#FFF6C0"/>' : ''}
  </svg>`;

  /* treasure chest (viewBox 0 0 80 70) — keeps <g class="lid"> for the open animation */
  const chest = `<svg viewBox="0 0 80 70" aria-hidden="true" focusable="false" class="q8-chest">
    <path d="M8 32h64v26a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8z" fill="url(#q8Wood)" stroke="#3A1A08" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M12 44h56M12 55h56" stroke="#8A4420" stroke-width="1.6" opacity=".55"/>
    <g class="lid">
      <path d="M8 33c0-14 10-22 32-22s32 8 32 22z" fill="url(#q8WoodLid)" stroke="#3A1A08" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M14 26c3-7 12-11 26-11" stroke="#F4B57A" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>
      <path d="M12 30h56" stroke="#8A4420" stroke-width="1.4" opacity=".5"/>
    </g>
    <rect x="6" y="30" width="68" height="7" rx="2.5" fill="url(#q8Gold)" stroke="#7A4A06" stroke-width="2"/>
    <rect x="17" y="12.5" width="7.5" height="54" rx="2" fill="url(#q8Gold)" stroke="#7A4A06" stroke-width="2"/>
    <rect x="55.5" y="12.5" width="7.5" height="54" rx="2" fill="url(#q8Gold)" stroke="#7A4A06" stroke-width="2"/>
    <rect x="30" y="29" width="20" height="20" rx="5" fill="url(#q8Gold)" stroke="#7A4A06" stroke-width="2.2"/>
    <rect x="33.5" y="32.5" width="13" height="13" rx="3" fill="#E9A520"/>
    <path d="M40 34.2l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#9A5E08"/>
    <path d="M19 16v14M57.5 16v14" stroke="#FFF3B8" stroke-width="1.6" stroke-linecap="round" opacity=".75"/>
  </svg>`;

  /* tab icons (viewBox 0 0 48 48) */
  const tabShop = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <rect x="8" y="18" width="32" height="25" rx="3" fill="url(#q8Cream)" stroke="#3A2410" stroke-width="2.4"/>
    <rect x="17" y="26" width="14" height="17" rx="1.5" fill="url(#q8Door)" stroke="#3A2410" stroke-width="2"/>
    <path d="M6 12l3-7h30l3 7v3.5c0 2.6-2 4.5-4.5 4.5S33 18 33 15.5c0 2.6-2 4.5-4.5 4.5S24 18 24 15.5c0 2.6-2 4.5-4.5 4.5S15 18 15 15.5c0 2.6-2 4.5-4.5 4.5S6 18 6 15.5z" fill="url(#q8Awning)" stroke="#2A1660" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M15 6l-1 10M24 6v10M33 6l1 10" stroke="#C9B6FF" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M10 8.5h28" stroke="#E0D4FF" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>
  </svg>`;
  const tabHome = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <rect x="11" y="21" width="26" height="22" rx="3" fill="url(#q8Cream)" stroke="#3A2410" stroke-width="2.4"/>
    <path d="M18.5 43V33a5.5 5.5 0 0 1 11 0v10z" fill="url(#q8Door)" stroke="#3A2410" stroke-width="2"/>
    <path d="M5 24.5L24 7l19 17.5" fill="none" stroke="#3A1A08" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M5 24.5L24 7l19 17.5" fill="none" stroke="url(#q8Roof)" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 12.5l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1-3.8-3.6 5.2-.8z" fill="url(#q8Star)" stroke="#9A4A06" stroke-width="1.6" stroke-linejoin="round"/>
  </svg>`;
  const tabMap = `<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <rect x="5" y="5" width="17" height="17" rx="4.5" fill="url(#q8Tile)" stroke="#3A2410" stroke-width="2.2"/>
    <rect x="26" y="5" width="17" height="17" rx="4.5" fill="url(#q8Tile)" stroke="#3A2410" stroke-width="2.2"/>
    <rect x="5" y="26" width="17" height="17" rx="4.5" fill="url(#q8Tile)" stroke="#3A2410" stroke-width="2.2"/>
    <rect x="26" y="26" width="17" height="17" rx="4.5" fill="url(#q8TileP)" stroke="#22105E" stroke-width="2.2"/>
    <path d="M34.5 29.6l1.7 3.5 3.8.5-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.5z" fill="url(#q8Star)" stroke="#9A4A06" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M8.5 9h7M29.5 9h7M8.5 30h7" stroke="#FFF8E6" stroke-width="2" stroke-linecap="round" opacity=".8"/>
  </svg>`;

  g.Q8 = { DEFS, star, gcoin, chest, tabShop, tabHome, tabMap };
})(typeof window !== 'undefined' ? window : globalThis);
