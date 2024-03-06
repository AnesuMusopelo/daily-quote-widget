// Daily Quote Widget — free API, no keys.
// Caches one quote per local day to keep it "daily" and work even if offline.

const API = "https://api.quotable.io/random?tags=inspirational|life|wisdom";

const FALLBACKS = [
  {
    content: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  {
    content: "It always seems impossible until it’s done.",
    author: "Nelson Mandela",
  },
  {
    content: "You miss 100% of the shots you don’t take.",
    author: "Wayne Gretzky",
  },
  { content: "What we think, we become.", author: "Buddha" },
  { content: "Well begun is half done.", author: "Aristotle" },
];

const els = {
  quote: document.getElementById("quote"),
  author: document.getElementById("author"),
  refresh: document.getElementById("refresh"),
  copy: document.getElementById("copy"),
  share: document.getElementById("share"),
};

const todayKey = () => {
  const d = new Date(); // local time → resets at your midnight
  return d.toISOString().slice(0, 10);
};

function render({ content, author }) {
  els.quote.textContent = `“${content}”`;
  els.author.textContent = `— ${author}`;
}

async function fetchQuote() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(API, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    return { content: data.content, author: data.author || "Unknown" };
  } catch {
    // fallback to a random local quote
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }
}

async function loadQuote({ forceNew = false } = {}) {
  const key = `dq:${todayKey()}`;
  if (!forceNew) {
    const saved = localStorage.getItem(key);
    if (saved) {
      render(JSON.parse(saved));
      return;
    }
  }
  els.quote.textContent = "Loading…";
  els.author.textContent = "";
  const q = await fetchQuote();
  localStorage.setItem(key, JSON.stringify(q));
  render(q);
}

els.refresh.addEventListener("click", () => loadQuote({ forceNew: true }));

els.copy.addEventListener("click", async () => {
  const text = `${els.quote.textContent} ${els.author.textContent}`;
  try {
    await navigator.clipboard.writeText(text);
    els.copy.textContent = "✅ Copied";
    setTimeout(() => (els.copy.textContent = "📋 Copy"), 1200);
  } catch {
    /* ignore */
  }
});

els.share.addEventListener("click", async () => {
  const text = `${els.quote.textContent} ${els.author.textContent}`;
  const url = location.href;
  if (navigator.share) {
    try {
      await navigator.share({ text, url });
    } catch {}
  } else {
    const t = encodeURIComponent(text);
    window.open(`https://twitter.com/intent/tweet?text=${t}`, "_blank");
  }
});

// First load
loadQuote();
