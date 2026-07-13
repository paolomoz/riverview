/**
 * contact-hero — Contact Us hero (navy topo band + wave).
 * Tier: TEMPLATE-SLOTTED. Holds the prototype section's fixed composition
 * (decorative topo + wave SVGs, breadcrumb + copy layout) and slots the authored
 * values by role: breadcrumb (Home link + current crumb), the page <h1>, the
 * lede, the note paragraph (verbatim inline links), and the outline-light CTA.
 *
 * Source: stardust/prototypes/contact-us-form-proposed.html  (section.ds-hero)
 * Schema: stardust/eds-schema/contact-us-form.json#contact-hero
 *
 * Authored row contract (each row = one cell):
 *   0  breadcrumb — <a href="/">Home</a> + <span>Contact Us</span> (current)
 *   1  <h1>Contact Us</h1>           (the single page H1)
 *   2  lede paragraph
 *   3  note paragraph (contains the two verbatim inline links)
 *   4  CTA(s) — <em><a>…</a></em> (→ btn-secondary, outline-light on navy)
 *
 * The prototype reserves a min-height on the hero (>=901px) so the Typekit
 * font-swap can't shift the wave + tall body below it (CLS fix) — preserved in CSS.
 */

const TOPO = `<svg class="ds-topo" viewBox="0 0 1440 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><g fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1.5"><path d="M-60 90 C 220 30, 460 150, 740 100 S 1230 40, 1500 110"/><path d="M-60 190 C 240 130, 480 250, 760 200 S 1250 140, 1500 210"/><path d="M-60 290 C 200 230, 440 350, 720 300 S 1210 240, 1500 310"/><path d="M-60 390 C 260 330, 500 450, 780 400 S 1270 340, 1500 410"/><path d="M-60 490 C 220 430, 460 550, 740 500 S 1230 440, 1500 510"/></g></svg>`;
const WAVE = `<svg class="ds-wave" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path fill="#ffffff" d="M0,58 C170,94 350,16 560,32 C780,49 930,98 1130,74 C1275,57 1375,24 1440,38 L1440,100 L0,100 Z"/></svg>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const cellOf = (row) => (row ? row.querySelector(':scope > div') || row : null);
  const [crumbRow, h1Row, ledeRow, noteRow, ctaRow] = rows.map(cellOf);

  const homeLink = crumbRow?.querySelector('a');
  const homeHref = homeLink?.getAttribute('href') || '/';
  const homeText = homeLink?.textContent.trim() || 'Home';
  const current = (crumbRow?.querySelector('span')?.textContent
    || h1Row?.textContent || '').trim();

  const h1Text = (h1Row?.querySelector('h1, h2, h3')?.textContent
    || h1Row?.textContent || '').trim();
  const ledeHTML = ledeRow?.querySelector('p')?.innerHTML
    ?? ledeRow?.innerHTML ?? '';
  const noteHTML = noteRow?.querySelector('p')?.innerHTML
    ?? noteRow?.innerHTML ?? '';

  const copy = document.createElement('div');
  copy.className = 'ds-hero-copy';
  copy.innerHTML = `
    <nav class="ds-crumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="${homeHref}">${homeText}</a></li>
        <li><span aria-current="page">${current}</span></li>
      </ol>
    </nav>
    <h1>${h1Text}</h1>
    <p class="ds-hero-lede">${ledeHTML}</p>
    <p class="ds-hero-note">${noteHTML}</p>`;

  if (ctaRow && ctaRow.textContent.trim()) {
    const ctas = document.createElement('div');
    ctas.className = 'ds-hero-ctas';
    ctas.append(...ctaRow.childNodes);
    copy.append(ctas);
  }

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.append(copy);

  block.innerHTML = TOPO;
  block.append(wrap);
  block.insertAdjacentHTML('beforeend', WAVE);
}
