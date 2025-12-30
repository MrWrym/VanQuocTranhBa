// ===== Game defs =====
  const UNITS = {
    infantry: { name:"Bộ binh", atk:10, def:12, cost:{wood:50, clay:30, iron:20, crop:10} },
    archer:   { name:"Cung thủ", atk:12, def: 9, cost:{wood:60, clay:20, iron:30, crop:10} },
    cavalry:  { name:"Kỵ binh", atk:20, def:14, cost:{wood:90, clay:60, iron:70, crop:30} },
  };

  const BUILDINGS = {
    // Sản lượng: Lv1 = 12/phút, mỗi lần nâng cấp +9/phút
    woodcutter:{ name:"Trại tiều phu", prodKey:"wood", base:{wood:60, clay:40, iron:20, crop:10}, prodBase:12, prodPerLv:9 },
    claypit:   { name:"Mỏ đất sét",   prodKey:"clay", base:{wood:40, clay:60, iron:20, crop:10}, prodBase:12, prodPerLv:9 },
    ironmine:  { name:"Mỏ sắt",      prodKey:"iron", base:{wood:40, clay:40, iron:60, crop:10}, prodBase:12, prodPerLv:9 },
    cropland:  { name:"Ruộng lúa",    prodKey:"crop", base:{wood:30, clay:30, iron:30, crop:40}, prodBase:12, prodPerLv:9 },
    warehouse: { name:"Kho chứa",     prodKey:null,   base:{wood:80, clay:60, iron:40, crop:20}, capPerLv:CFG.warehousePerLv },
    granary:   { name:"Kho lương",    prodKey:null,   base:{wood:60, clay:40, iron:40, crop:40}, capPerLv:CFG.granaryPerLv },
  };

  const TRAIN_BUILDINGS = {
    infantryCamp: { name:"Trại Lính", unit:"infantry" },
    archeryRange: { name:"Trường Bắn", unit:"archer" },
    stable:       { name:"Chuồng Ngựa", unit:"cavalry" },
  };
