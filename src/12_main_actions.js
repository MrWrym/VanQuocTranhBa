// ===== Main actions =====
  dom.main.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if(!btn) return;
    const act = btn.dataset.act;

    if(act === "upgrade"){
      startUpgrade(btn.dataset.key);
      return;
    }

    if(act === "train"){
      enqueueTraining(btn.dataset.key, state._draftQty ?? 1);
      return;
    }
  });
