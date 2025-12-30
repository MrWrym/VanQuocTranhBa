// ===== State =====
  const state = {
    view: "village",
    openGroups: { buildings:true, barracks:true },
    startedAt: performance.now(),
    lastTickAt: performance.now(),
    lastProdAt: performance.now(),

    villageDay: 1, // 1 phút đời thực = 1 ngày trong game

    // FX pulses
    _pulseProdKick: 0,
    _pulseProdApplied: 0,
    _pulseRateKick: 0,
    _pulseRateApplied: 0,

    buildings: { woodcutter:1, claypit:1, ironmine:1, cropland:1, warehouse:1, granary:1 },
    buildJob: null, // { key, fromLv, toLv, startAt, endAt }

    resourcesBase: { wood:300, clay:300, iron:300, crop:300 },

    units: { infantry:0, archer:0, cavalry:0 },

    train: {
      infantryCamp: { lv:1, queue:[], currentEndAt:0 },
      archeryRange: { lv:1, queue:[], currentEndAt:0 },
      stable:       { lv:1, queue:[], currentEndAt:0 },
    },

    reports: [],

    // Map + March
    map: null,
    mapSize: CFG.mapSize,
    villagePos: { x: Math.floor(CFG.mapSize/2), y: Math.floor(CFG.mapSize/2) },
    selected: null,
    marches: [],
    _marchUIKey: "",
    _marchUIRows: new Map(),
  };
