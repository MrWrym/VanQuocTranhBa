// ===== Icons helpers (emoji) =====
  // Quy ước: mọi icon hiển thị đều là emoji (không dùng SVG).
  const EMOJI = {
    // Điều hướng
    home: "🏠",
    village: "🏘️",
    map: "🗺️",
    reports: "📰",
    scroll: "📜",
    hourglass: "⏳",

    // Nhóm
    buildings: "🏗️",
    barracks: "🪖",
    army: "⚔️",

    // Tài nguyên
    wood: "🌲",
    clay: "🧱",
    iron: "⛓️",
    crop: "🌾",

    // Công trình
    woodcutter: "🪓",
    claypit: "🏺",
    ironmine: "⛏️",
    cropland: "🌾",
    warehouse: "📦",
    granary: "🧺",

    // Doanh trại
    infantryCamp: "🪖",
    archeryRange: "🏹",
    stable: "🐴",

    // Khác
    up: "⬆️",
    sword: "⚔️",
    shield: "🛡️",
    warn: "⚠️",
    ok: "✅",
  };

  const ico = (id, small=false) => {
    const ch = EMOJI[id] || "❔";
    return `<span class="${small ? "i sm" : "i"}" aria-hidden="true">${ch}</span>`;
  };
  const icoTok = (id) => `<span class="iTok" aria-hidden="true">${ico(id)}</span>`;
