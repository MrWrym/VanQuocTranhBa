// ===== Helpers =====
  const uid = () => (
    (self.crypto && typeof self.crypto.randomUUID === "function")
      ? self.crypto.randomUUID()
      : ("m" + Math.random().toString(16).slice(2) + Date.now().toString(16))
  );
  const fmt = (n) => Math.floor(n).toLocaleString("vi-VN");
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

  // ===== Twemoji helper =====
  // Convert all emoji characters in a DOM subtree into Twemoji SVG (<img class="emoji" ...>)
  // so UI looks identical on Windows/Mac/Android/iOS.
  const TWEMOJI_OPTS = {
    base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/",
    folder: "svg",
    ext: ".svg",
  };

  function renderEmoji(root=document.body){
    try{
      if(!root || !self.twemoji || typeof self.twemoji.parse !== "function") return;
      self.twemoji.parse(root, TWEMOJI_OPTS);
    }catch(_e){/* ignore */}
  }
