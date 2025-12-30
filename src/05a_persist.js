// ===== Persistence (IndexedDB) =====
// Goal (v4.6):
// - Auto-save every 5 minutes (default)
// - Save immediately on major changes (explicit user actions / major state transitions)
// NOTE: Offline progression / beforeunload / backup & import-export will be added later.

  const SaveManager = (()=>{
    const DB_NAME = "van-quoc-tranh-ba";
    const DB_VER  = 1;
    const STORE   = "saves";
    const KEY_LATEST = "latest";
    const SAVE_SCHEMA_VER = 1;

    let db = null;
    let inited = false;
    let dirty = false;
    let saving = false;
    let pending = false;
    let autosaveTimer = null;

    function supported(){
      return typeof indexedDB !== "undefined" && indexedDB;
    }

    function openDB(){
      return new Promise((resolve, reject)=>{
        try{
          const req = indexedDB.open(DB_NAME, DB_VER);
          req.onupgradeneeded = ()=>{
            const _db = req.result;
            if(!_db.objectStoreNames.contains(STORE)){
              _db.createObjectStore(STORE);
            }
          };
          req.onsuccess = ()=> resolve(req.result);
          req.onerror = ()=> reject(req.error);
        }catch(e){
          reject(e);
        }
      });
    }

    function idbGet(key){
      if(!db) return Promise.resolve(null);
      return new Promise((resolve)=>{
        try{
          const tx = db.transaction(STORE, "readonly");
          const os = tx.objectStore(STORE);
          const req = os.get(key);
          req.onsuccess = ()=> resolve(req.result ?? null);
          req.onerror = ()=> resolve(null);
        }catch(_e){
          resolve(null);
        }
      });
    }

    function idbPut(key, val){
      if(!db) return Promise.resolve(false);
      return new Promise((resolve)=>{
        try{
          const tx = db.transaction(STORE, "readwrite");
          const os = tx.objectStore(STORE);
          const req = os.put(val, key);
          req.onsuccess = ()=> resolve(true);
          req.onerror = ()=> resolve(false);
        }catch(_e){
          resolve(false);
        }
      });
    }

    function nowPerf(){ return performance.now(); }

    function serializeState(){
      // Convert performance.now()-based timestamps into remaining/total durations so reload works.
      const t = nowPerf();

      const out = {
        view: state.view,
        openGroups: state.openGroups,

        villageDay: state.villageDay || 1,

        buildings: state.buildings,
        buildJob: null,

        resourcesBase: state.resourcesBase,
        units: state.units,
        train: null,
        reports: state.reports,

        map: state.map,
        mapSize: state.mapSize,
        villagePos: state.villagePos,
        selected: state.selected,
        marches: null,
      };

      // Build job
      if(state.buildJob){
        const j = state.buildJob;
        const totalMs = Math.max(1, (j.endAt - j.startAt));
        const remMs = clamp(j.endAt - t, 0, totalMs);
        out.buildJob = {
          key: j.key,
          fromLv: j.fromLv,
          toLv: j.toLv,
          totalMs,
          remMs,
        };
      }

      // Training
      out.train = {};
      for(const k of Object.keys(state.train)){
        const tb = state.train[k];
        const remMs = tb.currentEndAt ? Math.max(0, tb.currentEndAt - t) : 0;
        out.train[k] = {
          lv: tb.lv,
          queue: tb.queue,
          remMs,
        };
      }

      // Marches
      out.marches = state.marches.map(m=>{
        const totalMs = Math.max(1, (m.endAt - m.startAt));
        const remMs = clamp(m.endAt - t, 0, totalMs);
        return {
          id: m.id,
          from: m.from,
          to: m.to,
          phase: m.phase,
          action: m.action,
          sent: m.sent,
          troops: m.troops,
          loot: m.loot,
          totalMs,
          remMs,
        };
      });

      return out;
    }

    function applyLoadedData(data){
      if(!data || typeof data !== "object") return;

      // Primitive / simple objects
      if(data.view) state.view = data.view;
      if(data.openGroups) state.openGroups = data.openGroups;

      if(data.buildings) state.buildings = data.buildings;
      if(data.resourcesBase) state.resourcesBase = data.resourcesBase;
      if(data.units) state.units = data.units;
      if(Array.isArray(data.reports)) state.reports = data.reports;


      // Village age (days)
      if(Number.isFinite(data.villageDay)) state.villageDay = data.villageDay;
      else if(!Number.isFinite(state.villageDay) || state.villageDay < 1) state.villageDay = 1;

      if(data.map) state.map = data.map;
      if(data.mapSize) state.mapSize = data.mapSize;
      if(data.villagePos) state.villagePos = data.villagePos;
      state.selected = data.selected ?? null;

      // Rebuild job timeline using current performance.now
      const t = nowPerf();
      state.buildJob = null;
      if(data.buildJob){
        const j = data.buildJob;
        const totalMs = Math.max(1, j.totalMs||1);
        const remMs = clamp(j.remMs||0, 0, totalMs);
        const endAt = t + remMs;
        const startAt = endAt - totalMs;
        state.buildJob = {
          key: j.key,
          fromLv: j.fromLv,
          toLv: j.toLv,
          startAt,
          endAt,
        };
      }

      // Training timelines
      if(data.train){
        for(const k of Object.keys(state.train)){
          const s = data.train[k];
          if(!s) continue;
          state.train[k].lv = s.lv ?? state.train[k].lv;
          state.train[k].queue = Array.isArray(s.queue) ? s.queue : state.train[k].queue;
          const hasQueue = state.train[k].queue.length > 0;
          state.train[k].currentEndAt = (hasQueue && s.remMs) ? (t + Math.max(0, s.remMs)) : 0;
        }
      }

      // March timelines
      state.marches = [];
      if(Array.isArray(data.marches)){
        state.marches = data.marches.map(m=>{
          const totalMs = Math.max(1, m.totalMs||1);
          const remMs = clamp(m.remMs||0, 0, totalMs);
          const endAt = t + remMs;
          const startAt = endAt - totalMs;
          return {
            id: m.id,
            from: m.from,
            to: m.to,
            startAt,
            endAt,
            phase: m.phase,
            action: m.action,
            sent: m.sent,
            troops: m.troops,
            loot: m.loot,
          };
        });
      }

      // Reset transient runtime-only fields (not persisted)
      state.startedAt = t;
      state.lastTickAt = t;
      state.lastProdAt = t;

      state._pulseProdKick = 0;
      state._pulseProdApplied = 0;
      state._pulseRateKick = 0;
      state._pulseRateApplied = 0;

      state._marchUIKey = "";
      state._marchUIRows = new Map();
    }

    async function saveNow(reason="manual"){
      if(!db || !inited) return;
      if(!dirty && reason === "autosave") return;
      if(saving){ pending = true; return; }
      saving = true;
      try{
        const payload = {
          schema: SAVE_SCHEMA_VER,
          savedAt: Date.now(),
          reason,
          data: serializeState(),
        };
        await idbPut(KEY_LATEST, payload);
        dirty = false;
      }catch(_e){
        // ignore
      }finally{
        saving = false;
        if(pending){
          pending = false;
          // fire-and-forget follow-up
          saveNow("pending");
        }
      }
    }

    function markDirty(_reason="state"){
      dirty = true;
    }

    function bindLifecycle(){
      if(lifecycleBound) return;
      lifecycleBound = true;
      try{
        // Save when user leaves the tab or closes the page (best-effort)
        document.addEventListener('visibilitychange', ()=>{
          if(document.hidden){
            saveNow('visibility');
          }
        }, {passive:true});
        window.addEventListener('pagehide', ()=>{
          saveNow('pagehide');
        }, {passive:true});
        window.addEventListener('beforeunload', ()=>{
          saveNow('beforeunload');
        }, {passive:true});
        // Chrome Page Lifecycle API (optional)
        document.addEventListener('freeze', ()=>{
          saveNow('freeze');
        }, {passive:true});
      }catch(_e){/* ignore */}
    }

    async function initAndLoad(){
      if(inited) return;
      inited = true;

      if(!supported()) return;
      try{
        db = await openDB();
      }catch(_e){
        db = null;
        return;
      }

      // Load latest (if exists)
      const saved = await idbGet(KEY_LATEST);
      if(saved && saved.data){
        applyLoadedData(saved.data);
      }

      // Auto-save every 5 minutes (default)
      if(!autosaveTimer){
        autosaveTimer = setInterval(()=>{
          saveNow("autosave");
        }, 5*60*1000);
      }
      bindLifecycle();
    }

    return {
      initAndLoad,
      markDirty,
      saveNow,
      get dirty(){ return dirty; },
    };
  })();

  // Expose globally (top-level const is not attached to window)
  try{ self.SaveManager = SaveManager; }catch(_e){/* ignore */}
