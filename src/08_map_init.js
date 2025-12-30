// ===== Map init =====
  function initMap(){
    const N = state.mapSize;
    const grid = Array.from({length:N}, ()=>Array.from({length:N}, ()=>({
      type:"empty", res:null, owner:null, defense:0
    })));

    const {x,y} = state.villagePos;
    grid[y][x] = { type:"village", res:null, owner:"player", defense:0 };

    const rnd = (a,b)=> a + Math.floor(Math.random()*(b-a+1));
    const pickRes = ()=> ["wood","clay","iron","crop"][rnd(0,3)];

    let placedRes = 0;
    while(placedRes < 70){
      const rx = rnd(0,N-1), ry = rnd(0,N-1);
      if(grid[ry][rx].type !== "empty") continue;
      grid[ry][rx] = { type:"resource", res: pickRes(), owner:null, defense:0 };
      placedRes++;
    }

    let placedNpc = 0;
    while(placedNpc < 10){
      const rx = rnd(0,N-1), ry = rnd(0,N-1);
      if(grid[ry][rx].type !== "empty") continue;
      grid[ry][rx] = { type:"npc", res:null, owner:null, defense: rnd(60,180) };
      placedNpc++;
    }

    state.map = grid;
  }
