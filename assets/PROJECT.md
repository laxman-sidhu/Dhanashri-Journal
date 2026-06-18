# Dhanashri's Journal — Project Explainer

A complete description of what this project is, what it does, how it is built, and the
reasoning behind every major decision. Anyone reading this should come away understanding
the whole system.

---

## 1. What it is, in one sentence

Dhanashri's Journal is an aesthetic, scrapbook-style journaling website where one person
privately writes illustrated journal "stories" and everyone else can read them, hosted
entirely on free static hosting (GitHub Pages) with no server and no database software.

It has two faces:

- A **public side** that visitors see: a homepage of story cards, and a reader that opens
  any story and can export it as a PDF. This side is strictly read-only.
- A **private editor** that only the owner uses to create, design, publish, edit, and
  delete stories.

---

## 2. What it does (features)

### For readers (public)
- A homepage showing every published story as a card (cover photo, title, date), centered
  and responsive, two cards per row on phones and more on wider screens.
- Clicking a card opens the full story: a headline (title + date) followed by the journal
  pages exactly as they were designed.
- A "Download PDF" button on each story turns its pages into a multi-page PDF.

### For the editor (private)
- A freeform canvas, like a real scrapbook page, where elements can be placed anywhere.
- **Text** boxes with rich formatting: twenty fonts (the original handwritten, elegant,
  serif and clean web fonts, plus classic system and Adobe families such as Times New Roman,
  Cambria, Book Antiqua, Bookman Old Style, Calibri, Franklin Gothic Book, Microsoft Sans
  Serif, Monotype Corsiva, MV Boli, Chaparral Pro Light, Adobe Arabic and Segoe Fluent
  Icons), size, bold, italic, underline, four alignments including justify, a text colour
  and a separate text-box fill colour, and free rotation (tilt) in fine steps just like
  photos. The font menu previews each name in its own typeface so the right one is easy to pick.
- **Photos**, which can be moved, resized, rotated in fine steps, cropped, and captioned.
- **Stickers**: a built-in emoji library, plus the ability to paste any emoji/symbol, plus
  uploading your own image as a sticker (PNG transparency preserved).
- **Washi tape** strips in several pastel colors.
- **Multiple pages per story**, so a single trip can span several spreads.
- **Page backgrounds**: three plain papers (grid, dots, plain) plus a library of 21 decorative
  scrapbook backgrounds (vintage travel, mountain scrapbook, lakeside and beach scenes, cute
  notepads, gingham, a travel planner template, lined paper, and more), chosen per page from a
  centered picker.
- A **cover photo** picker used for the homepage card.
- **Autosave** of work-in-progress to the browser so nothing is lost on refresh.
- **Save draft** to download the current story as a JSON file at any point without publishing;
  it can be brought back later with **Import JSON** to keep editing.
- **Publish** to put a story live, **Open** to load any published story to edit or extend,
  and **Delete** to remove a story from the site.

---

## 3. The core idea and approach

The single most important constraint shapes everything: **GitHub Pages is static hosting.**
It only serves files; it cannot run code and has no database. So the project answers one
question cleverly: *where does the data live, and how does the editor save it?*

The answer is **the Git repository is the database.** Every story is a small JSON file
committed into the repo. The public pages simply fetch those static JSON files and draw
them. Because reading a static file requires no permissions and there is no write path in
the public pages, "read-only for visitors" is automatic, not a setting that could be
bypassed.

The clever part is publishing. Since there is no server to accept a save, the editor talks
**directly to the GitHub Contents API from the browser**, authenticated with a token. A
single API call writes (commits) a file into the repo. GitHub Pages then rebuilds and the
new content appears on the site within about a minute. No backend, no build pipeline, no
hosting bill.

---

## 4. How publishing actually works (the data flow)

When the editor presses **Publish**:

1. The story (text, layout, and compressed photos, all in memory as a JSON object) is
   serialized.
2. The editor makes an HTTPS `PUT` to
   `https://api.github.com/repos/laxman-sidhu/Dhanashri-Journal/contents/data/posts/<id>.json`
   with the JSON base64-encoded in the body. That call *is* a commit; GitHub writes the file.
3. A second call reads `data/index.json`, adds or updates this story's entry (id, title,
   date, thumbnail), and `PUT`s it back. This is the list the homepage reads.
4. GitHub Pages rebuilds; the card and story go live in roughly a minute.

Editing an existing story does the same `PUT` but includes the file's current `sha` so
GitHub knows it is an update, not a new file. Deleting a story sends a `DELETE` for its
post file and removes its entry from `index.json`.

---

## 5. File structure

```
Dhanashri-Journal/
  index.html          Public homepage (card grid)
  story.html          Public single-story reader + PDF export
  admin.html          Private editor + publishing logic
  assets/
    style.css         All shared styling (the lavender theme, layout, responsiveness)
    core.js           Shared config, fonts, background registry, image compression, renderer
    backgrounds/
      bg01.jpg ...     The decorative page-background images (compressed, lazy-loaded)
  data/
    index.json        Array listing every story (id, title, date, thumbnail)
    posts/
      <id>.json        One self-contained file per story
  README.md           Setup instructions
  PROJECT.md          This document
```

The three HTML pages are deliberately separate and each self-contained in behavior, but they
share one stylesheet and one core script so the public and private sides always look
identical and never drift apart.

---

## 6. The data model

**`data/index.json`** is an array of lightweight entries, one per story:

```json
[
  { "id": "phu-quoc", "title": "Phu Quoc", "date": "2026-05-12", "thumb": "data:image/jpeg;base64,..." }
]
```

The thumbnail is a small embedded image so the homepage can render the whole grid quickly
without downloading every full story.

**`data/posts/<id>.json`** is one complete story:

```json
{
  "id": "phu-quoc",
  "title": "Phu Quoc",
  "date": "2026-05-12",
  "pages": [
    { "paper": "grid", "elements": [ ... ] }
  ]
}
```

Each entry in `elements` is one placed item. Every element has a position (`x`, `y`) in a
fixed 760-pixel-wide design space, and type-specific fields:

- `text` — `content`, `font`, `size`, `bold`, `italic`, `underline`, `align` (left, center,
  right or justify), `color`, `fill` (text-box background colour, empty for none), `w`, `rot`
- `photo` — `src` (embedded compressed JPEG), `caption`, `w`, `rot`
- `sticker` — `emoji`, `size`, `rot`
- `imgsticker` — `src` (embedded PNG), `w`, `rot`
- `washi` — `color`, `w`, `rot`

A page's `paper` is either a built-in style (`grid`, `dot`, `plain`) or the key of a
decorative background (for example `bg04`). Only the short key is stored; the matching
image is fetched once from `assets/backgrounds/` and cached, so the story file itself stays
tiny.

Photos and stickers are stored **inline as data URLs**, so one story file is fully
self-contained: there are no separate image files to track, and publishing or deleting a
story is a single file operation. Decorative page backgrounds are the deliberate exception:
they are shared, reusable site assets, so they live as files and are referenced by key.

---

## 7. How each part works

**`assets/core.js`** is the shared brain. It holds the GitHub username/repo config, the font
list (web fonts plus the named system/Adobe families), the registry of decorative page
backgrounds (key, label, file path and a tiny inline preview), small helpers (id generation,
date formatting, slugifying titles), the image compressor (resizes and re-encodes uploads so
files stay small), the function that applies text styling (font, size, weight, alignment,
colour and fill), the function that applies a page's background, the element rotation helper,
the read-only element renderer, the read-only page renderer, and UTF-8-safe base64
encode/decode used for the GitHub API.

**`index.html`** fetches `data/index.json`, sorts by date, and renders a card per story. Pure
read-only; it has no concept of saving.

**`story.html`** reads the `?id=` from the URL, fetches that one post file, draws a headline
then each page read-only, and offers the PDF export. The PDF libraries (html2canvas and
jsPDF) are loaded from a CDN **only when the button is clicked**, so the page itself stays
fast. To export, it renders each page to a high-resolution image and assembles them into a
multi-page PDF.

**`admin.html`** is the editor. It manages a story object in memory, renders the current page
as an interactive canvas, and wires up dragging, resizing, rotating, cropping, the rich-text
toolbar, the sticker sheet, the cover picker, paper styles, and multi-page tabs. It autosaves
a draft to the browser. It also contains the GitHub API layer (get/put/delete) used by
Publish, Open, and Delete.

**`assets/style.css`** defines the lavender pastel theme as CSS variables and all layout,
including the responsive homepage grid and the read-only page styling. The editor adds its
own extra styles inline for the editing controls.

---

## 8. Key technical decisions and why

**No backend.** The whole point was zero cost and zero maintenance. Static files plus the
GitHub API achieve a full publish-and-read workflow with nothing to run or pay for.

**Repo-as-database.** Stories as committed JSON give free hosting, free version history, and
inherent read-only safety for the public, since visitors only ever fetch static files.

**Images embedded in JSON.** Keeping photos as compressed data URLs makes each story one
self-contained file. The alternative (separate image files) means juggling paths and extra
commits. Uploads are shrunk on import (about 1100px wide, JPEG) to keep files reasonable.

**Backgrounds as shared files, referenced by key.** Decorative page backgrounds are the one
deliberate exception to the embed-everything rule. A full-page background reused across many
pages would bloat every story file if embedded, so instead each background is compressed once
into `assets/backgrounds/`, and a page stores only a short key like `bg04`. The browser fetches
each background at most once and caches it, and only when a page actually uses it, which keeps
both the story files and the initial page load light. A tiny inline thumbnail of each
background is kept in `core.js` purely so the editor's picker can show previews instantly with
no extra requests.

**Fonts named, not bundled.** The original handwritten and display fonts are free web fonts
loaded from Google Fonts. The added classic families (Times New Roman, Cambria, Book Antiqua,
Bookman Old Style, Calibri, Franklin Gothic Book, Microsoft Sans Serif, Monotype Corsiva, MV
Boli, Chaparral Pro Light, Adobe Arabic, Segoe Fluent Icons) are proprietary system and Adobe
fonts, so they are referenced by name with a sensible fallback rather than shipped as files.
On a device that has a given font installed it renders exactly; otherwise it falls back to the
generic family. This keeps the site fast and avoids bundling licensed font files.

**Token stored only in the browser.** The publishing key is a GitHub fine-grained token,
scoped to this one repo with Contents read/write. It is typed into the editor once and saved
in that browser's local storage; it is never written into any deployed file. So even though
`admin.html` is publicly reachable, opening it gives only the editor shell, and no one can
publish without their own valid token. If a token ever leaks, it is revoked and reissued in
seconds.

**Fixed design width, scaled to fit.** Pages are authored in a fixed 760px coordinate space
and scaled to the screen with a CSS transform. This keeps element positions stable across
devices. A wrapper "holder" reserves only the *scaled* size and clips overflow, which is what
prevents pages from spilling off the right edge on mobile.

**Touch handling.** On the reader, pages scroll normally. In the editor, individual elements
capture touch so they can be dragged, while empty canvas areas allow vertical panning, so the
editor both edits and scrolls correctly on a phone.

**Lazy-loaded PDF.** Heavy export libraries load on demand so they never slow the normal
reading experience.

**One stylesheet, one core script.** Shared assets keep the public and private sides visually
consistent and reduce duplicated logic.

---

## 9. Setup and hosting (recap)

1. Create a public repo named exactly `Dhanashri-Journal` and upload these files keeping the
   folder structure.
2. In repo Settings, enable Pages from the `main` branch, root folder.
3. Create a GitHub fine-grained personal access token scoped to only this repo, with
   permission **Contents: Read and write**.
4. Open the live editor, open settings, paste the token, save. Then write and publish.

Live URLs:
- Homepage: `https://laxman-sidhu.github.io/Dhanashri-Journal/`
- Editor: `https://laxman-sidhu.github.io/Dhanashri-Journal/admin.html`

To move the project to a different account or repo name, change the two values at the top of
`assets/core.js`.

---

## 10. Security model in short

The public pages can only read. The ability to change anything lives entirely with whoever
holds the token, which exists only in the editor's own browser. The repo being public exposes
the code, not the control: the code contains no secret. This is the standard and safe way to
do client-side publishing to a static host.

---

## 11. Known limitations and natural next steps

- Text styling is per text box rather than per word; the scrapbook approach is to use several
  boxes, which is also how the look is normally achieved.
- The classic system and Adobe fonts render as the exact named font only on devices that have
  it installed (for example, most Windows machines have Calibri, Cambria, Times New Roman and
  MV Boli); on other devices that text falls back to a similar generic family. The owner's own
  machine is what matters for authoring, so this is rarely noticeable in practice.
- A GitHub free-plan Pages repo is public, so the editor URL is reachable; security comes from
  the token, not URL secrecy.
- Publishing assumes a single editor; there is no multi-user conflict handling.
- If the journal grows very large, embedded images make `index.json` and the repo heavier; at
  that scale, moving images to a dedicated store or moving the whole data layer to a service
  like Supabase or Firebase would be the upgrade path, while still hosting the site statically.
