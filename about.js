/* ═══════════════════════════════════════════════════════════
   WalZetass Portfolio — about.js
   Counter animation · Contact canvas · Reveal · Form
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   UTILITY
───────────────────────────────────────────────────────────── */
const ease = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out

/* ─────────────────────────────────────────────────────────────
   1. ANIMATED COUNTERS
───────────────────────────────────────────────────────────── */
function initCounters() {
  const counters = document.querySelectorAll('.counter-num');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const dur    = 1800;
      let start    = null;

      function step(ts) {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / dur, 1);
        el.textContent = Math.round(ease(progress) * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
      }

      requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.7 });

  counters.forEach(c => observer.observe(c));
}

/* ─────────────────────────────────────────────────────────────
   2. CONTACT SECTION — Dedicated Three.js canvas
      Subtle spinning ring + drifting particles
───────────────────────────────────────────────────────────── */
function initContactCanvas() {
  const canvas = document.getElementById('contact-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.z = 5;

  /* ── Large sparse ring ──────────────────────────────── */
  const ringGeo  = new THREE.TorusGeometry(3.2, 0.012, 2, 120);
  const ringMat  = new THREE.LineBasicMaterial({ color: 0x2a2a28, transparent: true, opacity: 0.8 });
  const ring1    = new THREE.LineSegments(new THREE.EdgesGeometry(ringGeo), ringMat);
  scene.add(ring1);

  const ring2Geo = new THREE.TorusGeometry(4.8, 0.008, 2, 160);
  const ring2    = new THREE.LineSegments(new THREE.EdgesGeometry(ring2Geo), ringMat.clone());
  ring2.rotation.x = Math.PI / 3;
  scene.add(ring2);

  /* ── Icosahedron — wireframe centre ─────────────────── */
  const icoGeo   = new THREE.IcosahedronGeometry(0.9, 1);
  const icoEdges = new THREE.EdgesGeometry(icoGeo);
  const icoMat   = new THREE.LineBasicMaterial({ color: 0x2e2e2c, transparent: true, opacity: 0.6 });
  const ico      = new THREE.LineSegments(icoEdges, icoMat);
  ico.position.set(3, -1, -1);
  scene.add(ico);

  /* ── Particles ──────────────────────────────────────── */
  const PCOUNT    = 280;
  const pPos      = new Float32Array(PCOUNT * 3);
  for (let i = 0; i < PCOUNT; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 20;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0xc8b89a, size: 0.018, transparent: true, opacity: 0.25 });
  scene.add(new THREE.Points(pGeo, pMat));

  /* ── Resize ─────────────────────────────────────────── */
  function resize() {
    const section = canvas.parentElement;
    if (!section) return;
    const W = section.offsetWidth;
    const H = section.offsetHeight || window.innerHeight;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  resize();

  const resObs = new ResizeObserver(resize);
  resObs.observe(canvas.parentElement);

  /* ── Mouse parallax ─────────────────────────────────── */
  let mx = 0, my = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Animation loop ──────────────────────────────────── */
  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    t += 0.004;

    ring1.rotation.y  = t * 0.12;
    ring1.rotation.x  = t * 0.06 + mx * 0.08;
    ring2.rotation.z  = t * 0.08;
    ring2.rotation.y += 0.002;

    ico.rotation.x += 0.004;
    ico.rotation.y += 0.006;
    ico.position.y  = -1 + Math.sin(t * 0.5) * 0.3;

    camera.position.x += (mx * 0.25 - camera.position.x) * 0.04;
    camera.position.y += (-my * 0.2  - camera.position.y) * 0.04;

    renderer.render(scene, camera);
  })();
}

/* ─────────────────────────────────────────────────────────────
   3. SCROLL REVEAL — Generic (mirrors main.js but scoped)
───────────────────────────────────────────────────────────── */
function initReveal() {
  const els = document.querySelectorAll('.reveal-up, .reveal-fade, .reveal-clip');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = parseInt(entry.target.dataset.delay || 0);
      setTimeout(() => entry.target.classList.add('visible'), delay);
      io.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach((el, i) => {
    // Stagger siblings
    const group = el.parentElement?.querySelectorAll('.reveal-up, .reveal-fade');
    if (group) {
      const idx = Array.from(group).indexOf(el);
      if (!el.dataset.delay) el.dataset.delay = Math.min(idx * 80, 320);
    }
    io.observe(el);
  });

  /* ── Contact headline — special multi-line reveal ─── */
  const headline = document.querySelector('.contact-headline');
  if (headline) {
    const hio = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        headline.classList.add('visible');
        hio.unobserve(headline);
      }
    }, { threshold: 0.3 });
    hio.observe(headline);
  }
}

/* ─────────────────────────────────────────────────────────────
   4. TOOLBOX — Tool item hover ripple
───────────────────────────────────────────────────────────── */
function initToolboxInteractions() {
  const categories = document.querySelectorAll('.tool-category');

  categories.forEach(cat => {
    cat.addEventListener('mouseenter', () => {
      cat.style.setProperty('--cat-hover', '1');
    });
    cat.addEventListener('mouseleave', () => {
      cat.style.removeProperty('--cat-hover');
    });
  });

  /* Count visible tools on each category header */
  document.querySelectorAll('.tool-category').forEach(cat => {
    const count = cat.querySelectorAll('.tool-item').length;
    const badge = cat.querySelector('.tool-cat-count');
    if (badge && !badge.textContent.includes('Mempelajari') && !badge.textContent.includes('Learning')) {
      badge.textContent = `${count} teknologi`;
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   5. EXPERIENCE TIMELINE — Hover state on entry
───────────────────────────────────────────────────────────── */
function initTimeline() {
  document.querySelectorAll('.exp-entry, .edu-entry').forEach(entry => {
    const dot = entry.querySelector('.exp-dot, .edu-dot');
    entry.addEventListener('mouseenter', () => {
      if (dot && !dot.classList.contains('exp-dot--active')) {
        dot.style.borderColor = 'var(--accent)';
        dot.style.background  = 'rgba(200,184,154,0.12)';
      }
    });
    entry.addEventListener('mouseleave', () => {
      if (dot && !dot.classList.contains('exp-dot--active')) {
        dot.style.borderColor = '';
        dot.style.background  = '';
      }
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   6. CONTACT FORM (Connected to API)
───────────────────────────────────────────────────────────── */
function initContactForm() {
  const form   = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const btn    = document.getElementById('sendBtn');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const name    = form.name?.value?.trim();
    const email   = form.email?.value?.trim();
    const message = form.message?.value?.trim();

    if (!name || !email || !message) {
      status.textContent = '⚠ Harap isi semua kolom yang wajib diisi.';
      status.style.color = '#f0a070';
      return;
    }

    if (btn) btn.disabled = true;
    const txtEl = btn ? btn.querySelector('.btn-send-text') : null;
    if (txtEl) txtEl.textContent = 'Mengirim…';
    status.textContent = '';

    try {
      if (typeof PortfolioAPI !== 'undefined' && PortfolioAPI.sendContact) {
        await PortfolioAPI.sendContact({ name, email, project: 'Pertanyaan dari Halaman Tentang', message });
      } else {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, project: 'Pertanyaan dari Halaman Tentang', message })
        });
        if (!res.ok) throw new Error('Gagal mengirim pesan');
      }

      status.textContent = "✓ Terkirim. Saya akan menghubungi Anda dalam 24 jam.";
      status.style.color = '#5fdb6f';
      form.reset();
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
      status.textContent = '✕ Gagal mengirim: ' + (err.message || 'Koneksi bermasalah');
      status.style.color = '#ff6b6b';
    } finally {
      if (btn) btn.disabled = false;
      if (txtEl) txtEl.textContent = 'Kirim Pesan';
      setTimeout(() => { status.textContent = ''; }, 6000);
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   7. SECTION SCROLL SPY — highlight nav
───────────────────────────────────────────────────────────── */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a[href*="#"]');
  if (!sections.length || !navLinks.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const href = link.getAttribute('href') || '';
          link.style.color = href.endsWith(`#${id}`) ? 'var(--text)' : '';
        });
      }
    });
  }, { threshold: 0.35 });

  sections.forEach(s => io.observe(s));
}

/* ─────────────────────────────────────────────────────────────
   8. CERTIFICATE CARD — subtle tilt
───────────────────────────────────────────────────────────── */
function initCertTilt() {
  document.querySelectorAll('.cert-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 5}deg) rotateX(${-y * 4}deg) translateZ(4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1), background 0.25s';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   9. HERO LOAD — trigger initial visible state
───────────────────────────────────────────────────────────── */
function initHeroLoad() {
  const heroEls = document.querySelectorAll('.s-about .reveal-up, .s-about .reveal-fade');
  heroEls.forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), 150 + i * 100);
  });
}

/* ─────────────────────────────────────────────────────────────
   10. DYNAMIC DATA HYDRATION (About Page)
───────────────────────────────────────────────────────────── */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function hydrateAbout() {
  try {
    let data = null;
    if (typeof PortfolioAPI !== 'undefined') {
      data = await PortfolioAPI.getPortfolio();
    } else {
      const res = await fetch('/api/portfolio');
      const json = await res.json();
      data = json.data;
    }
    if (!data) return;

    // Portrait / Avatar
    if (data.profile && data.profile.avatar) {
      let av = data.profile.avatar;
      if (av.startsWith('/') && !av.startsWith('//')) av = av.slice(1);
      const img = document.getElementById('aboutPortraitImg') || document.querySelector('.about-portrait img');
      if (img) img.src = av;
    }

    // Email link
    if (data.profile && data.profile.email) {
      const mailLinks = document.querySelectorAll('a[href^="mailto:"]');
      mailLinks.forEach(m => {
        m.href = `mailto:${data.profile.email}`;
      });
    }

    // Counters update
    if (data.projects && Array.isArray(data.projects)) {
      const pubCount = data.projects.filter(p => p.status === 'published').length;
      const cProj = document.querySelector('.counter-item:nth-child(2) .counter-num');
      if (cProj) {
        cProj.dataset.target = pubCount;
        cProj.textContent = pubCount;
      }
    }
    if (data.certificates && Array.isArray(data.certificates)) {
      const certCount = data.certificates.length;
      const cCert = document.querySelector('.counter-item:nth-child(3) .counter-num');
      if (cCert) {
        cCert.dataset.target = certCount;
        cCert.textContent = certCount;
      }
    }

    // Toolbox (Skills)
    const toolboxSection = document.getElementById('toolbox');
    const toolboxLinks = document.querySelectorAll('a[href*="#toolbox"]');
    const hasSkills = Array.isArray(data.skills) && data.skills.length > 0;
    if (toolboxSection) toolboxSection.style.display = '';
    toolboxLinks.forEach(l => l.style.display = '');

    const toolboxContainer = document.querySelector('.toolbox-categories');
    if (toolboxContainer) {
      if (!hasSkills) {
        toolboxContainer.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); width: 100%;"><p>Belum ada alat atau teknologi yang ditambahkan.</p></div>`;
      } else {
        const cats = {};
        data.skills.forEach(s => {
        const cat = s.category || 'General';
        if (!cats[cat]) cats[cat] = [];
        cats[cat].push(s);
      });

      toolboxContainer.innerHTML = Object.entries(cats).map(([catName, skillList]) => `
        <div class="tool-category reveal-up visible">
          <div class="tool-cat-header">
            <span class="tool-cat-icon">◈</span>
            <h3 class="tool-cat-name">${escapeHTML(catName)}</h3>
            <span class="tool-cat-count">${skillList.length} teknologi</span>
          </div>
          <div class="tool-grid">
            ${skillList.map(s => `
              <div class="tool-item" data-level="${escapeHTML(s.level || 'intermediate')}">
                <span class="tool-name">${escapeHTML(s.name)}</span>
                <span class="tool-level">${s.level === 'expert' ? 'Ahli' : s.level === 'advanced' ? 'Lanjutan' : s.level === 'learning' ? 'Mempelajari' : 'Menengah'}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    // Experience Timeline
    const expSection = document.getElementById('experience');
    const expLinks = document.querySelectorAll('a[href*="#experience"]');
    const hasExp = Array.isArray(data.experience) && data.experience.length > 0;
    if (expSection) expSection.style.display = '';
    expLinks.forEach(l => l.style.display = '');

    const expTimeline = document.querySelector('.exp-timeline');
    if (expTimeline) {
      if (!hasExp) {
        expTimeline.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); width: 100%;"><p>Belum ada riwayat pengalaman.</p></div>`;
      } else {
        expTimeline.innerHTML = data.experience.map((e, idx) => `
          <div class="exp-entry reveal-up visible" data-current="${e.current || idx === 0 ? 'true' : 'false'}">
            <div class="exp-year-col">
              <span class="exp-period">${escapeHTML(e.period || '')}</span>
              ${e.current || idx === 0 ? '<span class="exp-badge exp-badge--current">Aktif</span>' : `<span class="exp-badge">${escapeHTML(e.type || 'Penuh')}</span>`}
            </div>
            <div class="exp-node">
              <div class="exp-dot ${e.current || idx === 0 ? 'exp-dot--active' : ''}"></div>
              <div class="exp-connector"></div>
            </div>
            <div class="exp-content">
              <h3 class="exp-role">${escapeHTML(e.role)}</h3>
              <p class="exp-company">${escapeHTML(e.company)}${e.location ? ` <span class="exp-location">· ${escapeHTML(e.location)}</span>` : ''}</p>
              <p class="exp-desc">${escapeHTML(e.desc || '')}</p>
              ${Array.isArray(e.highlights) && e.highlights.length ? `
                <div class="exp-highlights">
                  ${e.highlights.map(h => `<span class="highlight-item">${escapeHTML(h)}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('');
      }
    }

    // Education
    const eduSection = document.getElementById('education');
    const eduLinks = document.querySelectorAll('a[href*="#education"]');
    const hasEdu = Array.isArray(data.education) && data.education.length > 0;
    if (eduSection) eduSection.style.display = '';
    eduLinks.forEach(l => l.style.display = '');

    const eduList = document.querySelector('.edu-list');
    if (eduList) {
      if (!hasEdu) {
        eduList.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); width: 100%;"><p>Belum ada riwayat pendidikan.</p></div>`;
      } else {
        eduList.innerHTML = data.education.map((ed, idx) => `
          <div class="edu-entry reveal-up visible">
            <div class="edu-year-col">
              <span class="edu-period">${escapeHTML(ed.period || '')}</span>
            </div>
            <div class="edu-node">
              <div class="edu-dot ${idx === 0 ? 'edu-dot--pulse' : ''}"></div>
              <div class="edu-connector"></div>
            </div>
            <div class="edu-content">
              <span class="edu-degree">${escapeHTML(ed.degree)}</span>
              <h3 class="edu-institution">${escapeHTML(ed.institution)}</h3>
              <p class="edu-detail">${escapeHTML(ed.detail || '')}</p>
              ${Array.isArray(ed.tags) && ed.tags.length ? `
                <div class="edu-tags">
                  ${ed.tags.map(t => `<span class="tag-sm">${escapeHTML(t)}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('');
      }
    }

    // Certificates
    const certsSection = document.getElementById('certificates');
    const certsLinks = document.querySelectorAll('a[href*="#certificates"], a[href*="#kredensial"]');
    const hasCerts = Array.isArray(data.certificates) && data.certificates.length > 0;
    if (certsSection) certsSection.style.display = '';
    certsLinks.forEach(l => l.style.display = '');

    const certsGrid = document.querySelector('.certs-grid-editorial');
    if (certsGrid) {
      if (!hasCerts) {
        certsGrid.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); grid-column: 1 / -1; width: 100%;"><p>Belum ada sertifikat atau lisensi kredensial.</p></div>`;
      } else {
        certsGrid.innerHTML = data.certificates.map(c => `
          <div class="cert-card reveal-up visible">
            <div class="cert-card-top">
              <span class="cert-year">${escapeHTML(c.year || '')}</span>
              <span class="cert-verified">✦ Verified</span>
            </div>
            <h3 class="cert-title">${escapeHTML(c.title)}</h3>
            <p class="cert-issuer">${escapeHTML(c.issuer)}</p>
            <p class="cert-desc">${escapeHTML(c.desc || '')}</p>
            ${Array.isArray(c.skills) && c.skills.length ? `
              <div class="cert-tags">
                ${c.skills.map(s => `<span class="cert-tag">${escapeHTML(s)}</span>`).join('')}
              </div>
            ` : ''}
            ${c.url ? `
              <div class="cert-card-footer">
                <a href="${escapeHTML(c.url)}" target="_blank" rel="noopener" class="cert-link">Verifikasi Kredensial <span>↗</span></a>
              </div>
            ` : ''}
          </div>
        `).join('');
      }
    }

    // Accent
    const accent = (data.three && data.three.accentColor) || (data.settings && data.settings.accent);
    if (accent) {
      document.documentElement.style.setProperty('--accent', accent);
      document.documentElement.style.setProperty('--accent-2', accent);
    }
  } catch (err) {
    console.warn('Gagal menghidrasi data tentang:', err);
  }
}

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initHeroLoad();
  initReveal();
  initCounters();
  initContactCanvas();
  initToolboxInteractions();
  initTimeline();
  initContactForm();
  initScrollSpy();
  initCertTilt();
  hydrateAbout();

  // Real-time synchronization
  if (typeof PortfolioAPI !== 'undefined' && PortfolioAPI.onUpdate) {
    PortfolioAPI.onUpdate(() => {
      hydrateAbout();
    });
  }
});
