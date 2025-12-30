// ===== Engine (Tick) =====
  function startUpgrade(key){
    if(state.buildJob) return;
    const lv = state.buildings[key];
    const next = lv + 1;
    const cost = buildingCost(key, next);
    if(!canPay(cost)) return;

    pay(cost);
    const dur = buildingDurationSec(lv);
    const t = performance.now();
    state.buildJob = { key, fromLv: lv, toLv: next, startAt:t, endAt:t + dur*1000 };
    addReport("Nâng cấp", `${BUILDINGS[key].name} → Cấp ${next} (${dur}s)`);

    // Major change: save immediately
    try{ SaveManager?.markDirty("upgrade-start"); SaveManager?.saveNow("upgrade-start"); }catch(_e){}

    renderSidebar();
    renderMain();
  }

  function finishUpgrade(){
    const j = state.buildJob;
    if(!j) return;
    state.buildings[j.key] = j.toLv;
    state.buildJob = null;
    addReport("Hoàn tất", `${BUILDINGS[j.key].name} lên Cấp ${state.buildings[j.key]}`);

    // Major change: save immediately
    try{ SaveManager?.markDirty("upgrade-finish"); SaveManager?.saveNow("upgrade-finish"); }catch(_e){}

    renderSidebar();
    renderMain();
  }

  function enqueueTraining(trainBuildingKey, qty){
    const unitKey = TRAIN_BUILDINGS[trainBuildingKey].unit;
    const u = UNITS[unitKey];

    const max = maxTrainable(unitKey);
    qty = clamp(qty, 1, Math.max(1, max));

    const totalCost = {
      wood: u.cost.wood * qty,
      clay: u.cost.clay * qty,
      iron: u.cost.iron * qty,
      crop: u.cost.crop * qty,
    };
    if(!canPay(totalCost)) return;

    pay(totalCost);
    state.train[trainBuildingKey].queue.push({ unitKey, qtyLeft: qty });
    addReport("Huấn luyện", `${TRAIN_BUILDINGS[trainBuildingKey].name}: ${u.name} x${qty} (${qty*CFG.trainSecPerUnit}s)`);

    // Major change: save immediately
    try{ SaveManager?.markDirty("train-enqueue"); SaveManager?.saveNow("train-enqueue"); }catch(_e){}

    renderSidebar();
    renderMain();
  }

  function processTraining(nowMs){
    let changed = false;
    for(const k of Object.keys(state.train)){
      const tb = state.train[k];
      if(tb.queue.length === 0){
        tb.currentEndAt = 0;
        continue;
      }
      if(tb.currentEndAt === 0){
        tb.currentEndAt = nowMs + CFG.trainSecPerUnit*1000;
      }

      while(tb.queue.length && nowMs >= tb.currentEndAt){
        const item = tb.queue[0];
        state.units[item.unitKey] += 1;
        changed = true;
        item.qtyLeft -= 1;

        if(item.qtyLeft <= 0) tb.queue.shift();
        if(item.qtyLeft <= 0) changed = true;

        if(tb.queue.length){
          tb.currentEndAt += CFG.trainSecPerUnit*1000;
        } else {
          tb.currentEndAt = 0;
          break;
        }
      }
    }

    if(changed){
      try{ SaveManager?.markDirty("training-progress"); }catch(_e){}
    }
  }

  function processMarches(nowMs){
    if(!state.marches.length) return;

    for(let idx = state.marches.length - 1; idx >= 0; idx--){
      const m = state.marches[idx];
      if(nowMs < m.endAt) continue;

      const cell = state.map[m.to.y][m.to.x];

      // Arrival outbound
      if(m.phase === "out"){
        if(m.action === "claim"){
          if(cell.type === "resource" && cell.owner !== "player"){
            cell.owner = "player";
            addReport("Chiếm ô", `Đã chiếm ô tài nguyên (${m.to.x},${m.to.y}) · ${vnRes(cell.res)}.`);
            if(state.view==="map"){
              const gridEl = document.querySelector("#mapGrid");
              paintSingleCell(gridEl, m.to.x, m.to.y, true);
            }
          } else {
            addReport("Chiếm ô", `Ô (${m.to.x},${m.to.y}) không hợp lệ. Quân quay về.`);
          }
          const back = travelSec(m.to, m.from);
          m.phase = "return";
          m.startAt = nowMs;
          m.endAt   = nowMs + back*1000;

          // Major transition: save immediately
          try{ SaveManager?.markDirty("march-claim"); SaveManager?.saveNow("march-claim"); }catch(_e){}
          continue;
        }

        if(m.action === "attack"){
          const defPower = (cell.type === "npc" && cell.owner !== "player") ? (cell.defense||0) : 0;
          const atkPower = calcAtk(m.troops);

          if(defPower <= 0 || cell.type !== "npc" || cell.owner === "player"){
            addReport("Tấn công", `Không có mục tiêu kẻ địch hợp lệ ở (${m.to.x},${m.to.y}). Quân quay về.`);
            const back = travelSec(m.to, m.from);
            m.phase="return"; m.startAt=nowMs; m.endAt=nowMs + back*1000;
            continue;
          }

          const p = atkPower / (atkPower + defPower + 1e-9);
          const win = atkPower >= defPower;

          const lossRate = win
            ? Math.min(0.65, (1 - p) * 0.55)
            : Math.min(0.98, 0.55 + (1 - p) * 0.45);

          const survivors = applyLosses(m.troops, lossRate);
          const losses = {
            infantry: (m.troops.infantry||0) - survivors.infantry,
            archer:   (m.troops.archer||0)   - survivors.archer,
            cavalry:  (m.troops.cavalry||0)  - survivors.cavalry,
          };

          if(win){
            const loot = genLoot(defPower, survivors);
            m.loot = loot;

            cell.owner = "player";
            cell.defense = 0;

            addReport(
              "Chiến đấu thắng",
              `Kẻ địch (${m.to.x},${m.to.y}) · Công ${Math.floor(atkPower)} vs Thủ ${defPower} · Mất: Bộ ${losses.infantry}, Cung ${losses.archer}, Kỵ ${losses.cavalry} · Chiến lợi phẩm: Gỗ ${loot.wood}, Đất sét ${loot.clay}, Sắt ${loot.iron}, Lúa ${loot.crop}.`
            );

            if(state.view==="map"){
              const gridEl = document.querySelector("#mapGrid");
              paintSingleCell(gridEl, m.to.x, m.to.y, true);
            }
          } else {
            m.loot = {wood:0, clay:0, iron:0, crop:0};
            addReport("Chiến đấu thua", `Kẻ địch (${m.to.x},${m.to.y}) · Công ${Math.floor(atkPower)} vs Thủ ${defPower} · Rút về.`);
          }

          m.troops = survivors;

          const back = travelSec(m.to, m.from);
          m.phase = "return";
          m.startAt = nowMs;
          m.endAt   = nowMs + back*1000;

          // Major transition: save immediately
          try{ SaveManager?.markDirty("march-attack"); SaveManager?.saveNow("march-attack"); }catch(_e){}
          continue;
        }
      }

      // Arrival return home
      if(m.phase === "return"){
        state.units.infantry += (m.troops.infantry||0);
        state.units.archer   += (m.troops.archer||0);
        state.units.cavalry  += (m.troops.cavalry||0);

        if(m.loot){
          state.resourcesBase.wood += m.loot.wood||0;
          state.resourcesBase.clay += m.loot.clay||0;
          state.resourcesBase.iron += m.loot.iron||0;
          state.resourcesBase.crop += m.loot.crop||0;

          const cap = capacity();
          state.resourcesBase.wood = clamp(state.resourcesBase.wood, 0, cap.warehouse);
          state.resourcesBase.clay = clamp(state.resourcesBase.clay, 0, cap.warehouse);
          state.resourcesBase.iron = clamp(state.resourcesBase.iron, 0, cap.warehouse);
          state.resourcesBase.crop = clamp(state.resourcesBase.crop, 0, cap.granary);

          const total = (m.loot.wood||0)+(m.loot.clay||0)+(m.loot.iron||0)+(m.loot.crop||0);
          if(total>0) addReport("Chiến lợi phẩm về làng", `Nhận chiến lợi phẩm: Gỗ ${m.loot.wood}, Đất sét ${m.loot.clay}, Sắt ${m.loot.iron}, Lúa ${m.loot.crop}.`);
        }

        state.marches.splice(idx, 1);

        // Major transition: troops/loot arrived home
        try{ SaveManager?.markDirty("march-return"); SaveManager?.saveNow("march-return"); }catch(_e){}

        renderSidebar();
        if(state.view==="army" || state.view==="map") renderMain();
        continue;
      }
    }
  }

  function tickLogic(){
    const nowMs = performance.now();
    state.lastTickAt = nowMs;

    // NOTE: Main panel is not re-rendered every tick for smoothness.
    // When resources change (production / loot), we must refresh the
    // currently opened Building/Training detail panel so the "Thiếu/Đủ tài nguyên"
    // state is always correct.
    let resourcesChanged = false;

    // Production (step-by-step, every real minute)
    const prod = productionPerMinute();
    const cap = capacity();
    const PROD_INTERVAL_MS = 60*1000;

    if(!state.lastProdAt) state.lastProdAt = nowMs;
    const elapsed = nowMs - state.lastProdAt;
    const wholeIntervals = Math.floor(elapsed / PROD_INTERVAL_MS);

    if(wholeIntervals > 0){
      const gameMinutes = wholeIntervals * CFG.gameMinutePerTick;

      state.resourcesBase.wood += prod.wood * gameMinutes;
      state.resourcesBase.clay += prod.clay * gameMinutes;
      state.resourcesBase.iron += prod.iron * gameMinutes;
      state.resourcesBase.crop += prod.crop * gameMinutes;

      state.resourcesBase.wood = clamp(state.resourcesBase.wood, 0, cap.warehouse);
      state.resourcesBase.clay = clamp(state.resourcesBase.clay, 0, cap.warehouse);
      state.resourcesBase.iron = clamp(state.resourcesBase.iron, 0, cap.warehouse);
      state.resourcesBase.crop = clamp(state.resourcesBase.crop, 0, cap.granary);

      state.lastProdAt += wholeIntervals * PROD_INTERVAL_MS;

      // Village age: 1 real minute = 1 in-game day
      if(!Number.isFinite(state.villageDay) || state.villageDay < 1) state.villageDay = 1;
      state.villageDay += wholeIntervals;



      state._pulseProdKick += 1;
      resourcesChanged = true;
    }

    // Finish upgrade
    if(state.buildJob && nowMs >= state.buildJob.endAt){
      finishUpgrade();
    }

    // Training
    processTraining(nowMs);

    // Marches + combat + loot
    // (processMarches may add loot to resourcesBase)
    const beforeLoot = resourcesChanged ? null : {
      wood: state.resourcesBase.wood,
      clay: state.resourcesBase.clay,
      iron: state.resourcesBase.iron,
      crop: state.resourcesBase.crop,
    };
    processMarches(nowMs);
    if(!resourcesChanged && beforeLoot){
      if(
        state.resourcesBase.wood !== beforeLoot.wood ||
        state.resourcesBase.clay !== beforeLoot.clay ||
        state.resourcesBase.iron !== beforeLoot.iron ||
        state.resourcesBase.crop !== beforeLoot.crop
      ){
        resourcesChanged = true;
      }
    }

    // Refresh affordability in detail panels (only when needed)
    if(resourcesChanged){
      // Mark dirty so next auto-save captures new resource numbers.
      try{ SaveManager?.markDirty("resources"); }catch(_e){}
      // Save immediately on minute tick (resources + village day)
      if(wholeIntervals > 0){
        try{ SaveManager?.saveNow("minute-tick"); }catch(_e){}
      }
      if(state.view && (state.view.startsWith("b:") || state.view.startsWith("t:"))){
        renderMain();
      }
    }
  }
