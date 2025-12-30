// ===== Utils =====
  const totalLevel = () => Object.values(state.buildings).reduce((a,b)=>a+b,0);
  const totalArmy  = () => state.units.infantry + state.units.archer + state.units.cavalry;

  const RES_NAME = {
    wood: "Gỗ",
    clay: "Đất sét",
    iron: "Sắt",
    crop: "Lúa",
  };

  const CELL_TYPE_NAME = {
    village: "Làng",
    resource: "Tài nguyên",
    npc: "Kẻ địch",
    empty: "Trống",
  };

  const vnRes = (key) => RES_NAME[key] || key;
  const vnCellType = (t) => CELL_TYPE_NAME[t] || t;

  function addReport(title, text){
    const t = new Date().toLocaleTimeString("vi-VN");
    state.reports.unshift({t, title, text});
    state.reports = state.reports.slice(0, 120);
    if(state.view === "reports") renderMain();
  }

  function capacity(){
    return {
      warehouse: CFG.warehouseBase + (state.buildings.warehouse-1)*CFG.warehousePerLv,
      granary:   CFG.granaryBase   + (state.buildings.granary-1)*CFG.granaryPerLv,
    };
  }

  function productionPerMinute(){
    const prodOf = (bKey) => {
      const b = BUILDINGS[bKey];
      const lv = state.buildings[bKey] || 0;
      if(!b || !b.prodKey) return 0;
      const base = (typeof b.prodBase === "number") ? b.prodBase : 0;
      const inc  = (typeof b.prodPerLv === "number") ? b.prodPerLv : 0;
      return lv<=0 ? 0 : (base + (lv-1)*inc);
    };
    return {
      wood: prodOf("woodcutter"),
      clay: prodOf("claypit"),
      iron: prodOf("ironmine"),
      crop: prodOf("cropland"),
    };
  }

  function buildingCost(key, nextLv){
    const base = BUILDINGS[key].base;
    const k = 1 + 0.35*(nextLv-1);
    return {
      wood: Math.round(base.wood*k),
      clay: Math.round(base.clay*k),
      iron: Math.round(base.iron*k),
      crop: Math.round(base.crop*k),
    };
  }

  // time upgrade: mỗi khi tăng 1 level thì +1s (Lv1->2:1s, Lv2->3:2s...)
  const buildingDurationSec = (currentLv) => currentLv;

  const canPay = (cost) => {
    const r = state.resourcesBase;
    return r.wood>=cost.wood && r.clay>=cost.clay && r.iron>=cost.iron && r.crop>=cost.crop;
  };
  const pay = (cost) => {
    state.resourcesBase.wood -= cost.wood;
    state.resourcesBase.clay -= cost.clay;
    state.resourcesBase.iron -= cost.iron;
    state.resourcesBase.crop -= cost.crop;
  };

  function maxTrainable(unitKey){
    const c = UNITS[unitKey].cost;
    const r = state.resourcesBase;
    return Math.min(
      999,
      Math.floor(r.wood/c.wood),
      Math.floor(r.clay/c.clay),
      Math.floor(r.iron/c.iron),
      Math.floor(r.crop/c.crop),
    );
  }
