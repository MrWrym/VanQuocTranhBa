// ===== DOM cache =====
  const dom = {
    topbar: document.querySelector("#topbar"),
    sidebar: document.querySelector("#sidebar"),
    mainTitle: document.querySelector("#mainTitle"),
    mainHint: document.querySelector("#mainHint"),
    mainProgress: document.querySelector("#mainProgress"),
    main: document.querySelector("#main"),
    right: document.querySelector("#right"),

    resText: {},
    resCapText: {},
    resBar: {},
    statusText: null,
    timeText: null,

    // Main progress (2 lanes)
    mainBuildFill: null,
    mainBuildLabel: null,
    mainTrainFill: null,
    mainTrainLabel: null,

    // Emoji FX nodes
    fxBuild: null,
    fxTrain: null,
    fxMarch: null,
    fxProd: null,
    fullWarn: {},
    topPill: {},
  };
