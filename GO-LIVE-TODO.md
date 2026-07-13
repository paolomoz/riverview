# Riverview EDS — pre-go-live checklist (open items)

Live preview: https://main--riverview--paolomoz.aem.live/  ·  ~1,509 pages deployed.

## BLOCKED NOW — DA_TOKEN expired mid-run
- `DA_TOKEN` in `.env` expired (dev tokens ~24h). **Refresh it, then re-run:**
  `DA_TOKEN=… node skills/deploy/scripts/deploy-batch.mjs --org paolomoz --repo riverview --branch main --content content`
  The ledger skips everything already live and drives only the **3 remaining es hub pages**
  (`/es/centros-de-salud`, `/es/colecciones-sobre-salud`, `/es/herramientas`). Their Spanish
  chrome + `/es/` routing is already deployed as code.

## Tracked decisions (per Paolo, this run)
1. **Fonts — self-host Parabolica (confirmed keep).** ⚠️ Still verify the Adobe Fonts/Typekit
   web-embedding license before production `aem.live`. Fallback path in `styles/fonts/LICENSING.md`.
2. **Webforms — render-only for now (confirmed).** TODO before go-live: wire contact /
   request-appointment / patient-story forms to a submit backend + antibot (AEM Forms, an embedded
   service, or a retained endpoint). Currently non-submitting.
4. **Production domain + go-live — later.** Point DNS/host at the production domain; update the
   sitemap/canonical/og:url base from the `aem.live` preview host to the production origin.
5. **Accreditor mark licenses — deferred.** Confirm before production (deploy-gate item).

## Dynamic-data note (Paolo Q3)
Dynamic search runs off static sheet indexes served at the site root:
`/provider-index.json` (580), `/location-index.json` (417), `/content-index.json` (226) —
DA source `da.live/#/paolomoz/riverview`. Consumed by `/providers`, `/locations`, `/blog`,
`/search-results`. Built from an `hgwf-api` snapshot; per plan decision #1 they'll be replaced by
the Cactus re-index/search service — until then, refresh via `stardust/scripts/fetch-data.mjs` +
the index build step.

## Residual polish (non-blocking)
- Article body: one heading-level skip from syndicated markup — normalize at render.
- Home / provider-list: a few borderline <44px chrome/pager tap targets — pad.
