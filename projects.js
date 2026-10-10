/* ═══════════════════════════════════════════════════════════
   WalZetass Portfolio — projects.js
   Projects List · Detail Hydration · Filter · Lightbox
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   PROJECT DATA — single source of truth
───────────────────────────────────────────────────────────── */
const PROJECTS = {};

/* ─────────────────────────────────────────────────────────────
   UTILITY
───────────────────────────────────────────────────────────── */
function qs(sel, ctx = document) { return ctx.querySelector(sel); }
function qsa(sel, ctx = document) { return Array.from(ctx.querySelectorAll(sel)); }

function setInnerHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setSrc(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src;
}

function setHref(id, href) {
  const el = document.getElementById(id);
  if (el) el.href = href;
}

/* ─────────────────────────────────────────────────────────────
   PAGE CHROME — Judul, sub, filter, CTA (dari landing_sections)
───────────────────────────────────────────────────────────── */
function hydrateProjectsPageChrome(landing) {
  const p = (landing && landing.projects) || {};
  const set = (sel, val, html) => {
    if (!val) return;
    document.querySelectorAll(sel).forEach(el => {
      if (html) el.innerHTML = val; else el.textContent = val;
    });
  };

  set('.page-hero .section-label', p.pageLabel);
  set('.page-hero .page-hero-title', p.pageHeadline, true);
  set('.page-hero .page-hero-sub', p.pageSub, true);

  // Meta: jumlah proyek dihitung dari data, periode & ecosystem dari DB
  const metaNum = document.querySelector('.page-hero-meta .meta-num');
  if (metaNum && typeof window.__projectCount === 'number') metaNum.textContent = window.__projectCount;
  set('.page-hero-meta [data-meta="period"]', p.pageMetaPeriod);
  set('.page-hero-meta [data-meta="ecosystem"]', p.pageMetaEcosystem);

  // Label filter
  if (Array.isArray(p.filterLabels) && p.filterLabels.length) {
    const btns = document.querySelectorAll('.filter-bar .filter-btn');
    btns.forEach((btn, i) => {
      const lbl = p.filterLabels[i];
      if (!lbl) return;
      // textContent sudah aman secara escaping, jadi jangan pakai escapeHTML
      if (i === 1) btn.textContent = '⭐ ' + lbl;
      else btn.textContent = lbl;
    });
  }

  // CTA
  set('.projects-cta .cta-label', p.ctaLabel);
  set('.projects-cta .cta-title', p.ctaHeadline, true);
  const ctaBtn = document.querySelector('.projects-cta a.btn-primary, .projects-cta a.btn-ghost');
  if (ctaBtn && p.ctaBtnText) {
    ctaBtn.textContent = p.ctaBtnText;
    if (p.ctaBtnLink) ctaBtn.href = p.ctaBtnLink;
  }
}

/* ─────────────────────────────────────────────────────────────
   DETAIL LABELS — Judul bagian di project-detail.html
───────────────────────────────────────────────────────────── */
function hydrateDetailLabels(landing) {
  const d = (landing && landing.detail) || {};
  const put = (id, val) => { if (val) setText(id, val); };
  const putHTML = (id, val) => { if (val) setHTML(id, val); };

  put('d-back', d.backLink);
  put('d-breadcrumbLabel', d.breadcrumbLabel);
  put('d-summaryLabel', d.summaryLabel);
  put('d-stackLabel', d.stackLabel);
  putHTML('d-challengesTitle', d.challengesTitle);
  put('d-challengesLabel', d.challengesLabel);
  putHTML('d-solutionTitle', d.solutionTitle);
  put('d-solutionLabel', d.solutionLabel);
  putHTML('d-resultsTitle', d.resultsTitle);
  put('d-resultsLabel', d.resultsLabel);
  putHTML('d-galleryTitle', d.galleryTitle);
  put('d-galleryLabel', d.galleryLabel);
  put('d-nextLabel', d.nextLabel);

  if (Array.isArray(d.tocLabels) && d.tocLabels.length) {
    document.querySelectorAll('.d-toc a, .toc a').forEach((a, i) => {
      if (d.tocLabels[i]) a.textContent = d.tocLabels[i];
    });
  }
}

/* ─────────────────────────────────────────────────────────────
   PROJECTS LIST — Dynamic Showcase Rendering & Filter
───────────────────────────────────────────────────────────── */
function initFilter() {
  const btns     = qsa('.filter-btn');
  const articles = qsa('.showcase');
  if (!btns.length || !articles.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = (btn.dataset.filter || 'all').toLowerCase();

      articles.forEach(art => {
        const cat = (art.dataset.category || '').toLowerCase();
        const tags = (art.dataset.tags || '').toLowerCase();
        const feat = art.dataset.featured === '1';
        const show = filter === 'all'
          || (filter === 'featured' && feat)
          || cat.includes(filter) || tags.includes(filter);
        art.style.display = show ? '' : 'none';
        if (show) {
          // Re-trigger reveals for newly shown items
          qsa('.reveal-up, .reveal-fade, .reveal-clip', art).forEach(el => {
            if (!el.classList.contains('visible')) {
              el.classList.add('visible');
            }
          });
        }
      });
    });
  });
}

function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function renderProjectsShowcase() {
  const container = document.getElementById('projectsShowcaseContainer');
  if (!container) return;

  try {
    let projs = null;
    if (typeof PortfolioAPI !== 'undefined') {
      projs = await PortfolioAPI.getProjects(false);
    } else {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const json = await res.json();
        projs = json.data || [];
      }
    }

    if (Array.isArray(projs)) {
      if (projs.length === 0) {
        container.innerHTML = '<div style="padding: 4rem 0; text-align: center; color: var(--text-3); font-family: var(--font-mono); font-size: 0.9rem; border: 1px dashed var(--border); border-radius: var(--radius-sm); margin: 2rem 0;">Belum ada karya yang dipublikasikan.</div>';
        return;
      }
    } else {
      projs = Object.values(PROJECTS);
    }

    container.innerHTML = projs.map((p, idx) => {
      const isReverse = idx % 2 === 1;
      const num = p.num || String(idx + 1).padStart(2, '0');
      const cat = p.category || 'fullstack';
      const catLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
      const year = p.year || '2024';
      const slugOrId = p.slug || p.id;
      const stack = Array.isArray(p.stack) ? p.stack : [];
      const titleFormatted = p.title.includes('<br>') ? p.title : `${p.title}`;
      const coverImg = p.cover || 'assets/mockups/placeholder.svg';
      const tagsAttr = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
      const isIcon = coverImg.includes('-icon') || coverImg.includes('icon.png');
      const cleanUrl = v => { const s = (v || '').trim(); return !s || s === '#' || s === 'undefined' ? '' : s; };
      const liveUrl = cleanUrl(p.live || p.liveUrl);
      const ghUrl = cleanUrl(p.github || p.githubUrl);

      return `
      <article class="showcase ${isReverse ? 'showcase--reverse' : ''}" data-category="${escapeHTML(cat)}" data-tags="${escapeHTML(tagsAttr)}" data-featured="${p.featured ? 1 : 0}" id="proj-${escapeHTML(num)}">
        <div class="showcase-inner">

          <div class="showcase-image reveal-clip visible">
            <a href="project-detail.html?id=${encodeURIComponent(slugOrId)}" class="showcase-img-link" aria-label="Lihat proyek ${escapeHTML(p.titlePlain || p.title)}">
              <div class="showcase-img-wrap">
                <img src="${escapeHTML(coverImg)}" class="${isIcon ? 'contain-fit' : ''}" alt="Tangkapan layar ${escapeHTML(p.titlePlain || p.title)}" loading="lazy" />
                <div class="showcase-img-overlay">
                  <span class="overlay-cta">Lihat Studi Kasus ↗</span>
                </div>
              </div>
            </a>
          </div>

          <div class="showcase-content">
            <div class="showcase-eyebrow reveal-up visible">
              <span class="showcase-num">${escapeHTML(num)}</span>
              <span class="showcase-cat">${escapeHTML(catLabel)} · ${escapeHTML(year)}</span>
            </div>
            <h2 class="showcase-title reveal-up visible">
              ${titleFormatted}
            </h2>
            <p class="showcase-desc reveal-up visible">
              ${escapeHTML(p.tagline || p.desc || '')}
            </p>
            <div class="showcase-stack reveal-up visible">
              <span class="stack-label">Teknologi</span>
              <div class="stack-tags">
                ${stack.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}
              </div>
            </div>
            <div class="showcase-actions reveal-up visible">
              <a href="project-detail.html?id=${encodeURIComponent(slugOrId)}" class="btn-primary">Studi Kasus →</a>
              ${liveUrl ? `<a href="${escapeHTML(liveUrl)}" class="btn-ghost" target="_blank" rel="noopener">Demo Langsung ↗</a>` : ''}
              ${ghUrl ? `<a href="${escapeHTML(ghUrl)}" class="btn-ghost" target="_blank" rel="noopener">GitHub ↗</a>` : ''}
            </div>
          </div>

        </div>
      </article>`;
    }).join('\n');

    initFilter();
    initShowcaseTilt();
    initRevealsDynamic();
  } catch (err) {
    console.error('Gagal merender showcase proyek:', err);
  }
}

/* ─────────────────────────────────────────────────────────────
   PROJECT DETAIL — Hydrate from URL param & Database API
───────────────────────────────────────────────────────────── */
async function hydrateDetail() {
  if (!document.querySelector('.page-detail')) return;

  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id') || 'waripos';

  let proj = null;
  try {
    if (typeof PortfolioAPI !== 'undefined') {
      proj = await PortfolioAPI.getProject(id);
    } else {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (json.success && json.data) proj = json.data;
    }
  } catch (err) {
    console.warn('Gagal memuat proyek dari API, menggunakan fallback lokal:', err.message);
  }

  if (!proj) {
    proj = PROJECTS[id];
  }

  if (!proj) {
    document.title = 'Proyek Tidak Ditemukan — WalZetass';
    const heroTitle = document.getElementById('d-title');
    if (heroTitle) heroTitle.textContent = 'Proyek Tidak Ditemukan';
    return;
  }

  document.title = `${proj.titlePlain || proj.title} — M Ihwal Maulana`;

  // ── Hero ──
  setText('d-breadcrumb', proj.titlePlain || proj.title);
  setText('d-num',        proj.num);
  setInnerHTML('d-title', proj.title);
  setText('d-tagline',    proj.tagline);

  // ── Meta ──
  setText('d-category', proj.category);
  setText('d-year',     proj.year);
  setText('d-role',     proj.role);
  setText('d-duration', proj.duration);

  // ── Links ──
  setHref('d-live-btn',   proj.liveUrl || proj.live || '#');
  setHref('d-github-btn', proj.githubUrl || proj.github || '#');

  // ── Images ──
  const coverImg = document.getElementById('d-cover');
  if (coverImg) {
    coverImg.src = proj.cover || '';
    if (proj.cover && (proj.cover.includes('-icon') || proj.cover.includes('icon.png'))) {
      coverImg.classList.add('contain-fit');
    } else {
      coverImg.classList.remove('contain-fit');
    }
  }
  setSrc('d-spread1',   proj.spread1);
  setSrc('d-spread2',   proj.spread2);
  setSrc('d-fullwidth', proj.fullwidth);

  // ── Stack ──
  const stackEl = document.getElementById('d-stack');
  if (stackEl && Array.isArray(proj.stack)) {
    stackEl.innerHTML = proj.stack.map(t => `<span class="tag">${t}</span>`).join('');
  }

  // ── Overview ──
  setInnerHTML('d-overview-title', proj.overviewTitle);
  setText('d-overview-body',  proj.overviewBody1);
  setText('d-overview-body2', proj.overviewBody2);

  // ── Challenges ──
  const chalEl = document.getElementById('d-challenge');
  if (chalEl && Array.isArray(proj.challenges)) {
    chalEl.innerHTML = proj.challenges.map(c => `
      <div class="challenge-item reveal-up">
        <span class="challenge-icon">◆</span>
        <div>
          <h4>${c.title}</h4>
          <p>${c.body}</p>
        </div>
      </div>
    `).join('');
  }

  // ── Solution ──
  const solEl = document.getElementById('d-solution');
  if (solEl && Array.isArray(proj.solutionParas)) {
    solEl.innerHTML = proj.solutionParas.map(p => `<p class="detail-body reveal-up">${p}</p>`).join('');
  }

  // ── Results ──
  const resEl = document.getElementById('d-results');
  if (resEl && Array.isArray(proj.results)) {
    resEl.innerHTML = proj.results.map(r => `
      <div class="result-stat">
        <span class="result-num">${r.num}</span>
        <span class="result-label">${r.label}</span>
      </div>
    `).join('');
  }

  // ── Gallery ──
  const galEl = document.getElementById('d-gallery');
  if (galEl && Array.isArray(proj.gallery)) {
    galEl.innerHTML = proj.gallery.map((g) => `
      <div class="gallery-item" data-src="${g.src}">
        <img src="${g.src}" alt="${g.caption}" loading="lazy" />
        <span class="gallery-caption">${g.caption}</span>
      </div>
    `).join('');
    initLightbox();
  }

  // ── Next Project ──
  const nextEl = document.getElementById('d-next');
  if (nextEl) {
    const nextLink = nextEl.querySelector('a');
    if (nextLink) nextLink.href = `project-detail.html?id=${proj.nextId || 'carikostkita'}`;
    const nextTitle = nextEl.querySelector('.next-title');
    if (nextTitle) nextTitle.innerHTML = proj.nextTitle || 'Proyek Berikutnya';
  }

  // Re-run reveals on dynamic content
  initRevealsDynamic();
}

/* ─────────────────────────────────────────────────────────────
   SCROLL REVEAL (for dynamically injected content)
───────────────────────────────────────────────────────────── */
function initRevealsDynamic() {
  const els = qsa('.reveal-up:not(.visible), .reveal-fade:not(.visible), .reveal-clip:not(.visible)');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, parseInt(entry.target.dataset.delay || 0));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  els.forEach((el, i) => {
    const siblings = el.parentElement?.querySelectorAll('.reveal-up, .reveal-fade, .reveal-clip');
    if (siblings) {
      const idx = Array.from(siblings).indexOf(el);
      if (!el.dataset.delay) el.dataset.delay = idx * 80;
    }
    observer.observe(el);
  });
}

/* ─────────────────────────────────────────────────────────────
   LIGHTBOX
───────────────────────────────────────────────────────────── */
function initLightbox() {
  // Create lightbox element if not present
  let lb = document.querySelector('.lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lightbox-close" aria-label="Tutup">✕</button>
      <img src="" alt="Tangkapan layar diperbesar" />
    `;
    document.body.appendChild(lb);
  }

  const lbImg   = lb.querySelector('img');
  const lbClose = lb.querySelector('.lightbox-close');

  function open(src) {
    lbImg.src = src;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Gallery items
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.gallery-item');
    if (item && item.dataset.src) {
      open(item.dataset.src);
    }
  });

  lbClose.addEventListener('click', close);

  lb.addEventListener('click', (e) => {
    if (e.target === lb) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* ─────────────────────────────────────────────────────────────
   READ PROGRESS BAR
───────────────────────────────────────────────────────────── */
function initProgressBar() {
  const bar = document.getElementById('readProgress');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const total = document.body.scrollHeight - window.innerHeight;
    const pct   = total > 0 ? (window.scrollY / total) * 100 : 0;
    bar.style.width = pct + '%';
  }, { passive: true });
}

/* ─────────────────────────────────────────────────────────────
   FLOATING TOC (detail page)
───────────────────────────────────────────────────────────── */
function initTOC() {
  const sections = qsa('.detail-section');
  if (!sections.length) return;

  // Only show on wider viewports
  if (window.innerWidth < 1100) return;

  const toc = document.createElement('nav');
  toc.className = 'detail-toc';
  toc.setAttribute('aria-label', 'Navigasi bagian');

  const labels = ['Ringkasan', 'Tangkapan Layar', 'Tantangan', 'Solusi', 'Detail', 'Hasil', 'Galeri'];

  sections.forEach((sec, i) => {
    const dot = document.createElement('div');
    dot.className = 'toc-dot';
    dot.dataset.label = labels[i] || `Bagian ${i + 1}`;
    dot.addEventListener('click', () => {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    toc.appendChild(dot);
  });

  document.body.appendChild(toc);

  // Highlight active dot
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = sections.indexOf(entry.target);
        qsa('.toc-dot').forEach((d, i) => {
          d.classList.toggle('active', i === idx);
        });
      }
    });
  }, { threshold: 0.5 });

  sections.forEach(s => io.observe(s));
}

/* ─────────────────────────────────────────────────────────────
   SHOWCASE IMAGE — parallax tilt on hover
───────────────────────────────────────────────────────────── */
function initShowcaseTilt() {
  const wraps = qsa('.showcase-img-wrap');

  wraps.forEach(wrap => {
    wrap.addEventListener('mousemove', (e) => {
      const rect = wrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      wrap.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 3}deg)`;
    });

    wrap.addEventListener('mouseleave', () => {
      wrap.style.transform = '';
      wrap.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      setTimeout(() => { wrap.style.transition = ''; }, 500);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   CHROME LOADER — Ambil landing sections lalu isi halaman
───────────────────────────────────────────────────────────── */
async function hydratePageChrome() {
  try {
    let data = null;
    if (typeof PortfolioAPI !== 'undefined') {
      data = await PortfolioAPI.getPortfolio();
    } else {
      const res = await fetch('/api/portfolio');
      data = (await res.json()).data;
    }
    if (!data) return;
    window.__projectCount = (data.projects || []).length;
    hydrateProjectsPageChrome(data.landing);
    hydrateDetailLabels(data.landing);
  } catch (e) {
    console.warn('Gagal memuat chrome halaman:', e && e.message);
  }
}

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  const safe = (name, fn) => {
    try { fn(); } catch (e) { console.warn(`[projects] ${name} gagal:`, e && e.message); }
  };

  // Chrome dimuat lebih dulu supaya judul/filter tidak sempat tampil kosong
  safe('hydratePageChrome', hydratePageChrome);

  safe('renderProjectsShowcase', renderProjectsShowcase);
  safe('hydrateDetail', hydrateDetail);
  safe('initFilter', initFilter);
  safe('initProgressBar', initProgressBar);
  safe('initShowcaseTilt', initShowcaseTilt);

  // Stagger-init the TOC after page loads
  setTimeout(safe.bind(null, 'initTOC', initTOC), 400);

  // Run dynamic reveals after hydration settles
  setTimeout(safe.bind(null, 'initRevealsDynamic', initRevealsDynamic), 100);

  // Real-time synchronization
  if (typeof PortfolioAPI !== 'undefined' && PortfolioAPI.onUpdate) {
    PortfolioAPI.onUpdate(() => {
      safe('hydratePageChrome', hydratePageChrome);
      safe('renderProjectsShowcase', renderProjectsShowcase);
      safe('hydrateDetail', hydrateDetail);
    });
  }
});
