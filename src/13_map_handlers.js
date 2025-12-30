// ===== Map handlers =====
  function mountMapHandlers(){
    const gridEl = document.querySelector("#mapGrid");
    const selEl  = document.querySelector("#m-sel");
    const hintEl = document.querySelector("#m-marchHint");
    const btn    = document.querySelector("#btn-march");

    if(!gridEl) return;

    // build grid DOM once per render
    const N = state.mapSize;
    gridEl.innerHTML = "";
    for(let y=0;y<N;y++){
      for(let x=0;x<N;x++){
        const c = document.createElement("div");
        c.className = "cell";
        c.dataset.x = x;
        c.dataset.y = y;
        gridEl.appendChild(c);
      }
    }
    paintAllCells(gridEl);

    const syncTroopInputs = () => {
      const inf = document.querySelector("#mv-inf");
      const arc = document.querySelector("#mv-arc");
      const cav = document.querySelector("#mv-cav");
      if(!inf||!arc||!cav) return;
      inf.max = String(state.units.infantry);
      arc.max = String(state.units.archer);
      cav.max = String(state.units.cavalry);
      inf.value = String(clamp(parseInt(inf.value||"0",10), 0, state.units.infantry));
      arc.value = String(clamp(parseInt(arc.value||"0",10), 0, state.units.archer));
      cav.value = String(clamp(parseInt(cav.value||"0",10), 0, state.units.cavalry));
    };

    const readTroops = () => ({
      infantry: Math.max(0, parseInt(document.querySelector("#mv-inf")?.value||"0",10)),
      archer:   Math.max(0, parseInt(document.querySelector("#mv-arc")?.value||"0",10)),
      cavalry:  Math.max(0, parseInt(document.querySelector("#mv-cav")?.value||"0",10)),
    });

    const clampTroopsToAvailable = (t) => {
      t.infantry = clamp(t.infantry, 0, state.units.infantry);
      t.archer   = clamp(t.archer,   0, state.units.archer);
      t.cavalry  = clamp(t.cavalry,  0, state.units.cavalry);
      return t;
    };

    // select cell
    gridEl.addEventListener("click", (e)=>{
      const cellEl = e.target.closest(".cell");
      if(!cellEl) return;
      const x = +cellEl.dataset.x;
      const y = +cellEl.dataset.y;

      state.selected = {x,y};
      gridEl.querySelectorAll(".cell.sel").forEach(n=>n.classList.remove("sel"));
      cellEl.classList.add("sel");

      const data = state.map[y][x];
      const d = travelSec(state.villagePos, {x,y});
      const dist = euclid(state.villagePos, {x,y}).toFixed(2);

      selEl.innerHTML = `(${x},${y}) · <b>${vnCellType(data.type)}</b>${data.res?` · <b>${vnRes(data.res)}</b>`:""}${data.type==="npc"?` · Thủ <b>${data.defense}</b>`:""} · Khoảng cách <b>${dist}</b> · Thời gian <b>${d}s</b>`;

      const isHome = (x===state.villagePos.x && y===state.villagePos.y);
      const canAct = !isHome && ((data.type==="resource" || data.type==="npc") && data.owner!=="player");

      btn.disabled = !canAct;

      if(canAct){
        btn.innerHTML = `${ico("up",true)} ${data.type==="npc" ? "Hành quân (Tấn công)" : "Hành quân (Chiếm ô)"}`;
        renderEmoji(btn);
        hintEl.textContent = data.type==="npc"
          ? "Tới nơi sẽ giao chiến (Công vs Thủ). Thắng: chiến lợi phẩm + quay về."
          : "Tới nơi sẽ chiếm ô tài nguyên + quay về.";
      }else{
        btn.innerHTML = `${ico("up",true)} Hành quân`;
        renderEmoji(btn);
        hintEl.textContent = "Chọn ô tài nguyên hoặc kẻ địch (chưa sở hữu) để hành quân.";
      }

      syncTroopInputs();
    });

    // troop inputs clamp
    ["mv-inf","mv-arc","mv-cav"].forEach(id=>{
      const el = document.getElementById(id);
      el?.addEventListener("input", syncTroopInputs);
    });
    syncTroopInputs();

    // start march
    btn.addEventListener("click", ()=>{
      if(!state.selected) return;
      const {x,y} = state.selected;
      const cellData = state.map[y][x];

      const isHome = (x===state.villagePos.x && y===state.villagePos.y);
      if(isHome) return;
      if(!(cellData.type==="resource" || cellData.type==="npc")) return;
      if(cellData.owner==="player") return;

      let troops = clampTroopsToAvailable(readTroops());
      if(troopSum(troops) <= 0){
        addReport("Hành quân", "Cần gửi ít nhất 1 quân.");
        return;
      }

      // subtract troops from home
      state.units.infantry -= troops.infantry;
      state.units.archer   -= troops.archer;
      state.units.cavalry  -= troops.cavalry;

      const sec = travelSec(state.villagePos, {x,y});
      const nowMs = performance.now();
      const action = (cellData.type==="npc") ? "attack" : "claim";

      state.marches.push({
        id: uid(),
        from: {...state.villagePos},
        to: {x,y},
        startAt: nowMs,
        endAt: nowMs + sec*1000,
        phase: "out",       // "out" | "return"
        action,             // "claim" | "attack"
        sent: {...troops},
        troops: {...troops},
        loot: {wood:0, clay:0, iron:0, crop:0},
      });

      addReport("Hành quân", `Xuất phát tới (${x},${y}) · ${sec}s · ${action==="attack" ? "Tấn công" : "Chiếm ô"}.`);

      // Major change: save immediately
      try{ SaveManager?.markDirty("march-start"); SaveManager?.saveNow("march-start"); }catch(_e){}

      renderSidebar();
      if(state.view==="army") renderMain();
      syncTroopInputs();
    });
  }
