/**
 * hero — navy wave/topo signature hero with an ambient Brightcove-hosted video.
 * Tier: TEMPLATE-SLOTTED (bespoke single-composition section; inner DOM held
 * verbatim, authored values slotted by role).
 *
 * Source: stardust/eds-schema/index.json#hero
 *   heading "to" + body "Welcome" + body "Riverview Health" (composed <h1> with a
 *   mint keyword), body lede, 2 CTAs (mint standing CTA + light-outline), 1 poster img.
 *
 * Row contract (content/index.html):
 *   row 0 → poster <img> (local /media asset)
 *   row 1 → video source URL (plain text; riverview CDN mp4)
 *   row 2 → <h1> headline text ("Welcome" → mint keyword, "Riverview Health" → brand span)
 *   row 3 → <p> lede
 *   row 4 → CTAs (<em><strong><a>> mint standing CTA, <em><a>> light-outline)
 *
 * Video: poster-first. The ambient loop plays only when on-screen and only when
 * the user has NOT requested reduced motion (and not on small screens); the
 * reimplemented pause affordance toggles playback. Real Brightcove player would
 * be an EDS conditional; here the direct <source> mp4 from the prototype is used.
 */
export default async function decorate(block) {
  const rows = [...block.children];
  const cell = (i) => rows[i]?.querySelector(':scope > div') || rows[i];

  const posterImg = cell(0)?.querySelector('img');
  const posterSrc = posterImg?.getAttribute('src') || '/media/hero-poster.jpg';
  const posterAlt = posterImg?.getAttribute('alt') || '';
  const videoSrc = (cell(1)?.textContent || '').trim();
  const h1Text = (cell(2)?.textContent || 'Welcome to Riverview Health').trim();
  const ledeText = (cell(3)?.textContent || '').trim();
  const ctaNodes = cell(4) ? [...cell(4).childNodes] : [];

  // compose the mint-keyword headline verbatim from the prototype
  const h1Html = h1Text
    .replace('Welcome', '<span class="ds-mint-word">Welcome</span>')
    .replace('Riverview Health', '<span class="ds-h1-brand">Riverview Health</span>');

  block.replaceChildren();

  const media = document.createElement('img');
  media.className = 'ds-hero-media';
  media.src = posterSrc;
  media.alt = posterAlt;
  media.setAttribute('fetchpriority', 'high');
  block.append(media);

  let video = null;
  if (videoSrc) {
    video = document.createElement('video');
    video.className = 'ds-hero-video';
    video.id = 'hero-video';
    video.poster = posterSrc;
    video.preload = 'metadata';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    video.tabIndex = -1;
    const source = document.createElement('source');
    source.src = videoSrc;
    source.type = 'video/mp4';
    video.append(source);
    block.append(video);
  }

  const scrim = document.createElement('div');
  scrim.className = 'ds-hero-scrim';
  scrim.setAttribute('aria-hidden', 'true');
  block.append(scrim);

  const wrap = document.createElement('div');
  wrap.className = 'ds-wrap';
  const content = document.createElement('div');
  content.className = 'ds-hero-content';
  content.innerHTML = `<h1>${h1Html}</h1>`;
  if (ledeText) {
    const lede = document.createElement('p');
    lede.className = 'ds-hero-lede';
    lede.textContent = ledeText;
    content.append(lede);
  }
  const ctas = document.createElement('div');
  ctas.className = 'ds-hero-ctas';
  ctaNodes.forEach((n) => ctas.append(n.cloneNode(true)));
  content.append(ctas);
  wrap.append(content);
  block.append(wrap);

  let pause = null;
  if (video) {
    pause = document.createElement('button');
    pause.className = 'ds-hero-pause';
    pause.id = 'hero-pause';
    pause.type = 'button';
    pause.setAttribute('aria-label', 'Pause background video');
    pause.setAttribute('aria-pressed', 'false');
    pause.innerHTML = '<svg class="ds-ic-pause" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
      + '<svg class="ds-ic-play" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.2-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5Z"/></svg>';
    block.append(pause);
  }

  const wave = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  wave.setAttribute('class', 'ds-wave');
  wave.setAttribute('viewBox', '0 0 1440 100');
  wave.setAttribute('preserveAspectRatio', 'none');
  wave.setAttribute('aria-hidden', 'true');
  wave.setAttribute('focusable', 'false');
  wave.innerHTML = '<path fill="#ffffff" d="M0,58 C170,94 350,16 560,32 C780,49 930,98 1130,74 C1275,57 1375,24 1440,38 L1440,100 L0,100 Z"/>';
  block.append(wave);

  // signature video gate — reduced-motion-safe, poster-first, play/pause reimplemented
  const small = window.matchMedia('(max-width: 767px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (video && (small.matches || reduced.matches)) {
    video.remove(); if (pause) pause.remove(); video = null; pause = null;
  }
  if (video) {
    let userPaused = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !userPaused) { video.play().catch(() => {}); } else { video.pause(); }
      });
    }, { threshold: 0.2 });
    io.observe(video);
    if (pause) {
      pause.addEventListener('click', () => {
        userPaused = !userPaused;
        pause.setAttribute('aria-pressed', String(userPaused));
        if (userPaused) { video.pause(); } else { video.play().catch(() => {}); }
      });
    }
  }
}
