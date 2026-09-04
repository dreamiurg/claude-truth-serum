const assert = require("assert");
const { truthify, TRUTHS, MARK, bleep } = require("./claude-truth.user.js");

// Real strings harvested from claude.ai, plus the known notice copy.
const SAMPLES = [
  "Long chats cause you to reach your usage limits faster",
  "Higher effort means more thorough responses, but takes longer and uses your limits faster.",
  "3.5× or more usage",
  "1.5× or more usage",
  "For your toughest challenges",
  "Fastest for quick answers",
  "Max (20x)",
  "Resets in 4 hr 40 min",
  "Resets Sat 8:00 PM",
  "85% used",
  "2% used",
  "Your limits are temporarily boosted. Your weekly Claude Code limit is 50% higher through September 13.",
  "Your limits are temporarily boosted.",
  "Your weekly Claude Code limit is 50% higher through September 13.",
  "Turn on usage credits to keep using Claude if you hit a plan limit.",
  "Claude can make mistakes. Please double-check responses.",
  "Dmytro returns!",
  "Claude Fable 5 is our most capable model and draws down usage 2\u00d7 faster than Opus 5.",
  "Thinking…",
];

for (const s of SAMPLES) {
  const out = truthify(s);
  assert.ok(out !== null && out !== s, `should rewrite: ${s}`);
  const [, , opts = {}] = TRUTHS.find(([re]) => re.test(s));
  assert.strictEqual(out.includes(MARK), opts.mark !== false, `mark policy: ${out}`);
  assert.strictEqual(truthify(out), null, `output must not re-match: ${s} -> ${out}`);
}

// Surrounding text survives a partial match.
const partial = truthify("Heads up: message limit reached, sorry!");
assert.ok(partial.startsWith("Heads up: ") && partial.endsWith(", sorry!"), "keeps context");

// Captures flow into function replacements.
assert.ok(/September 13/.test(truthify("Your limits are temporarily boosted. Your weekly Claude Code limit is 50% higher through September 13.")));
assert.ok(/\b(85|15)%/.test(truthify("85% used")), "keeps the number");

// Censor mode bleeps without breaking idempotence.
assert.strictEqual(bleep("fucking fucked goddamn bastards"), "f***ing f***ed g*ddamn b*stards");
for (const s of SAMPLES) {
  const out = truthify(s, true);
  assert.ok(!/fuck|goddamn|bastard/i.test(out), `censor leaked: ${out}`);
  assert.strictEqual(truthify(out, true), null, `censored output re-matches: ${out}`);
}

// Non-matches, oversized nodes, and anchored patterns inside prose are left alone.
assert.strictEqual(truthify("Sure, here's the refactored function."), null);
assert.strictEqual(truthify(""), null);
assert.strictEqual(truthify("message limit reached ".repeat(40)), null);
assert.strictEqual(truthify("for complex tasks I usually reach for a debugger"), null);

// Idempotence over the whole table: no string replacement may match any pattern.
for (const [, lines] of TRUTHS)
  for (const l of lines) {
    if (typeof l === "function") continue; // covered by SAMPLES above
    assert.ok(l.trim().length > 3);
    assert.strictEqual(truthify(l), null, `re-matches: ${l}`);
  }

console.log(`ok — ${TRUTHS.length} patterns, ${TRUTHS.reduce((n, [, l]) => n + l.length, 0)} truths`);
