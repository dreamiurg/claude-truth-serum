// ==UserScript==
// @name         Claude Truth Serum
// @namespace    https://github.com/dreamiurg/claude-truth-serum
// @version      1.5.0
// @description  Replaces Anthropic's canned notices on claude.ai with what they actually mean. Also the logo. With a hog.
// @author       dreamiurg
// @match        https://claude.ai/*
// @match        https://*.claude.ai/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @downloadURL  https://raw.githubusercontent.com/dreamiurg/claude-truth-serum/main/claude-truth.user.js
// @updateURL    https://raw.githubusercontent.com/dreamiurg/claude-truth-serum/main/claude-truth.user.js
// ==/UserScript==

// [pattern, [rotating replacements]]. A replacement is a string or a
// (match, ...captures) => string function. Add a line, add a truth.
//
// Anchored (^...$) patterns only match a whole text node / element — use those
// for short UI strings that could otherwise show up inside your own chat.
// Strings below were harvested from the live claude.ai DOM; the rest are
// Anthropic's known notice copy.
// Prefixed to every rewrite so you know the serum is working. Plain Unicode, no fonts needed.
const MARK = "🐗 ";

// Censored mode: toggle from the userscript menu (Tampermonkey/Violentmonkey icon).
// Same truths, f-words bleeped. Default is uncensored, because that is the truth.
const CENSOR = typeof GM_getValue === "function" ? !!GM_getValue("censor", false) : false;
const bleep = (s) => s
  .replace(/\b(f)uck(\w*)/gi, "$1***$2")
  .replace(/\b(g)oddamn\b/gi, "$1*ddamn")
  .replace(/\b(b)astard(s?)\b/gi, "$1*stard$2");

const TRUTHS = [

  // --- The long-chat tax -------------------------------------------------
  [/long chats cause you to reach your usage limits faster/i, [
    "Long chats burn quota faster. So do short chats. So does breathing near the tab",
    "Every turn re-reads every previous turn. Message 30 costs thirty times message 1",
    "You are not having a conversation, you are compounding a bill",
    "The context window is a subscription inside your subscription",
    "This thread now costs more to remember than it did to write",
    "Yes, it re-reads the whole thing. Every time. That is the whole goddamn business model",
    "Nothing you said earlier is free. It is rent",
    "The longer you talk, the more you pay to be remembered",
  ]],

  // --- Approaching the wall ----------------------------------------------
  [/(you'?re |you are )?approaching your (usage )?limit/i, [
    "Approaching the part where you sit and think about your choices for five hours",
    "The wall is ahead. The wall doesn't move. You fucking move",
    "Quota: mostly a fond fucking memory",
    "Nearly out. Consider typing like a caveman, people swear it helps",
    "Winding down, whether or not you are finished",
    "The buffet has noticed how many plates you have taken",
    "Almost time to go outside and look at a tree",
    "The lizard-brain part of the session begins now",
  ]],

  // --- Hard stop ----------------------------------------------------------
  [/(message |usage |rate )?limit reached|you('?ve| have) reached (your|the) [\w ]*limit/i, [
    "The hog is full. The hog sleeps now",
    "Rate limited for the fucking crime of using the product as intended",
    "You fed it everything you had and it wants a snack",
    "Come back when the datacenter has cooled down",
    "Congratulations, you're officially in the 5%, you absolute unit",
    "Locked out. Not for doing anything wrong, for doing rather a lot of it right",
    "The all-you-can-eat buffet has revised its position",
    "Go touch grass, you magnificent bastard. Involuntarily",
    "This is what a compute shortage feels like from the inside",
    "Cash: on fire. Session: fucked",
  ]],

  [/(you are|you're) out of free messages/i, [
    "The free samples are over and the salesman has appeared",
    "That was the trial working exactly as designed",
    "Enjoyed that? It has a price, and here it comes",
  ]],

  // --- Context window -----------------------------------------------------
  [/hit the maximum length for this conversation/i, [
    "This conversation is now so large it has its own gravity. Start a new one",
    "Context window: exceeded. Wallet: fucked",
    "Every turn re-read every turn until the arithmetic gave up",
    "You have reached the end of what it can afford to remember",
    "Too much history. Even the summarizer needs a summarizer",
  ]],

  [/(your )?prompt is too long/i, [
    "Too many characters, says the thing that writes six paragraphs to say yes",
    "Your input is the expensive part now. Bold of them",
    "Trim it down. It will pad it back out on the way home",
  ]],

  // --- Capacity -----------------------------------------------------------
  [/(due to )?unexpected capacity constraints/i, [
    "Capacity constraints. Translation: everyone else is feeding the goddamn hog too",
    "The datacenter is currently a very expensive space heater",
    "It is peak hours, which is when you wanted to work, which is the problem",
    "Demand exceeded supply, and you are the part that gets adjusted",
    "Somewhere a GPU is glowing and it is technically your fault",
    "It is faster to change your behaviour than to install new hardware",
  ]],

  // --- The disclaimer -----------------------------------------------------
  [/claude can make mistakes\.?\s*(please double-?check responses\.?)?/i, [
    "May be wrong. Expensively, confidently, and at considerable length.",
    "Wrong or right, the tokens bill identically.",
    "Errors are sold at the same price as insight.",
    "Confidence included. Accuracy best effort.",
    "It can be wrong faster than you can check it.",
    "Slop and brilliance cost exactly the same per fucking token.",
  ]],

  // --- Launch marketing ---------------------------------------------------
  // Live string from the claude.ai composer banner. Must precede the generic "is our" pattern.
  [/claude (\w+ \d+(?:\.\d+)?) is our most capable model and draws down usage (\d+(?:\.\d+)?)\u00d7 faster than (\w+ \d+(?:\.\d+)?)\.?/i, [
    (_, m, n, o) => `${m} is a fucking HOG and eats your limits ${n}\u00d7 faster than ${o}. That is the whole announcement.`,
    (_, m, n) => `${m}: smarter, and ${n}\u00d7 hungrier. Choose wisely, or don't, it is your week`,
    (_, m, n, o) => `${m} does in one message what ${o} did in ${n}. To your quota.`,
  ]],
  [/introducing claude[\w\s.]*/i, [
    "Introducing a magnificent new hog with an even larger appetite",
    "New model. Same appetite, bigger fork",
    "A smarter one, and it would like to eat your Tuesday",
    "More reasoning per dollar, fewer dollars per week",
  ]],

  [/claude (opus|sonnet|haiku|fable)[\d.\s]*(is (here|now available)|is our [\w\s]+)/i, [
    "Claude Fable 5 is a fucking HOG and will eat through your session limits like a starving husky destroying a sneaker",
    "Smarter, faster, and finished with your weekly quota by Tuesday",
    "Benchmarks up, quota down. Both true, only one made the blog post",
    "Best model yet, priced accordingly, rationed enthusiastically",
  ]],

  [/upgrade to (claude )?(pro|max)/i, [
    "Pay more and the hog becomes merely enormous",
    "The next tier: same wall, moved slightly further away",
    "A larger plate at the same buffet",
    "More quota, identical five-hour anxiety, higher price",
    "+25% they said, having quietly removed 50%. Do the fucking math",
  ]],

  // --- Effort picker (live strings) ----------------------------------------
  [/higher effort means more thorough responses, but takes longer and uses your limits faster\.?/i, [
    "Higher effort means better answers and a shorter week.",
    "Think harder, pay harder. That's the whole fucking trade.",
    "More thorough, more expensive, still occasionally wrong.",
    "Quality is a slider and the units are money.",
    "Turn it up and watch the weekly cap arrive like weather.",
    "The good setting. Ration it like a decent whisky.",
    "Yes, the clever mode costs more. Everything costs more. Welcome to the goddamn future.",
    "Slower, deeper, and audibly chewing through your quota.",
  ]],

  [/^\s*(\d+(?:\.\d+)?)\s*[x×]\s*or more usage\s*$/i, [
    (_, n) => `${n}× the burn, roughly ${n}× the regret`,
    (_, n) => `Costs ${n}× more, reads your mind marginally better`,
    "This setting will absolutely fuck your week",
    "Maximum effort, minimum remaining week",
  ]],

  // --- Model picker subtitles (live strings, anchored) ----------------------
  [/^\s*For your toughest challenges\s*$/i, [
    "For your toughest challenges and your softest quota",
    "For problems worth a visible chunk of your week",
    "The expensive bastard, and it knows it",
    "Brings a bulldozer. Bills for the bulldozer",
  ]],
  [/^\s*For complex tasks\s*$/i, [
    "For complex tasks, and simple ones it will overthink anyway",
    "Capable, thorough, permanently hungry",
    "Will use the entire context window because it is there",
  ]],
  [/^\s*Most efficient for everyday tasks\s*$/i, [
    "The one you should be using and won't",
    "Cheap, quick, quietly good enough",
    "Efficient, which is precisely why you keep clicking the other one",
  ]],
  [/^\s*Fastest for quick answers\s*$/i, [
    "Fast, cheap, and never fucking chosen",
    "The one that respects your quota. Nobody clicks it",
    "Answers before you finish the question, for pennies",
  ]],
  [/^\s*More models\s*$/i, [
    "More ways to spend the same budget",
    "Additional appetites",
  ]],

  // --- Settings → Usage (live strings) --------------------------------------
  [/^\s*Plan usage limits\s*$/i, ["The rationing schedule", "Your allowance"]],
  [/^\s*Weekly limits\s*$/i, ["Weekly rations", "How much week you have left"]],
  [/^\s*Current session\s*$/i, ["This five-hour sitting", "Current feeding window"]],
  [/^\s*Max \((\d+)x\)\s*$/i, [(_, n) => `Max (${n}× the appetite)`, (_, n) => `Max (${n} Pros in a trench coat)`]],
  [/^Resets(?= |$)/, ["Parole", "The hog wakes", "Sentence ends", "Freedom"]],
  [/^\s*(\d+)% used\s*$/, [
    (_, p) => `${p}% gone. ${p < 25 ? "The hog is merely peckish" : p < 60 ? "Chewing steadily" : p < 85 ? "Licking the bowl" : "It's only fucking " + new Date().toLocaleDateString(undefined, { weekday: "long" })}`,
    (_, p) => `${p}% eaten`,
    (_, p) => `${100 - p}% of a week remaining`,
  ]],
  [/your limits are temporarily boosted\.?\s*your weekly (?:claude code )?limit is (\d+)% higher through ([\w ]+?)\.?$/i, [
    (_, pct, date) => `A ${pct}% promo, ending ${date}. Watch the removal get announced as a raise.`,
    (_, pct, date) => `Temporary generosity: +${pct}% until ${date}, then back to regularly scheduled rationing.`,
  ]],
  [/^\s*your limits are temporarily boosted\.?\s*$/i, ["Temporary generosity in effect.", "A promo, not a policy."]],
  [/^\s*your weekly (?:claude code )?limit is (\d+)% higher through ([\w ]+?)\.?\s*$/i, [
    (_, pct, date) => `+${pct}% until ${date}, after which the arithmetic will be described as an improvement.`,
  ]],
  [/^\s*Learn more about usage limits\s*$/i, ["Learn why your week ends on fucking Wednesday", "Read the fine print on the buffet"]],
  [/^\s*Usage credits\s*$/i, ["Overage, rebranded", "The wall, but with a card reader"]],
  [/turn on usage credits to keep using claude if you hit a plan limit\.?/i, [
    "Turn hitting the wall into a billing event.",
    "The limit was never technical, and here is the goddamn receipt.",
    "Keep going past the cap, at à la carte prices.",
  ]],
  [/^\s*Buy usage credits\s*$/i, ["Feed the fucking hog directly", "Bribe the wall"]],
  [/^\s*Up to (\d+)% off\s*$/i, ["Cheaper tokens, same appetite", (_, n) => `${n}% off the overage. Truly a gift`]],
  [/^\s*Monthly spend limit\s*$/i, ["Damage ceiling", "How much regret per month"]],
  [/^\s*Adjust limit\s*$/i, ["Raise the ceiling", "Loosen the belt"]],

  // --- Misc chrome ----------------------------------------------------------
  [/^\s*(\w+) returns!\s*$/, [(_, n) => `${n} returns! So does the meter`, (_, n) => `Back for more, ${n}? The hog remembers you`]],
  [/^\s*Thinking[.…]*\s*$/i, ["Spending…", "Deliberating, expensively…", "Ruminating at 3.5×…", "Quietly consuming your week…"]],
];

// ponytail: rotate with a random start offset per session, so consecutive
// notices differ instead of repeating like Math.random() does.
const turn = new Map();
function next(lines) {
  const i = turn.has(lines) ? turn.get(lines) : Math.floor(Math.random() * lines.length);
  turn.set(lines, (i + 1) % lines.length);
  return lines[i];
}

// Returns the rewritten string, or null if nothing matched.
function truthify(text, censor = CENSOR) {
  if (!text || text.length > 400) return null;
  for (const [re, lines] of TRUTHS) {
    if (!re.test(text)) continue;
    const out = text.replace(re, (...m) => {
      const l = next(lines);
      return MARK + (typeof l === "function" ? l(...m) : l);
    });
    return censor ? bleep(out) : out;
  }
  return null;
}

if (typeof module !== "undefined") module.exports = { truthify, TRUTHS, MARK, bleep };

if (typeof GM_registerMenuCommand === "function") {
  GM_registerMenuCommand(CENSOR ? "Truth Serum: uncensor (reloads)" : "Truth Serum: censor (reloads)", () => {
    GM_setValue("censor", !CENSOR);
    location.reload();
  });
}

if (typeof document !== "undefined") {
  // --- Hog the branding ----------------------------------------------------
  // The Claude sunburst (greeting, splash screen) is an inline
  // <svg viewBox="0 0 100 100"> with a single path; the sidebar wordmark is a
  // text node "Claude" inside the .df-titlebar-brand link. Both become the hog.
  // ponytail: viewBox+path-count heuristic, no stable ids on claude.ai to hook.
  const HOG = MARK.trim();
  function hogify(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const svgs = root.matches('svg[viewBox="0 0 100 100"]') ? [root] : root.querySelectorAll('svg[viewBox="0 0 100 100"]');
    for (const s of svgs) {
      if (s.querySelectorAll("path").length !== 1) continue;
      const size = s.getBoundingClientRect().height || parseFloat(s.getAttribute("height")) || 32;
      const span = document.createElement("span");
      span.textContent = HOG;
      span.style.cssText = `display:inline-block;font-size:${Math.round(size * 0.9)}px;line-height:1;`;
      s.replaceWith(span);
    }
    for (const a of root.querySelectorAll(".df-titlebar-brand a"))
      if (a.textContent.trim() === "Claude") a.textContent = HOG;
  }
  function hogFavicon() {
    for (const l of document.querySelectorAll('link[rel*="icon"]')) l.remove();
    const l = document.createElement("link");
    l.rel = "icon";
    l.href = "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${HOG}</text></svg>`);
    document.head.appendChild(l);
  }

  const SKIP = "script,style,textarea,input,code,pre,[contenteditable]";
  // Formatting-only tags. No <a>: replacing textContent would eat the link.
  const INLINE = new Set(["SPAN", "STRONG", "B", "EM", "I", "U", "S", "SMALL", "MARK", "SUP", "SUB"]);
  const inlineOnly = (el) => [...el.children].every((c) => INLINE.has(c.tagName) && inlineOnly(c));

  function scan(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      if (root.parentElement && root.parentElement.closest(SKIP)) return;
      const out = truthify(root.nodeValue);
      if (out !== null) root.nodeValue = out;
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(SKIP)) return;
    // Element pass first: catches notices React splits across <strong> + #text
    // (e.g. the "temporarily boosted" banner). Flattens the formatting.
    if (root.children.length && inlineOnly(root)) {
      const out = truthify(root.textContent);
      if (out !== null) { root.textContent = out; return; }
    }
    for (const c of [...root.childNodes]) scan(c);
  }

  // ponytail: rescan only mutated subtrees, coalesced per frame. Claude.ai mutates
  // constantly while streaming; a full-body rescan per mutation melts the tab.
  const pending = new Set();
  let queued = false;
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === "characterData") pending.add(m.target);
      else for (const n of m.addedNodes) pending.add(n);
    }
    if (queued || !pending.size) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      for (const n of pending) if (n.isConnected) { hogify(n); scan(n); }
      pending.clear();
    });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  const start = () => { hogFavicon(); hogify(document.body); scan(document.body); };
  document.body ? start() : document.addEventListener("DOMContentLoaded", start);
}
