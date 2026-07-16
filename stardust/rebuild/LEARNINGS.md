# Header-page rebuild — content-translation learnings (2026-07-15)

Working notes for fixing migrated pages with inaccurate content/design, to be
executed at scale on the rest of the site. Exemplar: `/schedule-appointment`
(0% heading fidelity → 100%).

## Root cause of the inaccurate migrations

1. **API `body` is NOT the page.** The Phase-2 fan-out rendered static/composed
   pages from the Drupal JSON-API record's `body` field. Pages composed with
   Layout Builder (option cards, wayfinding hubs, callouts, media splits) keep
   almost nothing in `body`: `/schedule-appointment` lost all 6 section
   headings, 10 of 11 links, both images — and even used the meta title
   ("Schedule Appointment") instead of the on-page h1 ("Schedule an
   Appointment").
2. **The flat scrape (enrich) also loses composition.** scrape.mjs emits a flat
   node stream: card boundaries, icon↔card pairing, and text↔href pairing are
   gone (links become bare text like "Find a Provider →").
3. **The extract-phase crawl captures were right all along** —
   `stardust/current/pages/<slug>.json` has full body+headings+ctas+media — but
   the fan-out didn't consume them, and their `links[]` are unpaired bare URLs.

## The fix: structured region harvest

`skills/enrich/scripts/harvest.mjs <url> <slug>` walks the LIVE page `<main>`
and emits a **region tree**: one region per heading, each with its own
`paras[]`, `links[]` (text+href pairs), `items[]`, `imgs[]`. This preserves the
composed layout the other sources lose. Output: `stardust/harvest/<slug>.json`.

Harvester gotchas learned on schedule-appointment:
- **Icon anchors precede their card's h2** in DOM order → a glyph link
  (`calendar_today`, `call`…) at the end of region N belongs to card N+1.
- Material icon glyph names appear as link text — filter them out of CTAs
  (real CTA text matches `→|log in|book|find|request|schedule`).
- h6 regions are usually sub-lines of the preceding h2 (hours, phone lines) —
  fold them into the parent section; phone numbers become `tel:` links.
- Titles: use the on-page `h1` for the page h1; the `<title>` tag only for
  metadata.

## Region → EDS block mapping (per approved archetypes)

| Region shape | Block |
|---|---|
| run of ≥2 same-level headings each w/ ≤2 paras + a CTA link | `cards` (hub option cards, h3+p+a rows) |
| region w/ image + paras + CTAs | `split` (img row + copy row) |
| h6 phone/hours lines | fold into `service-body` prose w/ `tel:` links |
| short noun-phrase label lists | `svc-cards` / `pills` (per enrich rules) |
| everything else (prose, Q&A, bullet criteria) | `service-body` article (h2+p+`<ul>`) |
| trailing schedule/CTA region | `cta-band` |

## Deploy notes

- Deploy the page at the EXACT original path (deploy-batch webPath = content
  file path); verify live with a heading-set diff against the original page,
  not just HTTP 200.
- DA strips `<address>`/`<span>` — only strong/em/a/picture/br survive (block
  contracts must not depend on stripped tags).
- Header "Donate" links to `/donate/riverview-health-foundation` on the live
  site — our deploy had nothing there (404) and our header fragment pointed to
  `/donate`. Deploy the page at the live path.

## Fidelity audit method (repeatable, for scale)

Headless compare original vs deployed per URL: heading-set match %, word count,
link count, image count (`/tmp/header-audit.txt` runner). Pages <80% heading
match or losing >30% of words/links get rebuilt via harvest → convert → deploy.

## Status table (header set)

See `stardust/rebuild/status.json` — maintained by the batch runner.

## Re-audit results (2026-07-15, post-rebuild)

22/22 pages ≥75% heading fidelity (was 0–50%); 18/22 also ≥70% word retention.
Residual WARNs (word count 63–69%, headings 100%): /preparing-your-visit-0,
/services/specialty-care, /services/womens-health,
/services/gastroenterology-services — likely collapsed accordion/tab content the
harvester reads but the original counts differently; refine per-page.
Sidebar-nav links moved to the rail only render when a service-body block is
emitted (split-only pages like /history-0 drop them — global nav covers it).

## Converter fixes learned on the batch (in harvest-convert.mjs)

- Sidebar "In this section" nav leaks into the h1 region's items — detect via a
  SELF-LINK in the items set, route to the service-body rail (row 0).
- Never re-emit the h1 region's heading (duplicate h1→h2 on one-region pages).
- Bio runs (≥3 same-level headings, link/img-free, first para ≤8 words = role
  line) → cards grid (leadership).
- Label branch must emit ALL region paras, not just the first.

## Full prototype pass (2026-07-15, per-page stardust:prototype for all 22)

- Every page now has `stardust/prototypes/<slug>-proposed.html` + `<slug>-shape.md`
  (22/22 gate-clean: h1×1, no overflow 1440/360, 0 errors). Builder:
  `/tmp/proto-build.mjs` pattern — region tree → ds-* sections on the approved
  chrome (hub-cards / bio-cards / splits alternating paper–mint / label
  cards / pills / FAQ details / rail article).
- David's Model in EDS migrate: FAQ runs (≥4 `?`-headings) → new `accordion`
  block, ONE ROW PER Q/A (question cell + answer cell), native details/summary;
  section heads as default content; semantic inline tags only.
- Rail-only fallback: pages whose content is all cards/labels (no service-body)
  must still emit a rail-carrying service-body or the captured section-nav
  links are silently dropped (specialty-care).
- Word-count audits must run AFTER decoration (networkidle, not
  domcontentloaded+sleep) — svc-card labels are spans, invisible to p/li text
  probes; blocks decorate async.

## Wave-3 learnings (services hubs, parallel agents, 2026-07-16)

- **"Status message" resolved**: the Drupal webform message wrapper's VISIBLE
  content is real (the minors notice); only its sr-only system label is junk.
  Don't blanket-exclude — probe the wrapper's visible text.
- Harvest word-loss on service hubs = lazy "Meet our people" grids + entire
  webforms; recover from capture media/ctas + a targeted form probe (fields,
  select options, required flags).
- Agents correctly overrode wrong prompt hints after LOOK (specialty-care: 29
  "cards" were really 14 nav links + 15 labels) — the screenshot stays
  authoritative over any pre-analysis.
- No hero CTA invention on clinical pages (ER: no Schedule button — judgment
  codified: canonical CTAs only where the archetype family carries them).

## Leadership gen-3 correction (2026-07-16)

- The canary agent's bio-CARD treatment passed all COUNT gates while missing the
  source's LAYOUT treatment (full-width profile rows w/ portraits + mint
  plinth). **Counts verify structure, not treatment** — central verification
  must include a screenshot-vs-render treatment diff for layout-bearing
  sections (profile rows vs cards vs list), not only numbers.
- Lazy-loaded portraits need the full-scroll extract (5/5 in capture media);
  name→file matching must strip credential suffixes (MD/DO/PA/NP).

## 1-by-1 treatment pass results (2026-07-16)

- awards: treatment correct (prose article); DA strips aria-* in content →
  service-body now sets rail aria-current at DECORATE time by URL match.
- community-benefit: REBUILT — the source shows programs/CHNA/partners as
  plain BULLET LISTS; the label-cards rule over-styled them (39 cards → 3
  <ul>s). Rule refined: label-set → cards/pills applies to SERVICE offering
  lists; on about/editorial pages the screenshot's own treatment wins.
- suburban: verified correct as-is.
- wellness-coalition: two variants added for parity — `split plain`
  (white certificate split; base split is mint) and `callout mint`
  (centered mint tile, N body rows). Lesson: never regex-inject block markup
  into content files — unbalanced divs make DA silently flatten the block;
  rebuild the section with the block builder.
