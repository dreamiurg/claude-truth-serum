# Claude Truth Serum

A userscript that replaces Anthropic's carefully worded notices on claude.ai
with what they would say if the copywriter had just seen the usage tab.

**Before:**

> Higher effort means more thorough responses, but takes longer and uses your limits faster.

**After:**

> 🐗 Think harder, pay harder. That's the whole fucking trade.

**Before:**

> 85% used

**After:**

> 🐗 85% gone. It's only fucking Wednesday

## Why

Because "Long chats cause you to reach your usage limits faster" is the most
polite possible way of saying "every message re-reads every previous message
and you are paying for all of it, again, forever."

Because the model picker describes the cheap model as "Most efficient for
everyday tasks" and you will never, ever click it.

Because the effort menu has a little amber badge that says "3.5× or more usage"
and does not say *of what*, and the answer is *your week*.

Because a "temporary 50% boost" is a promo, promos end, and the ending will be
announced as a permanent 25% raise. This is arithmetic, not cynicism.

Because your frontier model of choice is a magnificent, brilliant, genuinely
useful HOG, and will eat through your session limits like a starving husky
destroying a sneaker, and somebody should just say so on the screen where it
happens.

## What it does

- Prefixes every rewrite with 🐗 so you know it was the serum and not a
  sudden outbreak of honesty at Anthropic. Change `MARK` at the top if you
  prefer a different animal.
- Contains profanity. Not a lot. Roughly the amount the situation calls for.
- Rewrites **36 known notices** with a rotating pool of **130 truths**, so the
  wall says something different each time you hit it.
- Covers the composer warnings, the model picker, the effort menu, the
  disclaimer footer, and the entire Settings → Usage page.
- Keeps the numbers. "85% used" becomes "85% gone" plus commentary; the reset
  time, the promo percentage and the promo end date are all preserved and
  merely editorialised.
- Does nothing else. No network access, no storage, `@grant none`. It edits
  text in your own tab. Anthropic's servers are not consulted and would not
  approve.

## Install

1. Install [Violentmonkey](https://violentmonkey.github.io/) or Tampermonkey.
2. Click [**claude-truth.user.js**](https://raw.githubusercontent.com/dreamiurg/claude-truth-serum/main/claude-truth.user.js) — the extension will offer to install it.
3. Reload claude.ai and open Settings → Usage. Feel seen.

## Add your own truth

One line in the `TRUTHS` array:

```js
[/the canned text/i, ["what it actually means", "or this", (m, capture) => `or ${capture}`]],
```

Rules:

- A replacement must not match its own pattern (or any other), or it will be
  rewritten again on the next DOM update, forever. `node test.js` enforces this.
- Anchor short generic strings (`/^\s*More models\s*$/`) so they only match a
  whole UI label and not the middle of your own sentence.
- Captures are passed to function replacements, so numbers and dates survive.

PRs with better truths welcome. PRs with worse truths also welcome; the bar is
"funnier than the original," which is not high.

## Known limits

- Matches per text node, or per element when React splits a notice across
  `<strong>` + text. A notice split across block elements will not match.
- Skips `code`, `pre`, `textarea` and contenteditable so your own typing is
  safe, but a *rendered* message that happens to contain "message limit
  reached" will get the treatment. You can live with it.
- Anthropic changes copy without telling anyone. Patterns will rot. Fixing one
  is one line, which is roughly what they spent writing the original.

## Disclaimer

Not affiliated with Anthropic. Anthropic makes an excellent product. The
product is also a hog. Both things are true, only one made the blog post.
