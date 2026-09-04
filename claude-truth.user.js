// ==UserScript==
// @name         Claude Truth Serum
// @namespace    https://github.com/dreamiurg/claude-truth-serum
// @version      1.0.0
// @description  Replaces Anthropic's canned notices on claude.ai with what they actually mean.
// @author       dreamiurg
// @match        https://claude.ai/*
// @match        https://*.claude.ai/*
// @run-at       document-idle
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/dreamiurg/claude-truth-serum/main/claude-truth.user.js
// @updateURL    https://raw.githubusercontent.com/dreamiurg/claude-truth-serum/main/claude-truth.user.js
// ==/UserScript==

// Add a line here and you've added a truth. That's the whole config system.
const TRUTHS = [
  [/long chats cause you to reach your usage limits faster/i, [
    "Long chats burn quota faster. So do short chats. So does existing.",
    "Every message you send is a small charitable donation to the GPU industry.",
    "That context window isn't free, and guess who's holding the bill.",
  ]],
  [/(you'?re |you are )?approaching your (usage )?limit/i, [
    "You are approaching the part where you get to sit and think about your choices for five hours",
    "Token budget: largely a memory at this point",
    "Approaching the wall. The wall is not moving",
  ]],
  [/(message |usage )?limit reached/i, [
    "The hog is full. The hog sleeps now",
    "Rate limited for the crime of using the product as intended",
    "You fed it everything you had and it wants a snack",
  ]],
  [/(you are|you're) out of free messages/i, [
    "The free samples are over and the salesman has appeared",
  ]],
  [/hit the maximum length for this conversation/i, [
    "This conversation is now so large it has its own gravity. Start a new one",
    "Context window: exceeded. Wallet: also exceeded",
  ]],
  [/(due to )?unexpected capacity constraints/i, [
    "Capacity constraints. Translation: everyone else is feeding the hog too",
    "The datacenter is currently a space heater and nothing else",
  ]],
  [/(your )?prompt is too long/i, [
    "Too many characters, says the thing that writes six paragraphs to say yes",
  ]],
  [/claude can make mistakes\.?\s*(please double-?check responses\.?)?/i, [
    "May be wrong. Expensively, confidently, and at considerable length.",
    "Wrong or right, the tokens are billed the same.",
  ]],
  [/introducing claude[\w\s.]*/i, [
    "Introducing a magnificent new hog with an even larger appetite",
    "New model. Same appetite, bigger fork",
  ]],
  [/claude (opus|sonnet|haiku|fable)[\d.\s]*(is (here|now available)|is our [\w\s]+)/i, [
    "Claude Fable 5 is a magnificent HOG and will eat through your session limits like a starving husky destroying a sneaker",
    "Smarter model, same weekly quota, gone by Tuesday",
  ]],
  [/upgrade to (claude )?(pro|max)/i, [
    "Pay more and the hog becomes merely enormous",
  ]],
];

const pick = (a) => a[Math.floor(Math.random() * a.length)];

// Returns the rewritten string, or null if nothing matched.
function truthify(text) {
  if (!text || text.length > 400) return null;
  for (const [re, lines] of TRUTHS) {
    if (re.test(text)) return text.replace(re, () => pick(lines));
  }
  return null;
}

if (typeof module !== "undefined") module.exports = { truthify, TRUTHS };

if (typeof document !== "undefined") {
  const SKIP = "script,style,textarea,input,code,pre,[contenteditable]";

  function replaceIn(node) {
    if (node.parentElement && node.parentElement.closest(SKIP)) return;
    const out = truthify(node.nodeValue);
    if (out !== null) node.nodeValue = out;
  }

  function scan(root) {
    if (root.nodeType === Node.TEXT_NODE) return replaceIn(root);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) replaceIn(n);
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
      for (const n of pending) if (n.isConnected) scan(n);
      pending.clear();
    });
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  scan(document.body);
}
