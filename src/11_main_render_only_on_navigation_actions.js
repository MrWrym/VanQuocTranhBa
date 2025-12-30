// ===== Main render (only on navigation/actions) =====
  function descHTML(desc){
    if(!desc) return "";
    const lead = desc.lead ? `<div class="tiny">${desc.lead}</div>` : "";
    const bullets = (desc.bullets||[]).map(t=>`<div class="tiny">• ${t}</div>`).join("");
    const upgrade = desc.upgrade ? `<div class="divider"></div><div class="tiny"><b>Ghi chú nâng cấp:</b> ${desc.upgrade}</div>` : "";
    return `
      ${lead}
      <div style="margin-top:8px">${bullets}</div>
      ${upgrade}
    `;
  }

  function renderMain(){
    const v = state.view;

    // Mount & toggle Progress component (separate UI + logic)
    if(typeof mountMainProgress === "function" && dom.mainProgress && !dom.mainBuildFill){
      mountMainProgress();
    }
    if(typeof showMainProgress === "function"){
      showMainProgress(v==="village" || v.startsWith("b:") || v.startsWith("t:"));
    }

    if(v==="village"){
      dom.mainTitle.innerHTML = `${icoTok("home")} Làng`;
      renderEmoji(dom.mainTitle);
      dom.mainHint.textContent = "Xây công trình, huấn luyện quân, hành quân chiếm ô / đánh kẻ địch.";
      dom.main.innerHTML = `
        <div class="card">
          <h3>${icoTok("scroll")} Tổng quan</h3>
          <div class="tiny">Tổng cấp: <b>${totalLevel()}</b> · Quân: <b>${totalArmy()}</b> · Hành quân: <b>${state.marches.length}</b></div>
          <div class="divider"></div>
          <div class="tiny">Gợi ý: bấm các mục trong Công trình / Doanh trại ở thanh bên để thao tác. Vào Bản đồ để chiếm ô / đánh kẻ địch.</div>
        </div>
      `;

      renderEmoji(dom.main);
      return;
    }

    if(v.startsWith("b:")){
      const key = v.slice(2);
      const b = BUILDINGS[key];
      dom.mainTitle.innerHTML = `${icoTok("up")} ${b.name}`;
      renderEmoji(dom.mainTitle);
      dom.mainHint.textContent = "Nâng cấp có thời gian (mỗi cấp +1 giây).";
      const lv = state.buildings[key];
      const next = lv + 1;
      const cost = buildingCost(key, next);
      const dur = buildingDurationSec(lv);

      const benefit = (() => {
        if(b.prodKey) return `⬆️ Cấp ${next}: +${b.prodPerLv} ${vnRes(b.prodKey)}/phút`;
        if(key==="warehouse") return `⬆️ Cấp ${next}: +${CFG.warehousePerLv} sức chứa kho chứa`;
        if(key==="granary")   return `⬆️ Cấp ${next}: +${CFG.granaryPerLv} sức chứa kho lương`;
        return `⬆️ Cấp ${next}: (demo)`;
      })();

      const busy = !!state.buildJob;
      const can = !busy && canPay(cost);

      dom.main.innerHTML = `
        <div class="card">
          <h3>${icoTok("up")} Chi tiết công trình</h3>
          <div class="tiny">Cấp hiện tại: <b>${lv}</b></div>
          <div class="divider"></div>
          ${descHTML(b.desc)}
          <div class="divider"></div>
          <div class="tiny" data-tip="Lợi ích nâng cấp">${benefit}</div>
          <div class="divider"></div>
          <div class="tiny">
            Chi phí: ${ico("wood",true)} ${cost.wood} · ${ico("clay",true)} ${cost.clay} · ${ico("iron",true)} ${cost.iron} · ${ico("crop",true)} ${cost.crop}
            · Thời gian: <b>${dur}s</b>
          </div>
          <div style="margin-top:12px; display:flex; gap:10px; align-items:center;">
            <button class="btn ok" data-act="upgrade" data-key="${key}" ${can?"":"disabled"}>
              ${ico("up",true)} Nâng cấp
            </button>
            <span class="tiny">${busy ? "Đang có job khác (demo chỉ 1 job)." : (can ? "Đủ tài nguyên." : "Thiếu tài nguyên.")}</span>
          </div>
        </div>
      `;

      renderEmoji(dom.main);
      return;
    }

    if(v.startsWith("t:")){
      const key = v.slice(2);
      const tb = TRAIN_BUILDINGS[key];
      const unitKey = tb.unit;
      const u = UNITS[unitKey];

      dom.mainTitle.innerHTML = `${icoTok("barracks")} ${tb.name}`;
      renderEmoji(dom.mainTitle);
      dom.mainHint.textContent = "Thanh kéo tự chặn theo tài nguyên. Hàng đợi riêng từng công trình. 3 giây / 1 quân.";

      const max = maxTrainable(unitKey);
      const draft = clamp(state._draftQty ?? 1, 1, Math.max(1, max));
      state._draftQty = draft;

      const totalCost = {
        wood: u.cost.wood * draft,
        clay: u.cost.clay * draft,
        iron: u.cost.iron * draft,
        crop: u.cost.crop * draft,
      };

      dom.main.innerHTML = `
        <div class="card">
          <h3>${icoTok("shield")} Chi tiết huấn luyện</h3>
          <div class="tiny"><b>${u.name}</b> (Công ${u.atk} / Thủ ${u.def})</div>
          <div class="divider"></div>
          ${descHTML(tb.desc)}
          <div class="divider"></div>
          <div class="tiny">Chi phí / 1 quân: ${ico("wood",true)} ${u.cost.wood} · ${ico("clay",true)} ${u.cost.clay} · ${ico("iron",true)} ${u.cost.iron} · ${ico("crop",true)} ${u.cost.crop} · 3 giây / quân</div>

          <div style="margin-top:12px; display:flex; gap:10px; align-items:center;">
            <input id="trainSlider" type="range" min="1" max="${Math.max(1, max)}" value="${draft}" ${max>=1?"":"disabled"} />
            <div class="pill" style="min-width:140px" data-tip="Số lượng">${ico("scroll",true)} <b id="trainQty">${draft}</b></div>
          </div>

          <div class="tiny" id="trainMeta" style="margin-top:10px;">
            Tổng chi phí: ${ico("wood",true)} <b id="tcw">${totalCost.wood}</b> ·
            ${ico("clay",true)} <b id="tcc">${totalCost.clay}</b> ·
            ${ico("iron",true)} <b id="tci">${totalCost.iron}</b> ·
            ${ico("crop",true)} <b id="tcf">${totalCost.crop}</b>
            · Thời gian: <b id="tct">${draft * CFG.trainSecPerUnit}s</b>
          </div>

          <div style="margin-top:12px; display:flex; gap:10px; align-items:center;">
            <button class="btn ok" id="btnTrain" data-act="train" data-key="${key}" ${canPay(totalCost) && max>=1 ? "" : "disabled"}>
              ${ico("up",true)} Huấn luyện
            </button>
            <span class="tiny" id="trainHint">${max>=1 ? "" : "Không đủ tài nguyên để huấn luyện 1 quân."}</span>
          </div>

          <div class="divider"></div>
          <div class="tiny">Hàng đợi hiện tại: <b>${state.train[key].queue.length ? (state.train[key].queue.map(q=>UNITS[q.unitKey].name+" x"+q.qtyLeft).join(", ")) : "—"}</b></div>
        </div>
      `;

      renderEmoji(dom.main);
      // Patch-in-place (no rerender on slider move)
      const slider = document.querySelector("#trainSlider");
      const qtyEl = document.querySelector("#trainQty");
      const btn = document.querySelector("#btnTrain");
      const tcw = document.querySelector("#tcw");
      const tcc = document.querySelector("#tcc");
      const tci = document.querySelector("#tci");
      const tcf = document.querySelector("#tcf");
      const tct = document.querySelector("#tct");
      const hint = document.querySelector("#trainHint");

      const updateTrainDraft = () => {
        const maxNow = maxTrainable(unitKey);
        slider.max = String(Math.max(1, maxNow));
        if(maxNow < 1){
          slider.disabled = true;
          btn.disabled = true;
          hint.textContent = "Không đủ tài nguyên để huấn luyện 1 quân.";
          return;
        }
        slider.disabled = false;
        const q = clamp(parseInt(slider.value,10), 1, maxNow);
        slider.value = String(q);
        state._draftQty = q;
        qtyEl.textContent = String(q);

        const total = {
          wood: u.cost.wood*q,
          clay: u.cost.clay*q,
          iron: u.cost.iron*q,
          crop: u.cost.crop*q,
        };
        tcw.textContent = String(total.wood);
        tcc.textContent = String(total.clay);
        tci.textContent = String(total.iron);
        tcf.textContent = String(total.crop);
        tct.textContent = String(q * CFG.trainSecPerUnit) + "s";

        btn.disabled = !canPay(total);
        hint.textContent = btn.disabled ? "Thiếu tài nguyên." : "";
      };

      slider.addEventListener("input", updateTrainDraft);
      updateTrainDraft();

      return;
    }

    if(v==="map"){
      dom.mainTitle.innerHTML = `${icoTok("map")} Bản đồ`;
      renderEmoji(dom.mainTitle);
      dom.mainHint.textContent = "Bấm vào ô để chọn. Hành quân có thanh tiến độ mượt.";

      dom.main.innerHTML = `
        <div class="mapWrap">
          <div class="card" style="flex:1; min-width:0;">
            <h3>${icoTok("map")} Bản đồ</h3>
            <div class="mapGrid" id="mapGrid"></div>
          </div>

          <div class="card" style="width:340px;">
            <h3>${icoTok("scroll")} Ô đang chọn</h3>
            <div class="tiny" id="m-sel">Chưa chọn ô.</div>
            <div class="divider"></div>

            <h3>${icoTok("shield")} Hành quân</h3>
            <div class="tiny">Gửi quân (không vượt quá quân đang có).</div>
            <div style="display:grid; gap:8px; margin-top:10px;">
              <label class="tiny">Bộ binh: <input id="mv-inf" type="number" min="0" value="0"></label>
              <label class="tiny">Cung thủ: <input id="mv-arc" type="number" min="0" value="0"></label>
              <label class="tiny">Kỵ binh: <input id="mv-cav" type="number" min="0" value="0"></label>
            </div>

            <div class="divider"></div>
            <button class="btn ok" id="btn-march" disabled>${ico("up",true)} Hành quân</button>
            <div class="tiny" id="m-marchHint" style="margin-top:8px;">Chọn ô tài nguyên hoặc kẻ địch để hành quân.</div>
          </div>
        </div>

        <div class="card">
          <h3>${icoTok("scroll")} Hành quân đang chạy</h3>
          <div id="m-marches" class="tiny">—</div>
        </div>
      `;

      renderEmoji(dom.main);

      mountMapHandlers();
      return;
    }

    if(v==="army"){
      dom.mainTitle.innerHTML = `${icoTok("shield")} Quân đội`;
      renderEmoji(dom.mainTitle);
      dom.mainHint.textContent = "Quân hiện có + hành quân đang chạy.";
      dom.main.innerHTML = `
        <div class="card">
          <h3>${icoTok("shield")} Quân</h3>
          <div class="tiny">Bộ binh: <b>${state.units.infantry}</b></div>
          <div class="tiny">Cung thủ: <b>${state.units.archer}</b></div>
          <div class="tiny">Kỵ binh: <b>${state.units.cavalry}</b></div>
        </div>

        <div class="card">
          <h3>${icoTok("map")} Hành quân</h3>
          <div class="tiny" id="armyMarchBox">—</div>
        </div>
      `;

      renderEmoji(dom.main);
      return;
    }

    if(v==="reports"){
      dom.mainTitle.innerHTML = `${icoTok("scroll")} Báo cáo`;
      renderEmoji(dom.mainTitle);
      dom.mainHint.textContent = "Nhật ký hệ thống.";
      dom.main.innerHTML = `
        <div class="card">
          <h3>${icoTok("scroll")} Báo cáo</h3>
          <div class="divider"></div>
          <div class="scroll" style="max-height:720px; padding-right:6px">
            ${state.reports.map(r=>`
              <div class="card" style="margin-bottom:10px">
                <div class="tiny">${r.t}</div>
                <div style="font-weight:950; margin:6px 0 4px">${r.title}</div>
                <div class="tiny">${r.text}</div>
              </div>
            `).join("") || `<div class="tiny">Chưa có log.</div>`}
          </div>
        </div>
      `;

      renderEmoji(dom.main);
      return;
    }
  }
