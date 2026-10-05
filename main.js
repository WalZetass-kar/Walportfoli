/* ═══════════════════════════════════════════════════════════
   WalZetass Portfolio — main.js
   Three.js Background · Scroll Animations · Interactions
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ───────────────────────────────────────────────
   1. THREE.JS ABSTRACT BACKGROUND
─────────────────────────────────────────────── */
/* ───────────────────────────────────────────────
   1. GENERATIVE CONSTELLATION & WIREFRAME BACKGROUND
   Sophisticated, handcrafted canvas engine with fine circular dots,
   organic proximity network hairlines, and 3D wireframe geometric meshes.
─────────────────────────────────────────────── */
(function initConstellationBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let animId = null;
  let isTabActive = true;

  // Mouse & Parallax tracking
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  let particles = [];
  let numParticles = 75;
  let maxConnectionDistance = 135;

  // ── 3D Abstract Wireframe Geometry Projection ──
  // Golden ratio for Icosahedron
  const phi = (1 + Math.sqrt(5)) / 2;
  const icoRawVertices = [
    [-1,  phi,  0], [ 1,  phi,  0], [-1, -phi,  0], [ 1, -phi,  0],
    [ 0, -1,  phi], [ 0,  1,  phi], [ 0, -1, -phi], [ 0,  1, -phi],
    [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
  ];
  const icoVertices = icoRawVertices.map(([x, y, z]) => {
    const len = Math.hypot(x, y, z);
    return [x / len, y / len, z / len];
  });
  const icoEdges = [
    [0,11],[0,5],[0,1],[0,7],[0,10],
    [1,5],[1,7],[1,8],[1,9],
    [2,11],[2,10],[2,4],[2,6],[2,3],
    [3,4],[3,6],[3,8],[3,9],
    [4,5],[4,11],[4,9],
    [5,9],[5,11],
    [6,7],[6,10],[6,8],
    [7,8],[7,10],
    [8,9],
    [10,11]
  ];

  // Octahedron wireframe
  const octVertices = [
    [ 1,  0,  0], [-1,  0,  0],
    [ 0,  1,  0], [ 0, -1,  0],
    [ 0,  0,  1], [ 0,  0, -1]
  ];
  const octEdges = [
    [0,2],[2,1],[1,3],[3,0],
    [0,4],[1,4],[2,4],[3,4],
    [0,5],[1,5],[2,5],[3,5]
  ];

  // Subtle floating 3D objects
  const meshIco = {
    rx: 0.15, ry: 0.25, rz: 0.05,
    speedX: 0.0016, speedY: 0.0022,
    size: 135,
    screenX: 0.82, screenY: 0.28
  };
  const meshOct = {
    rx: 0.45, ry: 0.12, rz: 0.35,
    speedX: -0.0014, speedY: 0.0018,
    size: 80,
    screenX: 0.14, screenY: 0.72
  };

  function project3D(v, rx, ry, rz, scale, cx, cy) {
    const [x, y, z] = v;

    // Rotate X
    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;

    // Rotate Y
    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const x2 = x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;

    // Rotate Z
    const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
    const x3 = x2 * cosZ - y1 * sinZ;
    const y3 = x2 * sinZ + y1 * cosZ;

    // Perspective projection
    const fov = 380;
    const distance = 420;
    const pz = z2 + distance;
    const projScale = fov / pz;

    return {
      x: cx + x3 * scale * projScale,
      y: cy + y3 * scale * projScale,
      z: z2
    };
  }

  function drawWireframe(vertices, edges, mesh, colorRgb, baseAlpha) {
    const cx = width * mesh.screenX + mouse.x * 24;
    const cy = height * mesh.screenY + mouse.y * 24;
    const projected = vertices.map(v => project3D(v, mesh.rx, mesh.ry, mesh.rz, mesh.size, cx, cy));

    ctx.strokeStyle = `rgba(${colorRgb}, ${baseAlpha})`;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    for (let i = 0; i < edges.length; i++) {
      const [i1, i2] = edges[i];
      const p1 = projected[i1];
      const p2 = projected[i2];
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
    }
    ctx.stroke();

    // Subtle vertex pins
    ctx.fillStyle = `rgba(${colorRgb}, ${baseAlpha * 1.6})`;
    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Generative Organic Particles ──
  function createParticles() {
    particles = [];
    const numClusters = Math.max(3, Math.floor(numParticles / 14));
    const clusters = [];
    for (let c = 0; c < numClusters; c++) {
      clusters.push({
        x: Math.random() * width,
        y: Math.random() * height,
        spreadX: 180 + Math.random() * 260,
        spreadY: 140 + Math.random() * 220,
      });
    }

    for (let i = 0; i < numParticles; i++) {
      const cluster = clusters[i % numClusters];
      const isField = Math.random() < 0.28;
      const x = isField
        ? Math.random() * width
        : (cluster.x + (Math.random() - 0.5) * cluster.spreadX + width) % width;
      const y = isField
        ? Math.random() * height
        : (cluster.y + (Math.random() - 0.5) * cluster.spreadY + height) % height;

      // Fine, diverse radii: 0.8px to 2.2px
      const r = Math.random() * 1.3 + 0.8;
      // Subdued opacity: 0.12 to 0.32
      const baseAlpha = Math.random() * 0.20 + 0.12;
      // Warm editorial palette
      const isWarmCream = Math.random() > 0.45;
      const color = isWarmCream ? '200, 184, 154' : '244, 241, 234';

      particles.push({
        x,
        y,
        r,
        baseAlpha,
        color,
        // Smooth, very slow drift
        vx: (Math.random() - 0.5) * 0.26,
        vy: (Math.random() - 0.5) * 0.22,
        pulseOffset: Math.random() * Math.PI * 2,
        pulseSpeed: 0.007 + Math.random() * 0.012,
        screenX: x,
        screenY: y,
      });
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Responsive scaling
    if (width < 480) {
      numParticles = 20;
      maxConnectionDistance = 75;
      meshIco.size = 65;
      meshOct.size = 40;
    } else if (width < 768) {
      numParticles = 30;
      maxConnectionDistance = 90;
      meshIco.size = 85;
      meshOct.size = 50;
    } else if (width < 1024) {
      numParticles = 52;
      maxConnectionDistance = 115;
      meshIco.size = 110;
      meshOct.size = 65;
    } else {
      numParticles = 78;
      maxConnectionDistance = 135;
      meshIco.size = 135;
      meshOct.size = 80;
    }

    createParticles();
  }

  // Smooth mouse movement listener
  window.addEventListener('mousemove', (e) => {
    mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // Tab visibility handling for power saving
  document.addEventListener('visibilitychange', () => {
    isTabActive = !document.hidden;
    if (isTabActive && !animId) {
      loop();
    }
  });

  window.addEventListener('resize', resize, { passive: true });

  // Main rendering loop
  function render() {
    ctx.clearRect(0, 0, width, height);

    // Parallax easing
    mouse.x += (mouse.targetX - mouse.x) * 0.035;
    mouse.y += (mouse.targetY - mouse.y) * 0.035;
    const parallaxX = mouse.x * 16;
    const parallaxY = mouse.y * 16;

    // 1. Subtle 3D Wireframe Meshes
    meshIco.rx += meshIco.speedX;
    meshIco.ry += meshIco.speedY;
    drawWireframe(icoVertices, icoEdges, meshIco, '200, 184, 154', 0.07);

    meshOct.rx += meshOct.speedX;
    meshOct.ry += meshOct.speedY;
    drawWireframe(octVertices, octEdges, meshOct, '244, 241, 234', 0.05);

    // 2. Update & render particle dots
    const pCount = particles.length;
    for (let i = 0; i < pCount; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.pulseOffset += p.pulseSpeed;

      // Wrap-around edges
      if (p.x < -30) p.x = width + 30;
      else if (p.x > width + 30) p.x = -30;
      if (p.y < -30) p.y = height + 30;
      else if (p.y > height + 30) p.y = -30;

      // Parallax-adjusted screen coordinates
      p.screenX = p.x + parallaxX * (p.r / 1.5);
      p.screenY = p.y + parallaxY * (p.r / 1.5);

      const dynamicAlpha = p.baseAlpha * (0.85 + Math.sin(p.pulseOffset) * 0.15);

      // Fine circular dot
      ctx.beginPath();
      ctx.arc(p.screenX, p.screenY, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${dynamicAlpha})`;
      ctx.fill();
    }

    // 3. Proximity connecting hairline lines
    ctx.lineWidth = 0.5;
    for (let i = 0; i < pCount; i++) {
      const p1 = particles[i];
      for (let j = i + 1; j < pCount; j++) {
        const p2 = particles[j];
        const dx = p1.screenX - p2.screenX;
        const dy = p1.screenY - p2.screenY;
        const dist = Math.hypot(dx, dy);

        if (dist < maxConnectionDistance) {
          // Quadratic soft alpha fade
          const lineAlpha = (1 - dist / maxConnectionDistance) * 0.09;
          ctx.strokeStyle = `rgba(200, 184, 154, ${lineAlpha})`;
          ctx.beginPath();
          ctx.moveTo(p1.screenX, p1.screenY);
          ctx.lineTo(p2.screenX, p2.screenY);
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    if (!isTabActive) {
      animId = null;
      return;
    }
    render();
    animId = requestAnimationFrame(loop);
  }

  resize();
  loop();
})();

/* ───────────────────────────────────────────────
   2. NAVIGATION SCROLL EFFECT
─────────────────────────────────────────────── */
(function initNav() {
  const nav = document.getElementById('nav');
  let lastY = 0;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 40);
    lastY = y;
  }, { passive: true });
})();

/* ───────────────────────────────────────────────
   3. MOBILE MENU
─────────────────────────────────────────────── */
(function initMobileMenu() {
  const btn  = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  const links = document.querySelectorAll('.mobile-link');

  if (!btn || !menu) return;

  function toggle() {
    const open = menu.classList.toggle('open');
    btn.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.style.touchAction = open ? 'none' : '';
  }

  function closeMenu() {
    menu.classList.remove('open');
    btn.classList.remove('open');
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
  }

  btn.addEventListener('click', toggle);

  links.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
    }
  });
})();

/* ───────────────────────────────────────────────
   4. SCROLL REVEAL
─────────────────────────────────────────────── */
(function initReveal() {
  let observer = null;
  try {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px',
    });
  } catch (e) {
    console.warn('[Reveal] IntersectionObserver not available:', e);
  }

  window.observeDynamicReveals = function(container = document) {
    if (!observer) {
      container.querySelectorAll('.reveal-up, .reveal-fade').forEach(el => el.classList.add('visible'));
      return;
    }
    const els = container.querySelectorAll('.reveal-up:not(.visible), .reveal-fade:not(.visible)');
    els.forEach((el) => {
      const siblings = el.parentElement?.querySelectorAll('.reveal-up, .reveal-fade');
      if (siblings) {
        const idx = Array.from(siblings).indexOf(el);
        el.dataset.delay = idx * 60;
      }
      observer.observe(el);
    });
  };

  window.observeDynamicReveals(document);
})();

/* ───────────────────────────────────────────────
   5. SKILL BAR ANIMATION
─────────────────────────────────────────────── */
(function initSkillBars() {
  const fills = document.querySelectorAll('.skill-fill');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const w  = el.dataset.w || '0';
        setTimeout(() => { el.style.width = w + '%'; }, 200);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  fills.forEach(f => observer.observe(f));
})();

/* ───────────────────────────────────────────────
   6. CUSTOM CURSOR
─────────────────────────────────────────────── */
(function initCursor() {
  // Skip on touch / mobile
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const cursor = document.createElement('div');
  cursor.className = 'cursor';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';

  document.body.appendChild(cursor);
  document.body.appendChild(ring);

  let cx = -100, cy = -100;
  let rx = -100, ry = -100;

  document.addEventListener('mousemove', (e) => {
    cx = e.clientX; cy = e.clientY;
    cursor.style.left = cx + 'px';
    cursor.style.top  = cy + 'px';
  });

  // Lag ring
  function animateCursor() {
    rx += (cx - rx) * 0.12;
    ry += (cy - ry) * 0.12;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  // Hover effect
  const hovers = document.querySelectorAll('a, button, .project-card, .cert-item');
  hovers.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('hover');
      ring.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('hover');
      ring.classList.remove('hover');
    });
  });
})();

/* ───────────────────────────────────────────────
   7. CONTACT FORM (demo)
─────────────────────────────────────────────── */
(function initContactForm() {
  const form   = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = form.querySelector('.btn-primary');
    const txt = btn ? btn.querySelector('.btn-text') : null;

    const name = form.name ? form.name.value.trim() : '';
    const email = form.email ? form.email.value.trim() : '';
    const project = form.project ? form.project.value.trim() : '';
    const message = form.message ? form.message.value.trim() : '';

    if (!name || !email || !message) {
      status.textContent = '⚠ Harap lengkapi semua kolom yang wajib diisi.';
      status.style.color = '#f0a070';
      return;
    }

    if (btn) btn.disabled = true;
    if (txt) txt.textContent = 'Mengirim…';
    status.textContent = '';

    try {
      if (typeof PortfolioAPI !== 'undefined' && PortfolioAPI.sendContact) {
        await PortfolioAPI.sendContact({ name, email, project, message });
      } else {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, project, message })
        });
        if (!res.ok) throw new Error('Gagal mengirim pesan');
      }
      status.textContent = '✓ Pesan terkirim. Saya akan segera menghubungi Anda.';
      status.style.color = '#5fdb6f';
      form.reset();
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
      status.textContent = '✕ Gagal mengirim pesan: ' + (err.message || 'Koneksi bermasalah');
      status.style.color = '#ff6b6b';
    } finally {
      if (btn) btn.disabled = false;
      if (txt) txt.textContent = 'Kirim Pesan';
      setTimeout(() => { status.textContent = ''; }, 6000);
    }
  });
})();

/* ───────────────────────────────────────────────
   8. SMOOTH LINK HOVER — letter spacing
─────────────────────────────────────────────── */
(function initNavHover() {
  const links = document.querySelectorAll('.nav-links a');
  links.forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.style.letterSpacing = '0.06em';
    });
    link.addEventListener('mouseleave', () => {
      link.style.letterSpacing = '0.02em';
    });
  });
})();

/* ───────────────────────────────────────────────
   9. ACTIVE SECTION NAV HIGHLIGHT
─────────────────────────────────────────────── */
/* ───────────────────────────────────────────────
   9. ACTIVE SECTION NAV HIGHLIGHT (SCROLLSPY)
─────────────────────────────────────────────── */
(function initActiveSection() {
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
  const sections = Array.from(document.querySelectorAll('section[id]'));

  if (!sections.length || !navLinks.length) return;

  function updateActiveNav() {
    const scrollPos = window.scrollY + 160;
    let currentId = '';

    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = sec.getAttribute('id');
        break;
      }
    }

    // Default to first section if at top
    if (!currentId && window.scrollY < 200 && sections.length) {
      currentId = sections[0].getAttribute('id');
    }

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isMatch = href === `#${currentId}`;
      link.classList.toggle('active', isMatch);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  window.addEventListener('resize', updateActiveNav, { passive: true });
  updateActiveNav();
})();

/* ───────────────────────────────────────────────
   9B. ONE-CLICK EMAIL COPY MICRO-INTERACTION
─────────────────────────────────────────────── */
(function initCopyEmail() {
  const btn = document.getElementById('copyEmailBtn');
  const textEl = document.getElementById('contactEmailDisplay');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const email = textEl ? textEl.textContent.trim() : 'mihwalmaulana09@gmail.com';
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const ta = document.createElement('textarea');
        ta.value = email;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      const prev = btn.textContent;
      btn.textContent = '✓ Tersalin!';
      btn.style.background = 'var(--accent)';
      btn.style.color = 'var(--bg)';
      setTimeout(() => {
        btn.textContent = prev;
        btn.style.background = '';
        btn.style.color = '';
      }, 2400);
    } catch (e) {
      console.warn('Gagal menyalin email:', e);
    }
  });
})();

/* ───────────────────────────────────────────────
   10. HERO TEXT — stagger on load
─────────────────────────────────────────────── */
(function initHeroLoad() {
  const heroEls = document.querySelectorAll('#hero .reveal-up, #hero .reveal-fade');
  heroEls.forEach((el, i) => {
    setTimeout(() => {
      el.classList.add('visible');
    }, 200 + i * 120);
  });
})();

/* ───────────────────────────────────────────────
   11. DYNAMIC PORTFOLIO DATA & LIVE SYNC
─────────────────────────────────────────────── */
(function initDynamicPortfolio() {
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatHeading(raw) {
    if (!raw) return '';
    if (raw.includes('<br>') || raw.includes('<em>')) {
      return escapeHTML(raw)
        .replace(/&lt;br\s*\/?&gt;/gi, '<br>')
        .replace(/&lt;em&gt;/gi, '<em>')
        .replace(/&lt;\/em&gt;/gi, '</em>');
    }
    const parts = raw.trim().split(/\s+/);
    if (parts.length > 1) {
      const first = parts.slice(0, parts.length - 1).join(' ');
      const last = parts[parts.length - 1];
      return `${escapeHTML(first)}<br><em>${escapeHTML(last)}</em>`;
    }
    return `<em>${escapeHTML(raw)}</em>`;
  }

  function renderPortfolio(data) {
    if (!data) return;
    const { profile, landing, projects, skills, experience, education, certificates, sections, three, seo, social, settings } = data;

    // Derived states
    const publishedProjects = (projects || []).filter(p => p.status !== 'draft');
    const hasProjects = publishedProjects.length > 0;
    const hasSkills = Array.isArray(skills) && skills.length > 0;
    // Combine experience + education for the "Perjalanan" section
    const allTimeline = [
      ...(Array.isArray(experience) ? experience.map(e => ({ ...e, _type: 'exp' })) : []),
      ...(Array.isArray(education) ? education.map(e => ({ ...e, _type: 'edu', role: e.degree, company: e.institution, desc: e.detail || '', period: e.period })) : [])
    ];
    const hasExp = allTimeline.length > 0;
    const hasCerts = Array.isArray(certificates) && certificates.length > 0;

    // 1. Profile & Avatar
    if (profile) {
      let av = profile.avatar || 'assets/profil.png';
      if (av.startsWith('/') && !av.startsWith('//')) av = av.slice(1);
      const heroPortrait = document.getElementById('heroPortraitImg') || document.querySelector('.portrait-img img');
      if (heroPortrait) {
        heroPortrait.src = av;
      }

      const heroName = document.querySelector('.hero-name');
      if (heroName) {
        const titleRaw = (landing && landing.hero && landing.hero.title) || profile.name || '';
        heroName.innerHTML = formatHeading(titleRaw);
      }

      const heroRole = document.querySelector('.hero-role');
      if (heroRole) {
        const roleRaw = (landing && landing.hero && landing.hero.role) || profile.title || '';
        heroRole.innerHTML = escapeHTML(roleRaw).replace(/<br\s*\/?>/gi, '<br>');
      }

      const heroBio = document.querySelector('#hero .hero-desc, #hero .hero-bio, .hero-desc, .hero-bio');
      if (heroBio) {
        heroBio.textContent = (landing && landing.hero && landing.hero.bio) || profile.bio || '';
      }

      if (profile.location) {
        const locTag = document.querySelector('.portrait-tag .tag-mono');
        if (locTag) locTag.textContent = profile.location;
      }
    }

    // 2. Hero Section
    if (landing && landing.hero) {
      const heroEl = document.getElementById('hero');
      if (heroEl) heroEl.style.display = landing.hero.enabled !== false ? '' : 'none';
      const eyebrow = document.querySelector('#hero .hero-eyebrow');
      if (eyebrow) {
        if (landing.hero.eyebrow && landing.hero.eyebrow.trim()) {
          eyebrow.style.display = '';
          eyebrow.innerHTML = `<span class="dot"></span> ${escapeHTML(landing.hero.eyebrow)}`;
        } else {
          eyebrow.style.display = 'none';
        }
      }

      const b1 = document.querySelector('#hero .hero-actions .btn-primary');
      if (b1) {
        b1.style.display = '';
        b1.textContent = landing.hero.btn1Text || 'Lihat Karya Pilihan →';
        b1.href = landing.hero.btn1Link || '#projects';
      }

      const b2 = document.querySelector('#hero .hero-actions .btn-ghost');
      if (b2) {
        b2.style.display = '';
        b2.textContent = landing.hero.btn2Text || 'Hubungi Saya';
        b2.href = landing.hero.btn2Link || '#contact';
      }
    }

    // Hero Meta Row Statistics (from landing.about or landing.hero)
    const metaRow = document.querySelector('.hero-meta-row');
    if (metaRow) {
      const s1Num = (landing && landing.about && landing.about.stat1Num) || (landing && landing.hero && landing.hero.stat1Num) || '';
      const s1Lbl = (landing && landing.about && landing.about.stat1Label) || (landing && landing.hero && landing.hero.stat1Label) || '';
      const s2Num = (landing && landing.about && landing.about.stat2Num) || (landing && landing.hero && landing.hero.stat2Num) || '';
      const s2Lbl = (landing && landing.about && landing.about.stat2Label) || (landing && landing.hero && landing.hero.stat2Label) || '';
      const s3Num = (landing && landing.about && landing.about.stat3Num) || (landing && landing.hero && landing.hero.stat3Num) || '';
      const s3Lbl = (landing && landing.about && landing.about.stat3Label) || (landing && landing.hero && landing.hero.stat3Label) || '';

      const hasStats = Boolean((s1Num && s1Num.trim()) || (s2Num && s2Num.trim()) || (s3Num && s3Num.trim()));
      if (!hasStats) {
        metaRow.style.display = 'none';
      } else {
        metaRow.style.display = '';
        const items = metaRow.querySelectorAll('.hero-meta-item');
        if (items[0]) {
          items[0].style.display = (s1Num && s1Num.trim()) ? '' : 'none';
          const v = items[0].querySelector('.hero-meta-value');
          const l = items[0].querySelector('.hero-meta-label');
          if (v) v.textContent = s1Num;
          if (l) l.textContent = s1Lbl;
        }
        if (items[1]) {
          items[1].style.display = (s2Num && s2Num.trim()) ? '' : 'none';
          const v = items[1].querySelector('.hero-meta-value');
          const l = items[1].querySelector('.hero-meta-label');
          if (v) v.textContent = s2Num;
          if (l) l.textContent = s2Lbl;
        }
        if (items[2]) {
          items[2].style.display = (s3Num && s3Num.trim()) ? '' : 'none';
          const v = items[2].querySelector('.hero-meta-value');
          const l = items[2].querySelector('.hero-meta-label');
          if (v) v.textContent = s3Num;
          if (l) l.textContent = s3Lbl;
        }
      }
    }

    // Marquee
    const marqueeEl = document.getElementById('marquee') || document.querySelector('.marquee-wrap');
    if (marqueeEl) {
      const rawText = (landing && landing.marquee && landing.marquee.text) ? landing.marquee.text.trim() : '';
      const isMarqueeEnabled = landing && landing.marquee ? landing.marquee.enabled !== false : false;
      if (!rawText || !isMarqueeEnabled) {
        marqueeEl.style.display = 'none';
      } else {
        marqueeEl.style.display = '';
        const track = marqueeEl.querySelector('.marquee-track');
        if (track) {
          const rawItems = rawText.split(/[·✦•|]/).map(s => s.trim()).filter(Boolean);
          if (rawItems.length) {
            const fullItems = [...rawItems, ...rawItems];
            track.innerHTML = fullItems.map(item => `<span>${escapeHTML(item)}</span><span class="marquee-dot">✦</span>`).join('');
          }
        }
      }
    }

    // About Section
    if (landing && landing.about) {
      const aboutEl = document.getElementById('about');
      if (aboutEl) aboutEl.style.display = landing.about.enabled !== false ? '' : 'none';
      const lbl = document.querySelector('#about .section-label');
      if (lbl) lbl.textContent = landing.about.label || '02 — Tentang';
      const head = document.querySelector('#about .section-heading');
      if (head) head.innerHTML = formatHeading(landing.about.headline || 'Rekayasa sistem<br>yang <em>berdaya guna</em>');

      const paragraphs = document.querySelectorAll('#about .about-right p.about-text');
      if (paragraphs.length >= 1) {
        const t1 = landing.about.text1 || (profile && profile.longbio) || '';
        paragraphs[0].innerHTML = escapeHTML(t1)
          .replace(/&lt;strong&gt;/gi, '<strong>')
          .replace(/&lt;\/strong&gt;/gi, '</strong>')
          .replace(/&lt;em&gt;/gi, '<em>')
          .replace(/&lt;\/em&gt;/gi, '</em>');
      }
      if (paragraphs.length >= 2) {
        paragraphs[1].textContent = landing.about.text2 || '';
      }

      const statsWrap = document.querySelector('#about .about-stats');
      if (statsWrap) {
        const s1Num = landing.about.stat1Num || '';
        const s1Lbl = landing.about.stat1Label || '';
        const s2Num = landing.about.stat2Num || '';
        const s2Lbl = landing.about.stat2Label || '';
        const s3Num = landing.about.stat3Num || '';
        const s3Lbl = landing.about.stat3Label || '';
        const hasAboutStats = Boolean((s1Num && s1Num.trim()) || (s2Num && s2Num.trim()) || (s3Num && s3Num.trim()));

        if (!hasAboutStats) {
          statsWrap.style.display = 'none';
        } else {
          statsWrap.style.display = '';
          const stats = statsWrap.querySelectorAll('.stat');
          if (stats[0]) {
            stats[0].style.display = (s1Num && s1Num.trim()) ? '' : 'none';
            const num = stats[0].querySelector('.stat-number');
            const slbl = stats[0].querySelector('.stat-label');
            if (num) num.textContent = s1Num;
            if (slbl) slbl.textContent = s1Lbl;
          }
          if (stats[1]) {
            stats[1].style.display = (s2Num && s2Num.trim()) ? '' : 'none';
            const num = stats[1].querySelector('.stat-number');
            const slbl = stats[1].querySelector('.stat-label');
            if (num) num.textContent = s2Num;
            if (slbl) slbl.textContent = s2Lbl;
          }
          if (stats[2]) {
            stats[2].style.display = (s3Num && s3Num.trim()) ? '' : 'none';
            const num = stats[2].querySelector('.stat-number');
            const slbl = stats[2].querySelector('.stat-label');
            if (num) num.textContent = s3Num;
            if (slbl) slbl.textContent = s3Lbl;
          }
        }
      }
    }

    // Projects Section & Navigation
    const projEl = document.getElementById('projects');
    const projNavLinks = document.querySelectorAll('a[href="#projects"], a[href="projects.html"]');
    const isProjEnabled = !landing || !landing.projects || landing.projects.enabled !== false;

    if (!isProjEnabled) {
      if (projEl) projEl.style.display = 'none';
      projNavLinks.forEach(l => l.style.display = 'none');
    } else {
      if (projEl) projEl.style.display = '';
      projNavLinks.forEach(l => l.style.display = '');

      if (landing && landing.projects) {
        const lbl = document.querySelector('#projects .section-label');
        if (lbl) lbl.textContent = landing.projects.label || '03 — Karya Pilihan';
        const head = document.querySelector('#projects .section-heading');
        if (head) head.innerHTML = formatHeading(landing.projects.headline || 'Showcase<br><em>Proyek Nyata</em>');
        const btn = document.querySelector('#projects .projects-header .btn-ghost, #projects .btn-ghost');
        if (btn) {
          btn.textContent = landing.projects.btnText || 'Lihat Arsip Lengkap →';
          if (landing.projects.btnLink) btn.href = landing.projects.btnLink;
        }
      }

      const listContainer = document.getElementById('projectListContainer') || document.querySelector('.project-showcase, .project-list');
      if (listContainer) {
        listContainer.className = 'project-showcase';
        if (!hasProjects) {
          listContainer.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); width: 100%;"><p>Belum ada karya yang dipublikasikan.</p></div>`;
        } else {
          listContainer.innerHTML = publishedProjects.map((p, idx) => {
          const num = p.num || String(idx + 1).padStart(2, '0');
          const cat = p.category ? p.category.toUpperCase() : 'WEB APPLICATION';
          const year = p.year || '2024';
          const tags = Array.isArray(p.stack) ? p.stack : [];
          const slugOrId = p.slug || p.id;
          const cover = p.cover || `assets/mockups/${p.slug || 'ecommerce'}-main.svg`;

          let resultText = '';
          if (Array.isArray(p.results) && p.results.length) {
            resultText = `${p.results[0].num} ${p.results[0].label}`;
          } else if (p.tagline) {
            resultText = p.tagline;
          }

          return `
          <article class="project-showcase-item reveal-up">
            <div class="showcase-content">
              <div class="showcase-meta">
                <span class="showcase-index">${escapeHTML(num)} // ${escapeHTML(cat)}</span>
                <span class="showcase-year">${escapeHTML(year)}</span>
              </div>
              <h3 class="showcase-title">${escapeHTML(p.titlePlain || p.title)}</h3>
              <p class="showcase-tagline">${escapeHTML(p.desc || p.tagline || '')}</p>
              ${resultText ? `<div class="showcase-result-badge"><span>✦</span> ${escapeHTML(resultText)}</div>` : ''}
              <div class="showcase-tags">
                ${tags.map(t => `<span class="showcase-tag">${escapeHTML(t)}</span>`).join('')}
              </div>
              <a href="project-detail.html?id=${encodeURIComponent(slugOrId)}" class="showcase-action">
                Lihat Detail Proyek <span>→</span>
              </a>
            </div>
            <div class="showcase-visual">
              <a href="project-detail.html?id=${encodeURIComponent(slugOrId)}" class="showcase-mockup-frame" aria-label="Lihat Detail ${escapeHTML(p.titlePlain || p.title)}">
                <img src="${escapeHTML(cover)}" alt="Preview ${escapeHTML(p.titlePlain || p.title)}" class="${cover.endsWith('icon.png') ? 'contain-fit' : ''}" loading="lazy" onerror="this.onerror=null;this.src='assets/mockups/ecommerce-main.svg'" />
                <span class="mockup-corner-badge">${escapeHTML(cat)}</span>
              </a>
            </div>
          </article>`;
        }).join('');
        }
      }
    }

    // Skills Section & Navigation
    const skillsEl = document.getElementById('skills');
    const skillsNavLinks = document.querySelectorAll('a[href="#skills"]');
    const isSkillsEnabled = !landing || !landing.skills || landing.skills.enabled !== false;

    if (!isSkillsEnabled) {
      if (skillsEl) skillsEl.style.display = 'none';
      skillsNavLinks.forEach(l => l.style.display = 'none');
    } else {
      if (skillsEl) skillsEl.style.display = '';
      skillsNavLinks.forEach(l => l.style.display = '');

      if (landing && landing.skills) {
        const lbl = document.querySelector('#skills .section-label');
        if (lbl) lbl.textContent = landing.skills.label || '04 — Keahlian';
        const head = document.querySelector('#skills .section-heading');
        if (head) head.innerHTML = formatHeading(landing.skills.headline || 'Alat &<br><em>Teknologi Nyata</em>');
        const intro = document.querySelector('#skills .skills-intro');
        if (intro) intro.textContent = landing.skills.intro || '';
      }

      const skillsRight = document.getElementById('skillsContainer') || document.querySelector('.skills-right');
      if (skillsRight) {
        if (!hasSkills) {
          skillsRight.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); width: 100%;"><p>Belum ada alat atau teknologi yang ditambahkan.</p></div>`;
        } else {
          const cats = {};
          skills.forEach(s => {
          const c = s.category || 'General';
          if (!cats[c]) cats[c] = [];
          cats[c].push(s.name);
        });

        skillsRight.innerHTML = `
          <div class="skills-categories-grid">
            ${Object.entries(cats).map(([catName, skillNames], idx) => `
              <div class="skills-category-col reveal-up">
                <div class="category-header">
                  <span class="category-title">${String(idx + 1).padStart(2, '0')} // ${escapeHTML(catName)}</span>
                  <span class="category-count">${skillNames.length} Alat</span>
                </div>
                <div class="skills-chips-wrap">
                  ${skillNames.map(name => `<span class="skill-item">${escapeHTML(name)}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `;
        }
      }
    }

    // Experience Section & Navigation
    const expEl = document.getElementById('experience');
    const expNavLinks = document.querySelectorAll('a[href="#experience"]');
    const isExpEnabled = !landing || !landing.experience || landing.experience.enabled !== false;

    if (!isExpEnabled) {
      if (expEl) expEl.style.display = 'none';
      expNavLinks.forEach(l => l.style.display = 'none');
    } else {
      if (expEl) expEl.style.display = '';
      expNavLinks.forEach(l => l.style.display = '');

      if (landing && landing.experience) {
        const lbl = document.querySelector('#experience .section-label');
        if (lbl) lbl.textContent = landing.experience.label || '05 — Jejak Perjalanan';
        const head = document.querySelector('#experience .section-heading');
        if (head) head.innerHTML = formatHeading(landing.experience.headline || 'Pendidikan &<br><em>Kontribusi</em>');
      }

      const timeline = document.getElementById('timelineContainer') || document.querySelector('#experience .timeline-wrap, #experience .timeline');
      if (timeline) {
        timeline.className = 'timeline-wrap';
        if (!hasExp) {
          timeline.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); width: 100%;"><p>Belum ada riwayat pengalaman pendidikan atau organisasi.</p></div>`;
        } else {
          timeline.innerHTML = allTimeline.map((exp, idx) => `
          <div class="timeline-item ${exp.current || idx === 0 ? 'current' : ''} reveal-up">
            <div class="timeline-marker">
              <div class="timeline-marker-dot"></div>
            </div>
            <div class="timeline-date-col">
              <span class="timeline-period">${escapeHTML(exp.period || '')}</span>
              <span class="timeline-type-badge">${escapeHTML(exp._type === 'edu' ? (exp.gpa ? 'GPA ' + exp.gpa : 'Pendidikan') : (exp.type || 'Penuh waktu'))}</span>
            </div>
            <div class="timeline-body">
              <h3 class="timeline-role-title">${escapeHTML(exp.role || exp.degree || '')}</h3>
              <p class="timeline-company-line">${escapeHTML(exp.company || exp.institution || '')}${exp.location ? ' · ' + escapeHTML(exp.location) : ''}</p>
              <p class="timeline-description">${escapeHTML(exp.desc || exp.detail || '')}</p>
              ${Array.isArray(exp.highlights) && exp.highlights.length ? `
                <div class="timeline-highlights">
                  ${exp.highlights.map(h => `<span class="timeline-pill">${escapeHTML(h)}</span>`).join('')}
                </div>
              ` : ''}
              ${Array.isArray(exp.tags) && exp.tags.length ? `
                <div class="timeline-highlights">
                  ${exp.tags.map(t => `<span class="timeline-pill">${escapeHTML(t)}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('');
        }
      }
    }

    // Certificates Section & Navigation
    const certsEl = document.getElementById('certificates');
    const certsNavLinks = document.querySelectorAll('a[href="#certificates"]');
    const isCertsEnabled = !landing || !landing.certs || landing.certs.enabled !== false;

    if (!isCertsEnabled) {
      if (certsEl) certsEl.style.display = 'none';
      certsNavLinks.forEach(l => l.style.display = 'none');
    } else {
      if (certsEl) certsEl.style.display = '';
      certsNavLinks.forEach(l => l.style.display = '');

      if (landing && landing.certs) {
        const lbl = document.querySelector('#certificates .section-label');
        if (lbl) lbl.textContent = landing.certs.label || '06 — Pembelajaran & Kredensial';
        const head = document.querySelector('#certificates .section-heading');
        if (head) head.innerHTML = formatHeading(landing.certs.headline || 'Validasi & <em>Sertifikasi Keahlian</em>');
      }

      const certsGrid = document.getElementById('certsContainer') || document.querySelector('#certificates .certs-gallery, #certificates .certs-grid');
      if (certsGrid) {
        certsGrid.className = 'certs-gallery';
        if (!hasCerts) {
          certsGrid.innerHTML = `<div class="empty-state" style="padding: 4rem 0; text-align: center; color: var(--text-dim); grid-column: 1 / -1; width: 100%;"><p>Belum ada sertifikat atau lisensi kredensial.</p></div>`;
        } else {
          certsGrid.innerHTML = certificates.map(c => `
          <article class="cert-card reveal-up">
            <div>
              <div class="cert-header">
                <span class="cert-id">${escapeHTML(c.credid || 'VERIFIED')}</span>
                <span class="cert-badge">✦ VERIFIED</span>
              </div>
              <div class="cert-main">
                <h3 class="cert-title">${escapeHTML(c.title)}</h3>
                <div class="cert-issuer-line">
                  <span>${escapeHTML(c.issuer)}</span>
                  <span>${escapeHTML(c.year)}</span>
                </div>
                <p class="cert-desc">${escapeHTML(c.desc || '')}</p>
                ${Array.isArray(c.skills) && c.skills.length ? `
                  <div class="cert-skills-wrap">
                    ${c.skills.map(s => `<span class="cert-skill-tag">${escapeHTML(s)}</span>`).join('')}
                  </div>
                ` : ''}
              </div>
            </div>
            <div class="cert-footer">
              <a href="${escapeHTML(c.url || '#')}" target="_blank" rel="noopener" class="cert-verify-link">Verifikasi Kredensial <span>↗</span></a>
            </div>
          </article>`).join('');
        }
      }
    }

    // Contact Section
    if (landing && landing.contact) {
      const contactEl = document.getElementById('contact');
      if (contactEl) contactEl.style.display = landing.contact.enabled !== false ? '' : 'none';
      const lbl = document.querySelector('#contact .section-label');
      if (lbl) lbl.textContent = landing.contact.label || '07 — Kontak & Kolaborasi';
      const head = document.querySelector('#contact .section-heading');
      if (head) head.innerHTML = formatHeading(landing.contact.headline || 'Mari bangun sesuatu yang <em>berdampak</em>');
      const sub = document.querySelector('#contact .contact-sub');
      if (sub) sub.textContent = landing.contact.sub || '';
    }

    // Dynamic Social Links & Contact Info
    const emailDisplay = document.getElementById('contactEmailDisplay');
    const contactSocials = document.getElementById('contactSocialsContainer') || document.querySelector('.contact-socials');
    const contactEmail = (landing && landing.contact && landing.contact.email) || (profile && profile.email) || 'mihwalmaulana09@gmail.com';
    if (emailDisplay) {
      emailDisplay.textContent = contactEmail;
    }
    // Update all mailto links across page
    document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
      a.href = `mailto:${contactEmail}`;
    });

    if (contactSocials) {
      const links = [];
      if (social && Array.isArray(social.links)) {
        social.links.filter(l => l.visible !== false && l.platform !== 'Email').forEach(l => {
          links.push(`<a href="${escapeHTML(l.url)}" target="_blank" rel="noopener" class="social-link"><span>${escapeHTML(l.platform)}</span><span>↗</span></a>`);
        });
      } else {
        if (profile && profile.github) links.push(`<a href="${escapeHTML(profile.github)}" target="_blank" rel="noopener" class="social-link"><span>GitHub</span><span>↗</span></a>`);
        if (profile && profile.linkedin) links.push(`<a href="${escapeHTML(profile.linkedin)}" target="_blank" rel="noopener" class="social-link"><span>LinkedIn</span><span>↗</span></a>`);
        if (profile && profile.twitter) links.push(`<a href="${escapeHTML(profile.twitter)}" target="_blank" rel="noopener" class="social-link"><span>Twitter / X</span><span>↗</span></a>`);
        if (profile && (profile.dribbble || profile.website)) {
          const otherUrl = profile.dribbble || profile.website;
          const otherLabel = otherUrl.includes('instagram') ? 'Instagram' : 'Website';
          links.push(`<a href="${escapeHTML(otherUrl)}" target="_blank" rel="noopener" class="social-link"><span>${otherLabel}</span><span>↗</span></a>`);
        }
      }
      if (contactEmail) {
        links.push(`<a href="mailto:${escapeHTML(contactEmail)}" class="social-link"><span>Kirim Email Langsung</span><span>↗</span></a>`);
      }
      if (links.length) {
        contactSocials.innerHTML = links.join('\n');
      }
    }

    // Dynamic Footer
    const footerLogo = document.querySelector('#footer .footer-logo');
    if (footerLogo) footerLogo.textContent = (profile && profile.handle) || 'WalZetass';
    const footerCopy = document.querySelector('#footer .footer-copy');
    if (footerCopy) {
      const year = new Date().getFullYear();
      const pName = (profile && profile.name) || 'M Ihwal Maulana';
      const pHandle = (profile && profile.handle) || 'WalZetass';
      footerCopy.textContent = `© ${year} ${pName} (${pHandle}). Hak cipta dilindungi.`;
    }
    const footerMono = document.querySelector('#footer .footer-mono');
    if (footerMono) {
      const pLoc = (profile && profile.location) || 'Pekanbaru · Indonesia';
      const pRole = (profile && profile.title) || 'Mahasiswa Manajemen Informatika';
      footerMono.textContent = `${pLoc} · ${pRole}`;
    }

    // Dynamic Accent & Settings
    const accent = (three && three.accentColor) || (settings && settings.accent);
    if (accent) {
      document.documentElement.style.setProperty('--accent', accent);
      document.documentElement.style.setProperty('--accent-2', accent);
    }

    // Dynamic Three.js Background Settings
    if (three && three.pages && three.pages.homepage) {
      const canvas = document.getElementById('bg-canvas');
      if (canvas && three.pages.homepage.opacity !== undefined) {
        canvas.style.opacity = (three.pages.homepage.opacity / 100).toString();
      }
    }

    // SEO & Meta
    if (seo && seo.pages && seo.pages.home) {
      const hSeo = seo.pages.home;
      if (hSeo.title) document.title = hSeo.title;
      if (hSeo.desc) {
        const mDesc = document.querySelector('meta[name="description"]');
        if (mDesc) mDesc.setAttribute('content', hSeo.desc);
      }
    }

    // Observe newly injected elements for smooth scroll reveal animations
    if (typeof window.observeDynamicReveals === 'function') {
      window.observeDynamicReveals(document);
    }
  }

  async function fetchAndRender() {
    try {
      if (typeof PortfolioAPI !== 'undefined') {
        const data = await PortfolioAPI.getPortfolio();
        renderPortfolio(data);
      } else {
        const res = await fetch('/api/portfolio');
        const json = await res.json();
        if (json.success && json.data) {
          renderPortfolio(json.data);
        }
      }
    } catch (err) {
      console.error('[Portfolio] Gagal memuat data dinamis:', err);
    }
  }

  // Initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAndRender);
  } else {
    fetchAndRender();
  }

  // Real-time synchronization
  if (typeof PortfolioAPI !== 'undefined' && PortfolioAPI.onUpdate) {
    PortfolioAPI.onUpdate(() => {
      fetchAndRender();
    });
  }

    try {
    const channel = new BroadcastChannel('wz_cms_channel');
    channel.onmessage = () => {
      fetchAndRender();
    };
  } catch (e) {}

  window.addEventListener('storage', (event) => {
    if (
      event.key === 'wz_cms_state' ||
      event.key === 'wz_portfolio_controls' ||
      event.key === 'cache_portfolio' ||
      event.key === 'cache_portfolio_update'
    ) {
      fetchAndRender();
    }
  });

  window.addEventListener('message', (event) => {
    if (
      event.data &&
      (event.data.type === 'WZ_CONTROLS_UPDATE' ||
        event.data.type === 'WZ_CMS_UPDATE' ||
        event.data.type === 'CMS_STATE_UPDATED')
    ) {
      fetchAndRender();
    }
  });
})();


