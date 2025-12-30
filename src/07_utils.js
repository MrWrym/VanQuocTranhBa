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

    function allocByWeights(total, weights){
    const sumW = weights.reduce((a,b)=>a+b, 0);
    const raw = weights.map(w => (total * w) / sumW);
    const ints = raw.map(v => Math.floor(v));
    let rem = total - ints.reduce((a,b)=>a+b, 0);
    const order = raw
      .map((v,i)=>({ i, frac: v - ints[i] }))
      .sort((a,b)=>b.frac - a.frac);
    for(let n=0; n<rem; n++){
      ints[order[n % order.length].i] += 1;
    }
    return ints;
  }

  function buildingCost(key, nextLv){
    const base = BUILDINGS[key].base;
    const k = 1 + 0.35*(nextLv-1);

    // Lúa: chi phí nâng cấp dùng chung cho mọi công trình (trừ Ruộng lúa)
    const cropCommonBase = (typeof CFG !== "undefined" && CFG.cropUpgradeBase!=null) ? CFG.cropUpgradeBase : 10;
    const cropCommon = Math.round(cropCommonBase * k);

    // Ruộng lúa: 4 tài nguyên bằng nhau (1:1:1:1)
    if(key === "cropland"){
      const total4 = Math.round((base.wood + base.clay + base.iron + base.crop) * k);
      const vals = allocByWeights(total4, [1,1,1,1]);
      return { wood: vals[0], clay: vals[1], iron: vals[2], crop: vals[3] };
    }

    // Mỏ tài nguyên: tài nguyên cùng loại rẻ, 2 loại kia đắt (1 : 1.5 : 1.5)
    const prodKey = BUILDINGS[key].prodKey;
    if(prodKey === "wood" || prodKey === "clay" || prodKey === "iron"){
      const total3 = Math.round((base.wood + base.clay + base.iron) * k);
      const keys = ["wood","clay","iron"];
      const others = keys.filter(x => x !== prodKey);
      const order = [prodKey, others[0], others[1]];
      const vals = allocByWeights(total3, [1,1.5,1.5]);

      const out = { wood: 0, clay: 0, iron: 0, crop: cropCommon };
      out[order[0]] = vals[0];
      out[order[1]] = vals[1];
      out[order[2]] = vals[2];
      return out;
    }

    // Công trình thường: giữ chi phí 3 tài nguyên như cũ, chỉ đồng bộ lúa
    return {
      wood: Math.round(base.wood*k),
      clay: Math.round(base.clay*k),
      iron: Math.round(base.iron*k),
      crop: cropCommon,
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
