// enrich-build.mjs — shape-aware deterministic builder: scrape node stream → gold
// archetype blocks per stardust/enrich/GRAMMAR.md and the four approved prototypes
// (service-hub, service-lander conversion/narrative, audience-hub). Segments by heading
// boundaries and classifies each region against the archetype block grammar:
//   symptom/condition lists → pills · service/procedure/allergen lists → svc-cards
//   ≥3 titled prose sub-sections → topic-panels · patient-story → story-band
//   appointment-request → appointment · CTA → cta-band · lead prose → service-body
// Not a per-page LLM builder — a grammar-encoded segmenter. Gate-filtered downstream.
import { load, esc, rel, attr, block, section, metadata, doc, ul } from './util.mjs';

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
// short medical labels, no per-item link/description
const isLabelSet = (items) => items.length >= 3 && items.every((it) => !it.href && !it.desc && words(it.text) <= 8);

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

  // list region → pills (symptoms/conditions) · svc-cards (services/procedures) · cards (rich)
  const items = itemsOf(lists);
  if (items.length >= 3) {
    const head = headNode ? `<h2>${esc(htext)}</h2>` : '';
    // symptom/condition short-label sets → pill cluster
    if (isLabelSet(items) && PILLS_RE.test(htext) && !SVC_RE.test(htext)) {
      return { type: 'pills', html: section(head, introP, block('pills', items.map((it) => [esc(it.text)]))) };
    }
    // service/procedure/allergen short-label sets → mint-diamond service cards
    if (isLabelSet(items)) {
      return { type: 'svc-cards', html: section(head, introP, block('svc-cards', items.map((it) => [esc(it.text)]))) };
    }
    // rich (linked / described) items → cards
    const cards = items.map((it) => [`<h3>${it.href ? `<a href="${attr(rel(it.href))}">${esc(it.text)}</a>` : esc(it.text)}</h3>`
      + (it.desc ? `<p>${esc(it.desc)}</p>` : '')]);
    return { type: 'cards', html: section(head, block('cards', cards)) };
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

  // else prose → buffer (head + paras) for flush (service-body or topic-panels)
  return { type: 'prose', head: headNode ? esc(htext) : '', paras: paras.map((p) => esc(p.text)) };
}

export function build(slug, family, outPath) {
  const d = load(slug);
  const n = d.nodes || [];
  if (n.length < 4) return { ok: false, reason: 'thin-scrape', nodes: n.length };

  // hero: title h1 + first blockquote/prose lede + CTA
  const firstHeadIdx = n.findIndex((x, i) => i > 0 && isHeading(x) && x.level <= 3);
  const preHead = n.slice(1, firstHeadIdx < 0 ? n.length : firstHeadIdx);
  const lede = preHead.find((x) => x.t === 'blockquote' || (x.t === 'p' && words(x.text) > 8 && !RAIL_RE.test(x.text)));
  const cta = heroCtaHref(n);
  const railLinks = [];
  for (const x of n) if (x.t === 'p' && RAIL_RE.test(x.text)) for (const l of (x.links || [])) railLinks.push(l);

  const S = [];
  S.push(section(block('service-hero', [
    [`<ul><li><a href="/">Home</a></li><li>${esc(d.title)}</li></ul>`],
    [`<h1>${esc(d.title)}</h1>`],
    ...(lede ? [[`<p>${esc(lede.text)}</p>`]] : []),
    [`<p><strong><a href="${attr(rel(cta.href))}">${esc(cta.text)}</a></strong></p>`],
  ])));

  // remaining intro prose (before first heading, minus the lede) folds into first prose section
  const introParas = preHead.filter((x) => x !== lede && x.t === 'p' && !RAIL_RE.test(x.text));

  // walk heading-delimited regions (levels 2-6; L1 is the hero title)
  const headIdxs = n.map((x, i) => (isHeading(x) && x.level >= 2 && x.level <= 6 && i > 0 ? i : -1)).filter((i) => i >= 0);
  const regions = [];
  if (introParas.length) regions.push({ head: null, body: introParas });
  for (let h = 0; h < headIdxs.length; h += 1) {
    const start = headIdxs[h]; const end = h + 1 < headIdxs.length ? headIdxs[h + 1] : n.length;
    regions.push({ head: n[start], body: n.slice(start + 1, end) });
  }

  // build sections; accumulate consecutive prose sub-sections. At flush: a lead intro
  // (headless) → service-body; ≥3 titled prose sub-sections → topic-panels (the narrative
  // archetype's bordered panels, NOT one giant prose block); ≤2 titled → service-body.
  let proseBuf = []; // [{head, paras}]
  let bareBuf = []; // consecutive heading-only regions (item clusters expressed as headings)
  const isBare = (r) => r.head && !r.body.some((x) => x.t === 'p' && !RAIL_RE.test(x.text)) && !r.body.some((x) => x.t === 'list');
  const flushProse = () => {
    if (!proseBuf.length) return;
    const railNav = railLinks.length ? `<p>In this section</p>${ul({ items: railLinks })}` : '';
    const lead = proseBuf.filter((r) => !r.head);
    const titled = proseBuf.filter((r) => r.head && r.paras.length);
    if (lead.length) {
      S.push(section(block('service-body', [[railNav], [''], [lead.map((r) => r.paras.map((t) => `<p>${t}</p>`).join('')).join('')]])));
    }
    if (titled.length >= 3) {
      // each titled sub-section → one topic-panel (heading cell + body cell)
      S.push(section(block('topic-panels', titled.map((r) => [`${esc(r.head)}`, r.paras.map((t) => `<p>${t}</p>`).join('')]))));
    } else if (titled.length) {
      S.push(section(block('service-body', [[lead.length ? '' : railNav], [''], [titled.map((r) => `<h2>${esc(r.head)}</h2>${r.paras.map((t) => `<p>${t}</p>`).join('')}`).join('')]])));
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
      for (const r of bareBuf) proseBuf.push({ head: esc(r.head.text), paras: [] });
    }
    bareBuf = [];
  };
  for (const r of regions) {
    if (isBare(r)) { bareBuf.push(r); continue; }
    flushBare();
    const seg = regionSection(r.head, r.body);
    if (seg.type === 'prose') { proseBuf.push({ head: seg.head, paras: seg.paras }); continue; }
    flushProse();
    S.push(seg.html);
  }
  flushBare();
  flushProse();

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
