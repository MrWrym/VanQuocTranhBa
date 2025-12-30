// ===== Boot =====
  async function boot(){
    // Load saved progress (IndexedDB)
    try{
      if(self.SaveManager && typeof self.SaveManager.initAndLoad === "function"){
        await self.SaveManager.initAndLoad();
      }
    }catch(_e){/* ignore */}

    // Init map only if not already loaded from save
    if(!state.map) initMap();
    mountTopbar();
    mountSidebar();
    mountRight();
    renderMain();

    // Ensure all existing emoji are rendered as Twemoji SVG
    renderEmoji(document.body);
    addReport("System", "Demo started.");
    setInterval(tickLogic, CFG.tickMs);
    requestAnimationFrame(rafLoop);
  }

  boot();
