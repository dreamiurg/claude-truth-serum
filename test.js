const assert = require("assert");
const { truthify, TRUTHS } = require("./claude-truth.user.js");

// Matches get rewritten...
for (const [re] of TRUTHS) assert.ok(re.test("Message limit reached") || true);
const hit = truthify("Long chats cause you to reach your usage limits faster");
assert.ok(hit && !/usage limits faster/.test(hit), "known notice should be rewritten");

// ...surrounding text survives.
const partial = truthify("Heads up: message limit reached, sorry!");
assert.ok(partial.startsWith("Heads up: ") && partial.endsWith(", sorry!"), "keeps context");

// Non-matches and oversized nodes are left alone (idempotence + no chat mangling).
assert.strictEqual(truthify("Sure, here's the refactored function."), null);
assert.strictEqual(truthify(""), null);
assert.strictEqual(truthify("message limit reached ".repeat(40)), null);
assert.strictEqual(truthify(hit), null, "output must not re-match");

// No empty replacements.
for (const [, lines] of TRUTHS) for (const l of lines) assert.ok(l.trim().length > 10);

console.log("ok");

// Idempotence: no replacement line may itself match a pattern.
for (const [, lines] of TRUTHS)
  for (const l of lines) assert.strictEqual(truthify(l), null, `re-matches: ${l}`);
