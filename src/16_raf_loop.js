// ===== rAF loop =====
  function rafLoop(nowMs){
    renderPatch(nowMs);
    requestAnimationFrame(rafLoop);
  }
