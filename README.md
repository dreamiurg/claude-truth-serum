# Claude Truth Serum

A ~100-line userscript that rewrites Anthropic's canned notices on claude.ai
into what they actually mean.

> Long chats burn quota faster. So do short chats. So does existing.

> The hog is full. The hog sleeps now.

## Install

1. Install [Violentmonkey](https://violentmonkey.github.io/) or Tampermonkey.
2. Open [`claude-truth.user.js`](claude-truth.user.js) raw — the extension offers to install it.
3. Reload claude.ai.

Purely cosmetic: it edits text nodes in your own browser. Nothing is sent anywhere,
no network access, `@grant none`.

## Adding your own

One entry in the `TRUTHS` array in `claude-truth.user.js`:

```js
[/regex matching the canned text/i, ["what it really means", "or this"]],
```

Rule: a replacement must not match its own pattern, or it gets rewritten
again on the next DOM update. `node test.js` enforces this.

## Known limits

- Matches per text node. If React splits a sentence across nodes, it won't match.
- Skips `code`, `pre`, `textarea` and contenteditable so your own chat text is safe,
  but a message containing e.g. "message limit reached" can still get rewritten.
- Anthropic changes copy; patterns will rot. Fix is one line.
