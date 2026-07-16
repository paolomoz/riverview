# TRAIN, THEN COMPILE — scaling high-fidelity migration to any site

How we went from hand-crafting pages to compiling them: LLM reasoning on a
representative set (TRAIN) until the decisions stop being novel, then codify
those decisions into deterministic scripts (COMPILE) and keep the LLM only as
the exception handler. Proven on riverview.org: 22 trained pages → a compiler
that did the next 10 pages with **zero LLM tokens, 10/10 pass**.

## Phase 1 — TRAIN (LLM-crafted, ~20 pages)

Run the full per-page discipline (PROCESS.md steps 1–12) on a representative
sample: every distinct page family, the flagship pages, the weird ones.
Serial first (to define the process), then parallel agents with central
verification (to build volume). The outputs that matter beyond the pages:

1. **A closed treatment vocabulary** — every composition the design system
   needs (hero±photo, rail article, label cards, pills, tabs, accordion,
   bio/people/story cards, splits ±blue/mint, forms, callouts). New treatments
   stop appearing after ~15 pages; that's the signal training is done.
2. **A classification rulebook** — every judgment the LLM repeated becomes a
   rule (LEARNINGS.md): label-set thresholds, address-shape splits, junk
   patterns, hero false-positive patterns, no-invented-CTA, tel:/staging-URL
   rewrites, DA encode contract (what tags survive).
3. **A gate suite** — asserted numbers, not opinions: h1×1, overflow=0,
   errors=0, structural counts, invented-copy scan (every text node must exist
   in the source corpus).

## Phase 2 — the pivot: read the source's own grammar

The train phase reconstructs composition from flattened text. The pivot
insight: **the source DOM declares its composition** — CMS themes wrap every
region and component in named containers. Probe 2–3 pages and write the
**site adapter** (a ~20-line selector map). For riverview (Drupal "hgm"
theme):

| Component | Selector |
|---|---|
| hero (+bg photo) | `section.hgm-marquee-two-column` / `__bg` |
| sidebar (nav + info) | `.hgm-sidebar` → `.field-hgm-menu-component`, `.field.body` |
| body flow | `.hgm-body-region` children, in order |
| titled video | `.hgm-video` + nearby h5 |
| webform | `form[id*=webform]` |
| provider grid | h6 name + img + `/provider/` link cluster |

Because sidebar and body are **separate containers**, the whole class of
text-walk ordering bugs (the "DOM-order trap") disappears at the root.

## Phase 3 — COMPILE (zero LLM tokens per page)

- `harvest2.mjs` — site adapter → **typed component tree** per page
  (hero{bg,h1,lede,ctas}, sidebar{nav,info}, ordered body nodes: h/p/list/
  video/img/form/people).
- `compile.mjs` — typed tree → EDS content (David's Model) via the Phase-1
  rulebook, PLUS a **gate manifest** (expected structural counts derived from
  the source itself). **Unmapped node type → exit 2 → the page falls back to
  the agent path.** Fail loud, never guess.
- deploy-batch → live verify: manifest counts asserted on the rendered page,
  fidelity diff vs the original.

## Phase 4 — LLM as exception handler only

Pages that (a) hit an unmapped component, (b) fail a gate, or (c) belong to a
flagship family worth hand-craft get the full PROCESS.md agent treatment —
the same parallel-agents + central-verification harness from training.

## Measured economics (riverview)

| Path | LLM tokens/page | Wall clock/page |
|---|---|---|
| TRAIN (serial craft) | 55–185k | 15–25 min |
| TRAIN (parallel agents + central verify) | same tokens, ~4× throughput | ~5 min amortized |
| COMPILE | **~0** (+ ~2k central verification) | ~1 min |

Tier-2 sample: 10/10 compiled, 0 junk; live fidelity gate: 9/10 >=90% heading match (maternity fixed a multi-marquee h1 bug), 1/10 (breast-care, a second sidebar block type) correctly fell to the agent path — the projected ~90/10 split. RULE: the wave runner MUST run the source-heading fidelity diff as an auto-gate; the compile manifest alone is self-consistency, not fidelity (spans/staging URLs/blocked
widgets all filtered by rulebook patterns).

## Porting to a new site — the checklist

1. stardust extract → audit → direct → prototype the archetypes (unchanged).
2. TRAIN on ~15–25 representative pages via PROCESS.md; keep LEARNINGS.md.
3. Probe the CMS theme; write the **site adapter** for harvest2 (the only
   file that changes per site).
4. Re-derive the treatment vocabulary/block set from that site's approved
   prototypes; update compile.mjs's mapping table.
5. Compile everything; agent-path the fallback tail; live-verify all.
6. The two non-negotiables at any scale (from PROCESS.md): never compose
   without the screenshot **during training**; never ship without the live
   fidelity diff **ever**.
