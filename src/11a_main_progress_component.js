// ===== Main progress component (UI + logic render riêng) =====
  function mainProgressFrameHTML(){
    return `
      <div class="card">
        <h3>${icoTok("scroll")} Tiến độ</h3>
        <div class="progressGrid">
          <div class="progBox">
            <div class="tiny" style="display:flex; align-items:center; gap:8px;"><span class="fx fx-build is-hidden" id="fx-build" title="Đang nâng cấp">⚒️</span><b>Xây dựng</b>: <span id="m-build-label">—</span></div>
            <div class="progress" style="margin-top:6px"><i id="m-build-bar"></i></div>
          </div>
          <div class="progBox">
            <div class="tiny" style="display:flex; align-items:center; gap:8px;"><span class="fx fx-train is-hidden" id="fx-train" title="Đang huấn luyện">⚔️</span><b>Huấn luyện</b>: <span id="m-train-label">—</span></div>
            <div class="progress" style="margin-top:6px"><i id="m-train-bar"></i></div>
          </div>
        </div>
      </div>
    `;
  }

  function mountMainProgress(){
    if(!dom.mainProgress) return;
    dom.mainProgress.innerHTML = mainProgressFrameHTML();
    renderEmoji(dom.mainProgress);

    // Cache nodes (persistent, no need to requery on navigation)
    dom.mainBuildLabel = document.querySelector("#m-build-label");
    dom.mainBuildFill  = document.querySelector("#m-build-bar");
    dom.mainTrainLabel = document.querySelector("#m-train-label");
    dom.mainTrainFill  = document.querySelector("#m-train-bar");
    dom.fxBuild = document.querySelector("#fx-build");
    dom.fxTrain = document.querySelector("#fx-train");
  }

  function showMainProgress(show){
    if(!dom.mainProgress) return;
    dom.mainProgress.style.display = show ? "" : "none";
    if(dom.main) dom.main.classList.toggle("noTopPad", !!show);
  }
