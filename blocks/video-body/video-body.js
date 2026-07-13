/**
 * video-body — Brightcove poster + play affordance + verbatim description.
 * Tier: TEMPLATE-SLOTTED. Holds the fixed 16:9 figure + play-button composition
 * and slots the authored poster <img> and description paragraph.
 *
 * VIDEO EMBED CONDITIONAL (documented; wired at migrate/EDS): the live page
 * renders a Brightcove JS player. No public embeddable video URL was captured,
 * so the poster is held here with a static play affordance. At EDS the play
 * button (data-slot="video-player") is wired to swap in the Brightcove embed on
 * activation. This is NOT a synthesized/fake player and adds NO fake controls.
 *
 * Source: stardust/prototypes/video-…-proposed.html (section.ds-video-section)
 * Schema: stardust/eds-schema/video-courtney-cox-cole-infusion-center.json#video-body
 *
 * Authored row contract:
 *   0  poster <img src alt>   (riverview/Brightcove CDN poster, absolute URL)
 *   1  description paragraph  (verbatim)
 */

const PLAY_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z"/></svg>`;

export default async function decorate(block) {
  const rows = [...block.children];
  const img = block.querySelector('img');
  const descEl = rows[1]?.querySelector('p') || rows[1]?.querySelector(':scope > div') || rows[1];
  const descHTML = descEl ? (descEl.querySelector('p')?.innerHTML ?? descEl.innerHTML) : '';
  const label = img?.getAttribute('alt') || 'this video';

  if (img) { img.setAttribute('loading', 'eager'); img.setAttribute('fetchpriority', 'high'); }

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  wrap.innerHTML = `
    <h2 class="ds-sr-only">About this video</h2>
    <div class="ds-measure">
      <figure class="ds-video-figure">
        <div class="ds-video-frame">
          <button class="ds-video-play" type="button" data-slot="video-player" aria-label="Play video: ${label}">${PLAY_ICON}</button>
        </div>
      </figure>
    </div>
    <p class="ds-video-desc">${descHTML}</p>`;

  if (img) wrap.querySelector('.ds-video-frame').prepend(img);

  block.replaceChildren(wrap);
}
