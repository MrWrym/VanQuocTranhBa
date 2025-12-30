// ===== March helpers =====
  function euclid(a,b){
    const dx = a.x-b.x, dy = a.y-b.y;
    return Math.sqrt(dx*dx + dy*dy);
  }
  function travelSec(from,to){
    return clamp(Math.ceil(euclid(from,to)/2), 1, 10);
  }

  // Combat + loot helpers
  function troopSum(t){ return (t.infantry||0) + (t.archer||0) + (t.cavalry||0); }
  function calcAtk(t){
    return (t.infantry||0)*UNITS.infantry.atk + (t.archer||0)*UNITS.archer.atk + (t.cavalry||0)*UNITS.cavalry.atk;
  }
  function applyLosses(t, lossRate){
    const f = (n)=> Math.max(0, Math.floor(n * (1 - lossRate)));
    return { infantry: f(t.infantry||0), archer: f(t.archer||0), cavalry: f(t.cavalry||0) };
  }
  function genLoot(defPower, survivors){
    const carry = troopSum(survivors) * 18;
    const base  = Math.floor(80 + defPower * 1.8);
    const total = Math.max(0, Math.min(base, carry));
    const w = Math.floor(total*0.30);
    const c = Math.floor(total*0.30);
    const i = Math.floor(total*0.22);
    const f = Math.max(0, total - w - c - i);
    return { wood:w, clay:c, iron:i, crop:f };
  }

  function paintSingleCell(gridEl, x, y, doTwemoji=false){
    if(!gridEl) return;
    const el = gridEl.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if(!el) return;
    const c = state.map[y][x];
    el.className = "cell" + (c.type ? ` ${c.type}`:"") + (c.owner==="player" ? " owned":"");
    if(state.selected && state.selected.x===x && state.selected.y===y) el.classList.add("sel");
    if(c.type==="village") el.innerHTML = ico("home",true);
    else if(c.type==="resource") el.innerHTML = ico(c.res,true);
    else if(c.type==="npc") el.innerHTML = ico("sword",true);
    else el.innerHTML = "";

    if(doTwemoji) renderEmoji(el);
  }

  function paintAllCells(gridEl){
    const N = state.mapSize;
    for(let y=0;y<N;y++){
      for(let x=0;x<N;x++){
        paintSingleCell(gridEl,x,y,false);
      }
    }

    // Emoji -> Twemoji SVG (parse once for the whole grid)
    renderEmoji(gridEl);
  }
