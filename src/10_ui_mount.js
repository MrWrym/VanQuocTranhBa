// ===== UI Mount =====
  function mountTopbar(){
    dom.topbar.innerHTML = `
      <div class="pill" id="pill-wood" data-tip="Gỗ / sức chứa kho">${ico("wood")} <b id="t-wood">0</b> <span class="tiny">/ <span id="tcap-wood">0</span></span></div>
      <div class="pill" id="pill-clay" data-tip="Đất sét / sức chứa kho">${ico("clay")} <b id="t-clay">0</b> <span class="tiny">/ <span id="tcap-clay">0</span></span></div>
      <div class="pill" id="pill-iron" data-tip="Sắt / sức chứa kho">${ico("iron")} <b id="t-iron">0</b> <span class="tiny">/ <span id="tcap-iron">0</span></span></div>
      <div class="pill" id="pill-crop" data-tip="Lúa / sức chứa kho lương">${ico("crop")} <b id="t-crop">0</b> <span class="tiny">/ <span id="tcap-crop">0</span></span></div>
      <div class="pill" data-tip="Tuổi làng (ngày)">${ico("hourglass")} <b id="t-time">Ngày 1</b></div>
      <div class="pill" style="min-width:340px" data-tip="Trạng thái"><span id="t-status" class="tiny"></span></div>
    `;

    // Emoji -> Twemoji SVG
    renderEmoji(dom.topbar);

    dom.resText.wood = document.querySelector("#t-wood");
    dom.resText.clay = document.querySelector("#t-clay");
    dom.resText.iron = document.querySelector("#t-iron");
    dom.resText.crop = document.querySelector("#t-crop");

    dom.resCapText.wood = document.querySelector("#tcap-wood");
    dom.resCapText.clay = document.querySelector("#tcap-clay");
    dom.resCapText.iron = document.querySelector("#tcap-iron");
    dom.resCapText.crop = document.querySelector("#tcap-crop");

    dom.timeText = document.querySelector("#t-time");
    dom.statusText = document.querySelector("#t-status");

    dom.topPill.wood = document.querySelector("#pill-wood");
    dom.topPill.clay = document.querySelector("#pill-clay");
    dom.topPill.iron = document.querySelector("#pill-iron");
    dom.topPill.crop = document.querySelector("#pill-crop");

  }

  function mountSidebar(){
    dom.sidebar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-view]");
      if(!btn) return;
      state.view = btn.dataset.view;
      renderSidebar();
      renderMain();
    });

    renderSidebar();
  }

  function renderSidebar(){
    const MENU = [
      { type:"item", key:"village", label:"Làng", icon:"village" },
      { type:"item", key:"map", label:"Bản đồ", icon:"map" },

      // FIX CỨNG menu con (không xổ xuống)
      { type:"fixed", key:"buildings", label:"Công trình", icon:"buildings", children:[
        { key:"b:woodcutter", label:BUILDINGS.woodcutter.name, icon:"woodcutter" },
        { key:"b:claypit", label:BUILDINGS.claypit.name, icon:"claypit" },
        { key:"b:ironmine", label:BUILDINGS.ironmine.name, icon:"ironmine" },
        { key:"b:cropland", label:BUILDINGS.cropland.name, icon:"cropland" },
        { key:"b:warehouse", label:BUILDINGS.warehouse.name, icon:"warehouse" },
        { key:"b:granary", label:BUILDINGS.granary.name, icon:"granary" },
      ]},

      { type:"fixed", key:"barracks", label:"Doanh trại", icon:"barracks", children:[
        { key:"t:infantryCamp", label:TRAIN_BUILDINGS.infantryCamp.name, icon:"infantryCamp" },
        { key:"t:archeryRange", label:TRAIN_BUILDINGS.archeryRange.name, icon:"archeryRange" },
        { key:"t:stable", label:TRAIN_BUILDINGS.stable.name, icon:"stable" },
      ]},

      { type:"item", key:"army", label:"Quân đội", icon:"army" },
      { type:"item", key:"reports", label:"Báo cáo", icon:"reports" },
    ];

    const badgeFor = (viewKey) => {
      if(viewKey==="village") return totalLevel();
      if(viewKey==="army") return totalArmy();
      if(viewKey==="reports") return state.reports.length;
      if(viewKey==="map") return state.marches.length || "—";
      if(viewKey.startsWith("b:")) return state.buildings[viewKey.slice(2)] || 0;
      if(viewKey.startsWith("t:")) return state.train[viewKey.slice(2)]?.queue.length || 0;
      return 0;
    };
    const groupBadge = (g) => {
      if(g==="buildings") return state.buildJob ? 1 : 0;
      if(g==="barracks"){
        return Object.values(state.train).reduce((a,b)=>a + (b.queue.length>0?1:0),0);
      }
      return 0;
    };

    dom.sidebar.innerHTML = MENU.map(m=>{
      if(m.type==="item"){
        const active = (state.view===m.key) ? "active" : "";
        return `
          <div class="navItem ${active}" data-view="${m.key}">
            <div class="navLeft">${icoTok(m.icon)} <div class="navLabel">${m.label}</div></div>
            <div class="badge">${badgeFor(m.key)}</div>
          </div>
        `;
      }
      // fixed group
      return `
        <div class="navGroupFixed" data-group="${m.key}">
          <div class="navItem navGroupHeader">
            <div class="navLeft">${icoTok(m.icon)} <div class="navLabel">${m.label}</div></div>
            <div class="badge">${groupBadge(m.key)}</div>
          </div>
          <div class="navChildren">
            ${m.children.map(c=>{
              const active = (state.view===c.key) ? "active" : "";
              return `
                <div class="navSub ${active}" data-view="${c.key}">
                  <div class="navLeft">${ico(c.icon,true)} <div class="navLabel">${c.label}</div></div>
                  <div class="badge">${badgeFor(c.key)}</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      `;
    }).join("");

    // Emoji -> Twemoji SVG
    renderEmoji(dom.sidebar);
  }

  function mountRight(){
    dom.right.innerHTML = `
      <div class="card">
        <h3>${icoTok("scroll")} Sản lượng/phút <span class="fx fx-prod" id="fx-prod" title="Sản lượng tăng">📈</span></h3>
        <div class="tiny" id="r-prod">—</div>
      </div>

      <div class="card">
        <h3>${icoTok("map")} Hành quân <span class="fx fx-march is-hidden" id="fx-march" title="Đang hành quân">🥾</span></h3>
        <div class="tiny">Đang chạy: <b id="r-mcount">0</b></div>
      </div>

      <div class="card">
        <h3>${icoTok("scroll")} Kho & Kho lương</h3>
        <div class="tiny" id="r-cap"></div>
        <div class="divider"></div>

        ${invRow("wood","Gỗ")}
        ${invRow("clay","Đất sét")}
        ${invRow("iron","Sắt")}
        ${invRow("crop","Lúa")}
      </div>
    `;

    // Emoji -> Twemoji SVG
    renderEmoji(dom.right);

    dom.fxProd = document.querySelector("#fx-prod");
    dom.fxMarch = document.querySelector("#fx-march");

    // Map warning icons
    dom.fullWarn = {};
    dom.right.querySelectorAll('[data-fullwarn]').forEach(el=>{
      dom.fullWarn[el.dataset.fullwarn] = el;
    });

    // Progress wrappers (for full state)
    dom._rProgWrap = {};
    dom.right.querySelectorAll('[data-rprog]').forEach(el=>{
      dom._rProgWrap[el.dataset.rprog] = el;
    });


    dom.right.querySelectorAll("[data-rbar]").forEach(el=>{
      dom.resBar[el.dataset.rbar] = el;
    });

    ["wood","clay","iron","crop"].forEach(k=>{
      dom.resText["r_"+k] = document.querySelector("#r-"+k);
      dom.resCapText["r_"+k] = document.querySelector("#rcap-"+k);
    });

    dom.resCapText.r_cap = document.querySelector("#r-cap");
    dom.resCapText.r_prod  = document.querySelector("#r-prod");
    dom.resCapText.r_mcount  = document.querySelector("#r-mcount");

    function invRow(key,label){
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin:10px 0;">
          <div style="display:flex; align-items:center; gap:8px; min-width:120px;">
            ${ico(key)} <b>${label}</b>
            <span class="fx fx-full is-hidden" data-fullwarn="${key}" title="Kho đầy">⚠️</span>
          </div>
          <div style="flex:1;">
            <div class="progress" data-rprog="${key}" data-tip="${label}">
              <i data-rbar="${key}"></i>
            </div>
          </div>
          <div class="tiny" style="min-width:120px; text-align:right;">
            <b id="r-${key}">0</b> / <span id="rcap-${key}">0</span>
          </div>
        </div>
      `;
    }
  }
