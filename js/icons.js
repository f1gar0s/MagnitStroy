/* Линейные SVG-иконки (24×24, stroke = currentColor) */
const ICON_PATHS = {
  // интерфейс
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cart: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20.5" r="1.2"/><circle cx="17" cy="20.5" r="1.2"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  phone: '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  chevronLeft: '<path d="m15 6-6 6 6 6"/>',
  truck: '<path d="M2 6h11v10H2zM13 10h4l3 3v3h-7"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
  box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/>',
  check: '<path d="m5 12 5 5L20 7"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  filter: '<path d="M4 5h16l-6 8v5l-4 2v-7z"/>',
  store: '<path d="M3 9 5 4h14l2 5M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0zM5 13v7h14v-7"/><path d="M10 20v-4h4v4"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  // категории
  bricks: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19"/>',
  drill: '<path d="M3 6h11a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H3zM16 7.5h3M19 6.5v2M21 7.5h1"/><path d="M7 11l-1 4h4l1-4M6 15h5v5H6z"/>',
  plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>',
  faucet: '<path d="M4 11h9a3 3 0 0 1 3 3v1M4 8v6M8 8V5M5 5h6M16 18v.5M15 21h2"/>',
  roller: '<rect x="4" y="3" width="14" height="5" rx="1"/><path d="M18 5.5h2v5h-8v3M11 13.5h2V21h-2z"/>',
  screw: '<path d="M8 3h8l-1 3H9zM10 6v14l2 2 2-2V6M10 9l4 1.5M10 12.5l4 1.5M10 16l4 1.5"/>',
  floor: '<path d="M3 15 12 10l9 5-9 5z"/><path d="M7.5 12.5 16.5 17.5M7.5 17.5l9-5"/><path d="M3 15v-2M21 15v-2"/>',
  door: '<path d="M5 21V3h12v18M3 21h18"/><circle cx="14" cy="12" r="1"/>',
  lamp: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.7.5 1.1 1.3 1.1 2.1h4.8c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>',
  leaf: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19 13 11"/>',
};

function icon(name, size = 24, cls = '') {
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}
