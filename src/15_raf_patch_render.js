// ===== rAF patch render =====
  function kickPulse(el, cls="pulse"){
    if(!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function setResFull(key, isFull){
    try{
      if(dom.topPill && dom.topPill[key]) dom.topPill[key].classList.toggle("is-full", !!isFull);
      if(dom._rProgWrap && dom._rProgWrap[key]) dom._rProgWrap[key].classList.toggle("is-full", !!isFull);
      if(dom.fullWarn && dom.fullWarn[key]) dom.fullWarn[key].classList.toggle("is-hidden", !isFull);
    }catch(_e){/* ignore */}
  }

  function renderPatch(nowMs){
    const cap = capacity();
    const prod = productionPerMinute();

    // Resources update in tickLogic (every real minute). UI shows discrete values.
    const smooth = state.resourcesBase;

    // topbar
    dom.resText.wood.textContent = fmt(smooth.wood);
    dom.resText.clay.textContent = fmt(smooth.clay);
    dom.resText.iron.textContent = fmt(smooth.iron);
    dom.resText.crop.textContent = fmt(smooth.crop);

    dom.resCapText.wood.textContent = fmt(cap.warehouse);
    dom.resCapText.clay.textContent = fmt(cap.warehouse);
    dom.resCapText.iron.textContent = fmt(cap.warehouse);
    dom.resCapText.crop.textContent = fmt(cap.granary);

    const d = (Number.isFinite(state.villageDay) && state.villageDay > 0) ? state.villageDay : 1;
    dom.timeText.textContent = "Ngày " + d;

    // right
    dom.resText.r_wood.textContent = fmt(smooth.wood);
    dom.resText.r_clay.textContent = fmt(smooth.clay);
    dom.resText.r_iron.textContent = fmt(smooth.iron);
    dom.resText.r_crop.textContent = fmt(smooth.crop);

    dom.resCapText.r_wood.textContent = fmt(cap.warehouse);
    dom.resCapText.r_clay.textContent = fmt(cap.warehouse);
    dom.resCapText.r_iron.textContent = fmt(cap.warehouse);
    dom.resCapText.r_crop.textContent = fmt(cap.granary);

    dom.resBar.wood.style.width = clamp((smooth.wood/cap.warehouse)*100, 0, 100) + "%";
    dom.resBar.clay.style.width = clamp((smooth.clay/cap.warehouse)*100, 0, 100) + "%";
    dom.resBar.iron.style.width = clamp((smooth.iron/cap.warehouse)*100, 0, 100) + "%";
    dom.resBar.crop.style.width = clamp((smooth.crop/cap.granary)*100, 0, 100) + "%";

    dom.resCapText.r_cap.textContent = `Kho: ${fmt(cap.warehouse)} · Kho lương: ${fmt(cap.granary)}`;
    // Production line contains emoji icons. Update only when changed to avoid re-parsing every rAF.
    const prodHTML = `${ico("wood",true)} ${prod.wood} · ${ico("clay",true)} ${prod.clay} · ${ico("iron",true)} ${prod.iron} · ${ico("crop",true)} ${prod.crop}`;
    if(prodHTML !== state._rProdHTML){
      state._rProdHTML = prodHTML;
      dom.resCapText.r_prod.innerHTML = prodHTML;
      renderEmoji(dom.resCapText.r_prod);
      state._pulseRateKick += 1;
    }
    dom.resCapText.r_mcount.textContent = String(state.marches.length);


    // FX: kho đầy + hành quân + sản lượng tăng
    setResFull("wood", smooth.wood >= cap.warehouse);
    setResFull("clay", smooth.clay >= cap.warehouse);
    setResFull("iron", smooth.iron >= cap.warehouse);
    setResFull("crop", smooth.crop >= cap.granary);

    if(dom.fxBuild) dom.fxBuild.classList.toggle("is-hidden", !state.buildJob);
    const hasTrain = Object.values(state.train).some(tb=>tb.queue.length);
    if(dom.fxTrain) dom.fxTrain.classList.toggle("is-hidden", !hasTrain);
    if(dom.fxMarch) dom.fxMarch.classList.toggle("is-hidden", state.marches.length===0);

    if(state._pulseProdKick !== state._pulseProdApplied){
      state._pulseProdApplied = state._pulseProdKick;
      kickPulse(dom.fxProd);
      kickPulse(dom.topPill.wood);
      kickPulse(dom.topPill.clay);
      kickPulse(dom.topPill.iron);
      kickPulse(dom.topPill.crop);
    }

    if(state._pulseRateKick !== state._pulseRateApplied){
      state._pulseRateApplied = state._pulseRateKick;
      kickPulse(dom.fxProd);
    }

    // status
    const status = [];
    if(state.buildJob){
      const rem = Math.max(0, state.buildJob.endAt - nowMs);
      status.push(`Nâng: <b>${BUILDINGS[state.buildJob.key].name}</b> · <b>${Math.ceil(rem/1000)}s</b>`);
    } else {
      status.push(`Nâng: <b>—</b>`);
    }

    const actives = [];
    for(const k of Object.keys(state.train)){
      const tb = state.train[k];
      if(tb.queue.length){
        const uKey = tb.queue[0].unitKey;
        const rem = tb.currentEndAt ? Math.max(0, tb.currentEndAt - nowMs) : 0;
        actives.push(`${TRAIN_BUILDINGS[k].name}: ${UNITS[uKey].name} x${tb.queue[0].qtyLeft} · ${Math.ceil(rem/1000)}s`);
      }
    }
    status.push(`Huấn: <b>${actives.length ? actives.join(" | ") : "—"}</b>`);

    const marchInfo = state.marches.length
      ? `<b>Hành quân:</b> ${state.marches.length}`
      : `<b>Hành quân:</b> —`;
    status.push(marchInfo);

    dom.statusText.innerHTML = status.join(" · ");

    // main progress (2 lanes: build + train)
    if(dom.mainBuildFill && dom.mainBuildLabel){
      if(state.buildJob){
        const total = (state.buildJob.endAt - state.buildJob.startAt);
        const done = clamp((nowMs - state.buildJob.startAt)/Math.max(1,total), 0, 1);
        dom.mainBuildFill.style.width = (done*100) + "%";
        dom.mainBuildLabel.innerHTML = `Đang nâng <b>${BUILDINGS[state.buildJob.key].name}</b> → Cấp ${state.buildJob.toLv} · còn <b>${Math.ceil((state.buildJob.endAt-nowMs)/1000)}s</b>`;
      } else {
        dom.mainBuildFill.style.width = "0%";
        dom.mainBuildLabel.textContent = "Không có xây dựng.";
      }
    }

    if(dom.mainTrainFill && dom.mainTrainLabel){
      const first = Object.keys(state.train).find(k=> state.train[k].queue.length);
      if(first){
        const tb = state.train[first];
        const uKey = tb.queue[0].unitKey;
        const start = tb.currentEndAt - CFG.trainSecPerUnit*1000;
        const done = tb.currentEndAt ? clamp((nowMs - start)/(CFG.trainSecPerUnit*1000), 0, 1) : 0;
        dom.mainTrainFill.style.width = (done*100) + "%";
        dom.mainTrainLabel.innerHTML = `Đang huấn luyện <b>${UNITS[uKey].name}</b> tại <b>${TRAIN_BUILDINGS[first].name}</b> · còn <b>${Math.ceil((tb.currentEndAt-nowMs)/1000)}s</b>`;
      } else {
        dom.mainTrainFill.style.width = "0%";
        dom.mainTrainLabel.textContent = "Không có huấn luyện.";
      }
    }

    patchMarchUI(nowMs);
    patchArmyMarchUI(nowMs);
  }

  function ensureMarchRows(box){
    const key = state.marches.map(m=>m.id).join("|");
    if(key === state._marchUIKey && state._marchUIRows.size === state.marches.length) return;

    state._marchUIKey = key;
    state._marchUIRows = new Map();

    if(!state.marches.length){
      box.textContent = "—";
      return;
    }

    box.innerHTML = state.marches.map(m=>{
      return `
        <div style="margin:10px 0;" data-mid="${m.id}">
          <div class="tiny" style="display:flex; align-items:center; gap:6px;"><span class="fx fx-march fx-mini" title="Đang hành quân">🥾</span><span data-mlabel></span></div>
          <div class="progress" style="margin-top:6px"><i data-mfill style="width:0%"></i></div>
        </div>
      `;
    }).join("");

    // Emoji -> Twemoji SVG
    renderEmoji(box);

    state.marches.forEach(m=>{
      const row = box.querySelector(`[data-mid="${m.id}"]`);
      if(!row) return;
      state._marchUIRows.set(m.id, {
        label: row.querySelector("[data-mlabel]"),
        fill: row.querySelector("[data-mfill]"),
      });
    });
  }

  function patchMarchUI(nowMs){
    if(state.view !== "map") return;
    const box = document.querySelector("#m-marches");
    if(!box) return;

    ensureMarchRows(box);
    if(!state.marches.length) return;

    for(const m of state.marches){
      const row = state._marchUIRows.get(m.id);
      if(!row) continue;
      const total = m.endAt - m.startAt;
      const done = clamp((nowMs - m.startAt)/Math.max(1,total), 0, 1);
      const rem = Math.max(0, m.endAt - nowMs);
      row.fill.style.width = (done*100).toFixed(1) + "%";
      row.label.innerHTML =
        `(${m.to.x},${m.to.y}) · <b>${m.phase==="out" ? (m.action==="attack" ? "Tấn công" : "Chiếm ô") : "Quay về"}</b> · còn <b>${Math.ceil(rem/1000)}s</b>`;
    }
  }

  function patchArmyMarchUI(nowMs){
    if(state.view !== "army") return;
    const box = document.querySelector("#armyMarchBox");
    if(!box) return;
    if(!state.marches.length){
      box.textContent = "—";
      return;
    }
    // lightweight list
    box.innerHTML = state.marches.map(m=>{
      const rem = Math.max(0, m.endAt - nowMs);
      const sum = troopSum(m.troops);
      return `<div class="tiny">• (${m.to.x},${m.to.y}) · ${m.phase==="out" ? "đang đi" : "đang về"} · ${Math.ceil(rem/1000)}s · quân: ${sum}</div>`;
    }).join("");
  }
