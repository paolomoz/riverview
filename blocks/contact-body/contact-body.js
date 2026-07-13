/**
 * contact-body — two-column: conventional contact form (LEFT) + all captured
 * contact-information groups (RIGHT grey panel).
 * Tier: RECONSTRUCTIVE. The RIGHT panel is authored verbatim in the content page
 * (server-rendered — the 395 Westfield Rd / Noblesville IN 46060 address and the
 * 317-773-0760 phone must live in the served HTML, #86); decorate() classifies
 * each authored group row and wraps it in the grey panel grid. The LEFT form is
 * conventional contact-form UI (a real, non-submitting <form>): its exact field
 * set is bound at migrate/EDS from the live Drupal webform schema — nothing is
 * invented, so it is rebuilt here rather than authored as page content.
 *
 * Source: stardust/prototypes/contact-us-form-proposed.html (section.ds-body)
 * Schema: stardust/eds-schema/contact-us-form.json#contact-body
 *
 * Authored row contract (RIGHT panel — one row per contact-info group):
 *   each row's cell = <h3>Group title</h3> then one <p> per line
 *   (<p><span>Key:</span> <a href="tel:/mailto:">value</a></p>) or an <address>.
 */

const FORM = `
  <div class="ds-form-col">
    <h2 class="ds-region-title" id="contact-form-h">Send us a message</h2>
    <p class="ds-region-intro">Fields marked with an asterisk (<span aria-hidden="true">*</span>) are required.</p>
    <form class="ds-form" action="/antibot" method="post" aria-labelledby="contact-form-h" novalidate>
      <div class="ds-field-pair">
        <div class="ds-field">
          <label for="cf-first-name">First name <span class="ds-req" aria-hidden="true">*</span></label>
          <input class="ds-input" type="text" id="cf-first-name" name="first_name" autocomplete="given-name" required aria-required="true">
        </div>
        <div class="ds-field">
          <label for="cf-last-name">Last name <span class="ds-req" aria-hidden="true">*</span></label>
          <input class="ds-input" type="text" id="cf-last-name" name="last_name" autocomplete="family-name" required aria-required="true">
        </div>
      </div>
      <div class="ds-field">
        <label for="cf-email">Email <span class="ds-req" aria-hidden="true">*</span></label>
        <input class="ds-input" type="email" id="cf-email" name="email" autocomplete="email" required aria-required="true">
      </div>
      <div class="ds-field">
        <label for="cf-phone">Phone</label>
        <input class="ds-input" type="tel" id="cf-phone" name="phone" autocomplete="tel" inputmode="tel">
      </div>
      <div class="ds-field">
        <label for="cf-subject">Subject <span class="ds-req" aria-hidden="true">*</span></label>
        <input class="ds-input" type="text" id="cf-subject" name="subject" required aria-required="true">
      </div>
      <div class="ds-field">
        <label for="cf-message">Message <span class="ds-req" aria-hidden="true">*</span></label>
        <textarea class="ds-textarea" id="cf-message" name="message" rows="6" required aria-required="true"></textarea>
      </div>
      <div class="ds-form-actions">
        <button class="ds-form-submit" type="submit">Send message</button>
      </div>
    </form>
  </div>`;

export default async function decorate(block) {
  const rows = [...block.children];

  const grid = document.createElement('div');
  grid.className = 'ds-ci-grid';

  rows.forEach((row) => {
    const cell = row.querySelector(':scope > div') || row;
    if (!cell.textContent.trim()) return;
    const group = document.createElement('div');
    group.className = 'ds-ci-group';
    const heading = cell.querySelector('h2, h3, h4');
    if (heading) { const h = document.createElement('h3'); h.className = 'ds-ci-title'; h.innerHTML = heading.innerHTML; group.append(h); }
    const list = document.createElement('div');
    list.className = 'ds-ci-list';
    [...cell.querySelectorAll(':scope > p, :scope > address')].forEach((el) => {
      if (el.tagName === 'ADDRESS') { el.classList.add('ds-ci-address'); list.append(el); return; }
      el.classList.add('ds-ci-line');
      const lead = el.firstElementChild;
      if (lead && lead.tagName === 'SPAN') lead.classList.add('ds-ci-key');
      list.append(el);
    });
    group.append(list);
    grid.append(group);
  });

  const panel = document.createElement('aside');
  panel.className = 'ds-ci-panel';
  panel.setAttribute('aria-labelledby', 'contact-ci-h');
  panel.innerHTML = '<h2 class="ds-region-title" id="contact-ci-h">Contact information</h2>';
  panel.append(grid);

  const gridWrap = document.createElement('div');
  gridWrap.className = 'ds-form-grid';
  gridWrap.innerHTML = FORM;
  gridWrap.append(panel);

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.append(gridWrap);

  block.replaceChildren(wrap);
}
