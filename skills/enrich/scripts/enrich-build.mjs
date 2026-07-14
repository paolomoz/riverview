// enrich-build.mjs — shape-aware deterministic builder: scrape node stream → gold
// archetype blocks per stardust/enrich/GRAMMAR.md and the four approved prototypes
// (service-hub, service-lander conversion/narrative, audience-hub). Segments by heading
// boundaries and classifies each region against the archetype block grammar:
//   symptom/condition lists → pills · service/procedure/allergen lists → svc-cards
//   ≥3 titled prose sub-sections → topic-panels · patient-story → story-band
//   appointment-request → appointment · CTA → cta-band · lead prose → service-body
// Not a per-page LLM builder — a grammar-encoded segmenter. Gate-filtered downstream.
import { load, esc, rel, attr, block, section, metadata, doc, ul, linkify } from './util.mjs';

const CTA_RE = /schedule|appointment|make (a|your) (gift|appointment)|donate|ready to|contact us|get started|request an? /i;
const RAIL_RE = /^in this section$/i;
// condition / symptom lists render as pill clusters (short medical labels)
const PILLS_RE = /symptom|sign|condition|we treat|disorders?|allergies you|allergens?/i;
// but "Common Allergens" / "Services" / "Procedures" render as mint-diamond service cards
const SVC_RE = /allergen|service|procedure|treatment|screening|program|specialt|offer|test/i;
// a patient-story region ("In Jason's Words", "Story of Recovery", "Patient Story")
const STORY_RE = /\bin .{1,24}\bwords\b|story of|patient story|\bwords\b$|hear from|in .{1,20}'s words/i;
// an appointment-request lead panel (conversion landers)
const APPT_RE = /appointment request|request an appointment|new patient appointment|your information/i;

const isHeading = (n) => n && n.t === 'heading';
const words = (t) => (t || '').split(/\s+/).filter(Boolean).length;
const itemsOf = (lists) => {
  const out = [];
  for (const l of lists) for (const it of (l.items || [])) out.push(typeof it === 'string' ? { text: it } : it);
  return out;
};
// A "label set" = short noun-phrase labels (services, conditions, procedures), the
// only lists that become svc-cards / pills. Everything else (sentence-fragment
// bullet lists, criteria, steps) stays a real <ul>. A per-item link is fine (the
// label links to its sub-page); a trailing period or >6 words means it's a clause,
// not a label; a per-item description means it's a rich card.
const isLabelSet = (items) => items.length >= 3
  && items.every((it) => !it.desc && words(it.text) <= 6 && !/[.:;]\s*$/.test((it.text || '').trim()));
const label = (it) => (it.href ? `<a href="${attr(rel(it.href))}">${esc(it.text)}</a>` : esc(it.text));
const liOf = (it) => `<li>${typeof it === 'string' ? esc(it) : label(it)}</li>`;
// render a region body to prose HTML in source order: paragraphs, bullet lists, quotes
const bodyToHtml = (body) => body.map((x) => {
  if (x.t === 'p' && !RAIL_RE.test(x.text)) return `<p>${linkify(x)}</p>`;
  if (x.t === 'list') return `<ul>${(x.items || []).map(liOf).join('')}</ul>`;
  if (x.t === 'blockquote') return `<blockquote>${esc(x.text)}</blockquote>`;
  return '';
}).join('');

function heroCtaHref(nodes) {
  for (const n of nodes) {
    for (const l of (n.links || [])) if (CTA_RE.test(l.text)) return { text: l.text, href: l.href };
  }
  return { text: 'Schedule an Appointment', href: '/schedule-appointment' };
}

/** classify a region (nodes after its heading) → a block section, or a prose buffer entry */
function regionSection(headNode, body) {
  const htext = headNode ? headNode.text : '';
  const lists = body.filter((n) => n.t === 'list');
  const paras = body.filter((n) => n.t === 'p' && !RAIL_RE.test(n.text));
  const introP = paras.length ? `<p>${esc(paras[0].text)}</p>` : '';

  // appointment-request lead panel → appointment block
  if (headNode && APPT_RE.test(htext)) {
    return {
      type: 'appointment',
      html: section(block('appointment', [
        [`<h2>${esc(htext)}</h2>`],
        ...paras.slice(0, 3).map((p) => [`<p>${esc(p.text)}</p>`]),
      ])),
    };
  }

  // patient-story region → navy story-band (needs a heading + prose + optional link)
  if (headNode && STORY_RE.test(htext)) {
    const quote = paras.find((p) => words(p.text) > 4);
    let link = null;
    for (const p of body) for (const l of (p.links || [])) if (!link) link = l;
    const rows = [[`<h2>${esc(htext)}</h2>`]];
    if (quote) rows.push([`<blockquote>${esc(quote.text)}</blockquote>`]);
    if (link) rows.push([`<a href="${attr(rel(link.href))}">${esc(link.text || 'Read the story')}</a>`]);
    if (rows.length >= 2) return { type: 'story-band', html: section(block('story-band', rows)) };
  }

  // CTA region → cta-band
  if (headNode && CTA_RE.test(htext) && paras.length <= 3 && lists.length === 0) {
    const cta = heroCtaHref(body.length ? body : [headNode]);
    return {
      type: 'cta-band',
      html: section(block('cta-band', [
        [`<h2>${esc(htext)}</h2>`],
        ...(paras.length ? [[paras.map((p) => `<p>${esc(p.text)}</p>`).join('')]] : []),
        [`<p><strong><a href="${attr(rel(cta.href))}">${esc(cta.text)}</a></strong></p>`],
      ])),
    };
  }

  // list region → pills (symptom/condition labels) · svc-cards (service/procedure
  // labels) · cards (described items). A plain sentence-fragment bullet list is NOT
  // any of these — it falls through to prose and renders as a real <ul>.
  const items = itemsOf(lists);
  if (items.length >= 3) {
    const head = headNode ? `<h2>${esc(htext)}</h2>` : '';
    // symptom/condition short-label sets → pill cluster
    if (isLabelSet(items) && PILLS_RE.test(htext) && !SVC_RE.test(htext)) {
      return { type: 'pills', html: section(head, introP, block('pills', items.map((it) => [label(it)]))) };
    }
    // service/procedure/allergen short-label sets → mint-diamond service cards
    if (isLabelSet(items)) {
      return { type: 'svc-cards', html: section(head, introP, block('svc-cards', items.map((it) => [label(it)]))) };
    }
    // items carrying their own description → rich title+desc cards
    if (items.some((it) => it.desc)) {
      const cards = items.map((it) => [`<h3>${it.href ? `<a href="${attr(rel(it.href))}">${esc(it.text)}</a>` : esc(it.text)}</h3>`
        + (it.desc ? `<p>${esc(it.desc)}</p>` : '')]);
      return { type: 'cards', html: section(head, block('cards', cards)) };
    }
    // else: a prose bullet list → fall through to prose (rendered as <ul> below)
  }

  // "name  description" paragraph clusters (≥3 with a leading link) → cards
  const linked = paras.filter((p) => p.links && p.links.length && p.links[0].text && p.text.startsWith(p.links[0].text));
  if (linked.length >= 3) {
    const cards = linked.map((p) => {
      const name = p.links[0].text; const desc = p.text.replace(name, '').trim();
      return [`<h3><a href="${attr(rel(p.links[0].href))}">${esc(name)}</a></h3>${desc ? `<p>${esc(desc)}</p>` : ''}`];
    });
    return { type: 'cards', html: section(headNode ? `<h2>${esc(htext)}</h2>` : '', block('cards', cards)) };
  }

  // else prose → buffer (head + body html: paragraphs + bullet lists) for flush.
  // Track list-presence + word count so the flush can tell parallel narrative
  // (→ topic-panels) from a sequential article with bullet lists (→ one article).
  return {
    type: 'prose',
    head: headNode ? htext : '',
    html: bodyToHtml(body),
    hasList: lists.length > 0,
    wc: paras.reduce((s, p) => s + words(p.text), 0),
  };
}

const INFO_RE = /^(for )?more information$/i;
const PHONE_RE = /\(?\d{3}\)?[.\-\s]+\d{3}[.\-\s]\d{4}/;
const ADDR_RE = /\b\d{3}[.\-\s]\d{3}[.\-\s]\d{4}\b|\bIN\s?\d{5}\b|\b(road|rd|street|st|ave|avenue|drive|dr|blvd|suite|ste)\b/i;
const titleize = (s) => s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// breadcrumb reconstructed from the URL path (the flat scrape drops the site nav)
function crumbsFromUrl(url, title) {
  let segs = [];
  try { segs = new URL(url).pathname.split('/').filter(Boolean); } catch { /* keep [] */ }
  const li = ['<li><a href="/">Home</a></li>'];
  let acc = '';
  segs.forEach((s, i) => {
    acc += `/${s}`;
    if (i === segs.length - 1) li.push(`<li>${esc(title)}</li>`);
    else li.push(`<li><a href="${attr(acc)}">${esc(titleize(s))}</a></li>`);
  });
  return `<ul>${li.join('')}</ul>`;
}

export function build(slug, family, outPath) {
  const d = load(slug);
  const n = d.nodes || [];
  if (n.length < 4) return { ok: false, reason: 'thin-scrape', nodes: n.length };

  // walk heading-delimited regions (levels 2-6; L1 is the hero title)
  const firstHeadIdx = n.findIndex((x, i) => i > 0 && isHeading(x) && x.level <= 3);
  const preHead = n.slice(1, firstHeadIdx < 0 ? n.length : firstHeadIdx);
  const headIdxs = n.map((x, i) => (isHeading(x) && x.level >= 2 && x.level <= 6 && i > 0 ? i : -1)).filter((i) => i >= 0);
  const regions = [];
  const introParas0 = preHead.filter((x) => x.t === 'p' && !RAIL_RE.test(x.text));
  const preRegion = { head: null, body: introParas0 };
  if (introParas0.length) regions.push(preRegion);
  for (let h = 0; h < headIdxs.length; h += 1) {
    const start = headIdxs[h]; const end = h + 1 < headIdxs.length ? headIdxs[h + 1] : n.length;
    regions.push({ head: n[start], body: n.slice(start + 1, end) });
  }

  // pull the "More Information" region's ADDRESS out of the main flow → rail info.
  // The flat scrape emits it in DOM order (often ahead of the real intro) and the
  // heading greedily spans to the next heading, so capture only the leading address
  // lines (short / address-shaped / "schedule" lines) and return the intro prose
  // that follows back to the flow — else the whole Overview leaks into the rail.
  let infoRegion = null;
  const infoPos = regions.findIndex((r) => r.head && INFO_RE.test(r.head.text));
  if (infoPos >= 0) {
    const r = regions[infoPos];
    const isProse = (x) => x.t === 'p' && words(x.text) > 14 && !ADDR_RE.test(x.text)
      && !/schedule|call|option|questionnaire|answer/i.test(x.text);
    let cut = r.body.findIndex(isProse);
    if (cut < 0) cut = r.body.length;
    const rest = r.body.slice(cut);
    regions.splice(infoPos, 1, ...(rest.length ? [{ head: null, body: rest }] : []));
    infoRegion = { head: r.head, body: r.body.slice(0, cut) };
  }
  const infoBody = new Set(infoRegion ? infoRegion.body : []);
  const railInfoHtml = (() => {
    if (!infoRegion) return '';
    const ps = infoRegion.body.filter((x) => x.t === 'p' && (x.text || '').trim());
    if (!ps.length) return '';
    return `<p>${esc(infoRegion.head.text)}</p><address>${ps.map((p) => linkify(p)).join('<br>')}</address>`;
  })();

  // rail child-nav (from an "In this section" links group — often empty in the scrape)
  const railLinks = [];
  for (const x of n) if (x.t === 'p' && RAIL_RE.test(x.text)) for (const l of (x.links || [])) railLinks.push(l);

  // hero lede: first substantial prose (a <p> or an intro blockquote) that is NOT
  // rail/address/info content
  const lede = n.find((x, i) => i > 0 && (x.t === 'p' || x.t === 'blockquote') && words(x.text) > 10
    && !RAIL_RE.test(x.text) && !infoBody.has(x) && !ADDR_RE.test(x.text));
  const cta = heroCtaHref(n);
  const phoneNode = n.find((x) => x.t === 'p' && PHONE_RE.test(x.text) && /ph|phone|call|tel/i.test(x.text));
  const phone = phoneNode ? (phoneNode.text.match(PHONE_RE) || [])[0] : null;
  const phoneCta = phone ? ` <a href="tel:+1${phone.replace(/\D/g, '')}">${esc(phone)}</a>` : '';

  const S = [];
  S.push(section(block('service-hero', [
    [crumbsFromUrl(d.url, d.title)],
    [`<h1>${esc(d.title)}</h1>`],
    [lede ? `<p>${esc(lede.text)}</p>` : ''],
    [`<p><strong><a href="${attr(rel(cta.href))}">${esc(cta.text)}</a></strong>${phoneCta}</p>`],
  ])));

  // avoid duplicating the hero lede in the pre-heading intro region (landers with no
  // rail). Hub Overview prose lives in a post-heading region and keeps the lede, as
  // the gold prototype does (hero lede + Overview both open with the same sentence).
  // But if the lede is the ONLY intro prose, keep it — an empty body drops the page
  // below the block-diversity gate (better a short body than no body).
  const introRest = introParas0.filter((x) => x !== lede);
  preRegion.body = introRest.length ? introRest : introParas0;

  // build sections; accumulate consecutive prose sub-sections. At flush: a lead intro
  // (headless) → service-body; ≥3 titled prose sub-sections → topic-panels (the narrative
  // archetype's bordered panels, NOT one giant prose block); ≤2 titled → service-body.
  let proseBuf = []; // [{head, paras}]
  let bareBuf = []; // consecutive heading-only regions (item clusters expressed as headings)
  let railUsed = false;
  // the rail (child-nav + address) attaches to the FIRST service-body emitted, once
  const takeRail = () => {
    if (railUsed) return ['', ''];
    const r0 = railLinks.length ? `<p>In this section</p>${ul({ items: railLinks })}` : '';
    if (r0 || railInfoHtml) { railUsed = true; return [r0, railInfoHtml]; }
    return ['', ''];
  };
  const isBare = (r) => r.head && !r.body.some((x) => x.t === 'p' && !RAIL_RE.test(x.text)) && !r.body.some((x) => x.t === 'list');
  const flushProse = () => {
    if (!proseBuf.length) return;
    const lead = proseBuf.filter((r) => !r.head);
    const titled = proseBuf.filter((r) => r.head && r.html);
    // topic-panels only for PARALLEL narrative: 3–5 titled sections, all list-free and
    // of comparable, moderate length (15–180 words) — the hip-replacement "Why / What
    // to Expect / Everyday Life" shape. A sequential article (many sections, a very
    // long section, or any section with a bullet list) stays one service-body so
    // headings + paragraphs + <ul>s read as prose, not bordered cards.
    const panels = titled.length >= 3 && titled.length <= 5
      && titled.every((r) => !r.hasList && r.wc >= 15 && r.wc <= 180);
    if (panels) {
      if (lead.length) {
        const [r0, r1] = takeRail();
        const overview = (r0 || r1) ? '<h2>Overview</h2>' : '';
        S.push(section(block('service-body', [[r0], [r1], [overview + lead.map((r) => r.html).join('')]])));
      }
      S.push(section(block('topic-panels', titled.map((r) => [esc(r.head), r.html]))));
    } else {
      // one clean article: lead intro + every titled section (h2 + prose + bullets)
      const [r0, r1] = takeRail();
      const overview = (r0 || r1) && lead.length ? '<h2>Overview</h2>' : '';
      const bodyHtml = overview + lead.map((r) => r.html).join('')
        + titled.map((r) => `<h2>${esc(r.head)}</h2>${r.html}`).join('');
      if (bodyHtml) S.push(section(block('service-body', [[r0], [r1], [bodyHtml]])));
    }
    proseBuf = [];
  };
  // a run of ≥3 bare headings at the same (deepest) level = a label card set →
  // svc-cards; a shallower heading opening the run becomes the section title.
  const flushBare = () => {
    if (!bareBuf.length) return;
    const deep = Math.max(...bareBuf.map((r) => r.head.level));
    const cards = bareBuf.filter((r) => r.head.level === deep);
    const title = bareBuf.find((r) => r.head.level < deep);
    if (cards.length >= 3) {
      flushProse();
      S.push(section(title ? `<h2>${esc(title.head.text)}</h2>` : '', block('svc-cards', cards.map((r) => [esc(r.head.text)]))));
    } else {
      // not a cluster — bare headings carry no body; drop (matches prior behaviour)
      for (const r of bareBuf) proseBuf.push({ head: r.head.text, html: '', hasList: false, wc: 0 });
    }
    bareBuf = [];
  };
  for (const r of regions) {
    if (isBare(r)) { bareBuf.push(r); continue; }
    flushBare();
    const seg = regionSection(r.head, r.body);
    if (seg.type === 'prose') { proseBuf.push({ head: seg.head, html: seg.html, hasList: seg.hasList, wc: seg.wc }); continue; }
    flushProse();
    S.push(seg.html);
  }
  flushBare();
  flushProse();

  // rail content but no service-body consumed it (thin contact-style pages: hero +
  // address + cta) → emit a rail-carrying service-body so the address renders, using
  // the lede as the Overview prose when present.
  if (!railUsed && (railInfoHtml || railLinks.length)) {
    const [r0, r1] = takeRail();
    const overview = lede ? `<h2>Overview</h2><p>${esc(lede.text)}</p>` : '';
    S.push(section(block('service-body', [[r0], [r1], [overview]])));
  }

  // ensure a closing cta-band exists (grammar family default)
  const hasCta = S.some((s) => s.includes('class="cta-band"'));
  if (!hasCta) {
    S.push(section(block('cta-band', [
      ['<h2>Schedule an Appointment</h2>'],
      [`<p><strong><a href="${attr(rel(cta.href))}">${esc(cta.text)}</a></strong></p>`],
    ])));
  }

  S.push(section(metadata({ title: d.title, description: (d.description || (lede && lede.text) || d.title).slice(0, 155) })));

  // distinct block types (excluding metadata)
  const types = new Set([...doc(S).matchAll(/<div class="([a-z-]+)">/g)].map((m) => m[1]).filter((b) => b !== 'metadata'));
  return { ok: true, html: doc(S), blocks: [...types], blockCount: types.size, outPath };
}
