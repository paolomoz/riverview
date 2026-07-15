# THE PROCESS — high-fidelity page rebuild, drift-proof

Exemplar: `/services/orthopedic-services` (2026-07-15). Every step below is
mandatory and ordered. A page that skips a step is not done. Nothing else is
part of the process.

## Inputs (all four, no substitutions)

| # | Artifact | Produced by | What ONLY it has |
|---|---|---|---|
| 1 | `stardust/current/pages/<slug>.json` + screenshot | `node stardust/scripts/crawl.mjs --url <origin> --pages <path> --out stardust/current` | full-scroll capture (lazy content: people grids), **screenshot**, visibility-filtered headings, media |
| 2 | `stardust/harvest/<slug>.json` | `node skills/enrich/scripts/harvest.mjs <url> <slug>` | region tree: **text↔href-paired links** per heading |
| 3 | Targeted DOM probes | playwright eval per composed component | pairings neither source has (name↔specialty↔photo↔href; rail nav hrefs) |
| 4 | Approved design system | chrome + ds-* CSS of the latest APPROVED prototype | tokens, header/footer canon, section vocabulary |

## Steps (per page)

1. **EXTRACT.** Run crawl.mjs for the page. HARD GATE: capture file + screenshot
   exist. If a page has no capture, STOP — do not substitute harvest alone
   (that produced the bad gen-1 prototype: Drupal "Status message" as h2, rail
   address in prose, wrong phone).
2. **LOOK.** Read the screenshot. Write down the section list you SEE, top to
   bottom, with treatment names (photo hero / rail / form / callout / split /
   people grid). This is the composition spec. No screenshot read → no craft.
3. **HARVEST.** Run harvest.mjs (text↔href pairing). Diff its headings against
   the capture's headings — anything the harvest missed (lazy grids) or
   invented (system divs) goes on the probe list.
4. **PROBE.** One targeted playwright eval per composed component the two
   sources can't pair (people cards, tabbed content, accordions' open state).
   Never guess pairings; never invent hrefs.
5. **BRIEF.** Author `<slug>-shape.md`: the seen section list, each with
   captured-source lineage + block treatment + voice classification. Named
   omissions go in unsourcedContent (e.g. "webform option list — bound at
   launch"). Placeholder junk on the source (lorem ipsum) is EXCLUDED and noted.
6. **CRAFT.** Assemble `<slug>-proposed.html`: chrome verbatim from the approved
   sibling; `<main>` hand-composed per the brief. Rules:
   - ALL captured content, verbatim, in source order (full-content rule).
   - Section treatments from the approved vocabulary only (hero, rail article,
     hub/bio/people cards, svc-cards, pills, split, appointment form + ribbon,
     mint/grey bands, cta-band). New treatment → add CSS before
     `/* ---- responsive ---- */`, document it in the brief.
   - Phones → tel: links with THIS page's numbers (never the site default).
   - **DOM-order trap (always check):** sidebar regions ("For More Information")
     greedily capture the following MAIN prose in the harvest walker. Split by
     address shape: ≤16 words AND matching street/zip/phone → rail address;
     everything else is main prose, rendered in main, in order. Never group
     address blocks by fixed stride.
   - Forms → labeled, non-submitting, + "connects at launch" ribbon.
   - No invented copy, no invented CTAs, no duplicate of the page's own CTAs.
7. **GATE (render).** file:// at 1440 AND 360: h1=1, no overflow, 0 pageerrors,
   plus per-page structural counts asserted from the brief (pills=N, people=N,
   form-fields=N, rail present) AND: no rail/address element contains >20 words
   (prose-in-rail = automatic fail; the ortho exemplar caught this in review).
8. **GATE (fidelity).** Every capture heading present; every harvest region
   accounted for (rendered or named in unsourcedContent). Fail → fix, re-gate.
9. **REVIEW.** Open the file + the live original side by side. User approves →
   state.json `prototyped`→`approved`.
10. **MIGRATE.** Convert the approved prototype to an EDS content page per
    David's Model: one row per item; section heads as default content;
    semantic inline tags ONLY (strong/em/a/br survive DA — address/span do
    not); FAQ runs → accordion rows (q cell + a cell).
11. **DEPLOY.** deploy-batch at the exact original path → live.
12. **VERIFY.** Headless on the LIVE page (networkidle, post-decoration):
    heading-set match ≥90% vs original, structural counts from step 7, zero
    about:error/JS errors. Record in `stardust/rebuild/status.json`.

## Drift guards (why 20× stays identical)

- Steps 1–4 are scripts; step 7/8/12 are asserted numbers, not judgment.
- Step 2 and 5 are the ONLY judgment steps, and each produces a written
  artifact (section list, brief) that review checks against the screenshot.
- The treatment vocabulary is CLOSED (the approved set). A page needing a new
  treatment adds it explicitly via brief + CSS + user approval — never ad hoc.
- One page = one commit, message names the page and its section list.

## Scaling to 1000× (other use cases)

The process is source-agnostic: EXTRACT (full-render capture + screenshot) →
LOOK (write the seen composition) → HARVEST (paired text/links) → PROBE (what
pairing is still missing) → BRIEF → CRAFT from a closed treatment vocabulary →
double GATE (render + fidelity vs capture) → REVIEW → MIGRATE (platform
encode contract) → DEPLOY → VERIFY live against the original. Per new site:
re-derive the design system + treatment vocabulary from its approved
prototypes; everything else is unchanged. The two non-negotiables at any
scale: **never compose without the screenshot; never ship without the live
fidelity diff.**
