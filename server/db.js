/* ═══════════════════════════════════════════════════════════
   WalZetass Portfolio — server/db.js
   SQLite Database Models, Migrations, Seeding & CRUD Layer
   ═══════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'portfolio.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/* ─────────────────────────────────────────────────────────────
   DATABASE SCHEMA INITIALIZATION
───────────────────────────────────────────────────────────── */
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      handle TEXT NOT NULL,
      title TEXT NOT NULL,
      location TEXT,
      bio TEXT,
      longbio TEXT,
      email TEXT,
      website TEXT,
      github TEXT,
      linkedin TEXT,
      twitter TEXT,
      dribbble TEXT,
      meta_title TEXT,
      meta_desc TEXT,
      available INTEGER DEFAULT 1,
      avatar TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS landing_sections (
      id TEXT PRIMARY KEY,
      enabled INTEGER DEFAULT 1,
      content_json TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE,
      num TEXT,
      title TEXT NOT NULL,
      title_plain TEXT,
      tagline TEXT,
      desc TEXT,
      category TEXT,
      year TEXT,
      role TEXT,
      duration TEXT,
      status TEXT DEFAULT 'published',
      live_url TEXT,
      github_url TEXT,
      cover TEXT,
      spread1 TEXT,
      spread2 TEXT,
      fullwidth TEXT,
      stack_json TEXT,
      overview_title TEXT,
      overview_body1 TEXT,
      overview_body2 TEXT,
      challenges_json TEXT,
      solution_paras_json TEXT,
      results_json TEXT,
      gallery_json TEXT,
      next_id TEXT,
      next_title TEXT,
      order_index INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      level TEXT DEFAULT 'advanced',
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS experience (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      company TEXT NOT NULL,
      location TEXT,
      period TEXT,
      desc TEXT,
      highlights_json TEXT,
      type TEXT DEFAULT 'Penuh waktu',
      current INTEGER DEFAULT 0,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS education (
      id TEXT PRIMARY KEY,
      degree TEXT NOT NULL,
      institution TEXT NOT NULL,
      period TEXT,
      gpa TEXT,
      detail TEXT,
      tags_json TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      issuer TEXT NOT NULL,
      year TEXT,
      desc TEXT,
      skills_json TEXT,
      url TEXT,
      credid TEXT,
      order_index INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS controls_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      format TEXT,
      size TEXT,
      dim TEXT,
      src TEXT NOT NULL,
      date TEXT DEFAULT (date('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      project TEXT,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'unread',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id TEXT PRIMARY KEY,
      msg TEXT NOT NULL,
      time TEXT,
      date TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_auth (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL DEFAULT 'admin',
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      created_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );
  `);
}

/* ─────────────────────────────────────────────────────────────
   DEFAULT SEED DATA
───────────────────────────────────────────────────────────── */
const INITIAL_PROFILE = {
  id: 1,
  name: 'M Ihwal Maulana',
  handle: 'WalZetass',
  title: 'Mahasiswa Manajemen Informatika · Developer · AI Enthusiast',
  location: 'Pekanbaru · Indonesia',
  bio: 'Saya mahasiswa aktif Manajemen Informatika di Politeknik LP3I Kampus Pekanbaru. Berfokus pada rekayasa perangkat lunak multi-platform, sistem kasir ritel offline-first, dan integrasi kecerdasan buatan berbasis Google Gemini.',
  longbio: 'Saya M Ihwal Maulana (dikenal di komunitas sebagai WalZetass), mahasiswa aktif program studi Manajemen Informatika di Politeknik LP3I Kampus Pekanbaru. Saya berdedikasi membangun aplikasi yang tidak sekadar memiliki tampilan estetis, melainkan memiliki pondasi arsitektur data yang kokoh, berintegritas tinggi, dan andal digunakan di dunia nyata. Fokus rekayasa saya mencakup pembangunan sistem kasir ritel offline-first (WariPOS), aplikasi mobile Android native (CariKostKita), perpesanan privat intim dua arah (Duo Chat), serta penerapan agen dan model multimodal Google Gemini API.',
  email: 'mihwalmaulana09@gmail.com',
  website: 'https://github.com/WalZetass-kar',
  github: 'https://github.com/WalZetass-kar',
  linkedin: 'https://www.linkedin.com/in/m-ihwal-maulana-15792a353/',
  twitter: 'https://twitter.com/walzetass',
  dribbble: 'https://github.com/WalZetass-kar',
  meta_title: 'M Ihwal Maulana — Mahasiswa Manajemen Informatika · Developer · AI Enthusiast',
  meta_desc: 'Portofolio resmi M Ihwal Maulana: Mahasiswa Manajemen Informatika LP3I Pekanbaru, Lead Developer WariPOS POS Suite, CariKostKita Android, Duo Chat, dan Civic Report.',
  available: 1,
  avatar: 'assets/profil.png'
};

const INITIAL_LANDING = {
  hero: {
    enabled: true,
    eyebrow: '',
    title: 'M Ihwal Maulana',
    role: 'Mahasiswa Manajemen Informatika · Developer · AI Enthusiast',
    bio: 'Saya mahasiswa aktif Manajemen Informatika di Politeknik LP3I Kampus Pekanbaru. Berfokus pada rekayasa perangkat lunak multi-platform, sistem kasir ritel offline-first, dan integrasi kecerdasan buatan berbasis Google Gemini.',
    btn1Text: 'Lihat Karya Pilihan →',
    btn1Link: '#projects',
    btn2Text: 'Hubungi Saya',
    btn2Link: '#contact'
  },
  marquee: {
    enabled: true,
    text: ''
  },
  about: {
    enabled: true,
    label: '02 — Tentang',
    headline: 'Rekayasa sistem<br>yang <em>berdaya guna</em>',
    text1: 'Saya <strong>M Ihwal Maulana</strong> (dikenal di komunitas sebagai <em>WalZetass</em>), mahasiswa aktif program studi Manajemen Informatika di Politeknik LP3I Kampus Pekanbaru. Saya berdedikasi membangun aplikasi yang tidak sekadar memiliki tampilan estetis, melainkan memiliki pondasi arsitektur data yang kokoh, berintegritas tinggi, dan andal digunakan di dunia nyata.',
    text2: 'Fokus rekayasa saya mencakup pembangunan sistem kasir ritel offline-first (WariPOS), aplikasi mobile Android native (CariKostKita), perpesanan privat intim dua arah (Duo Chat), serta penerapan agen dan model multimodal Google Gemini API.',
    stat1Num: '',
    stat1Label: '',
    stat2Num: '',
    stat2Label: '',
    stat3Num: '',
    stat3Label: ''
  },
  projects: {
    enabled: true,
    label: '03 — Karya Pilihan',
    headline: 'Showcase<br><em>Proyek Nyata</em>',
    btnText: 'Lihat Arsip Lengkap →',
    btnLink: 'projects.html'
  },
  skills: {
    enabled: true,
    label: '04 — Keahlian',
    headline: 'Alat &<br><em>Teknologi Nyata</em>',
    intro: 'Kumpulan bahasa pemrograman, kerangka kerja, dan perkakas teknis yang digunakan secara konsisten dalam proyek nyata dan rekayasa multi-platform.'
  },
  experience: {
    enabled: true,
    label: '05 — Jejak Perjalanan',
    headline: 'Pendidikan &<br><em>Kontribusi</em>'
  },
  certs: {
    enabled: true,
    label: '06 — Pembelajaran & Kredensial',
    headline: 'Validasi & <em>Sertifikasi Keahlian</em>'
  },
  contact: {
    enabled: true,
    label: '07 — Kontak & Kolaborasi',
    headline: 'Mari membangun<br>sesuatu yang <em>berdampak</em>',
    sub: 'Terbuka untuk kolaborasi proyek rekayasa sistem, eksplorasi kecerdasan buatan, maupun diskusi teknis. Kirimkan pesan langsung melalui formulir atau email.',
    email: 'mihwalmaulana09@gmail.com'
  }
};

const INITIAL_PROJECTS = [];
const INITIAL_SKILLS = [];
const INITIAL_EXPERIENCE = [];
const INITIAL_EDUCATION = [];
const INITIAL_CERTIFICATES = [];
const INITIAL_MEDIA = [];

const INITIAL_CONTROLS = {
  sections: [
    { id: 'hero', name: 'Hero & Pengantar', desc: 'Judul, nama, foto potret, dan slogan pengembang kreatif', icon: '✦', visible: true, locked: true },
    { id: 'marquee', name: 'Ticker Marquee', desc: 'Pita teks berjalan kontinu tak terbatas secara tipografis', icon: '◈', visible: true, locked: false },
    { id: 'about', name: 'Tentang & Metrik', desc: 'Pernyataan editorial, angka metrik, dan ikhtisar bio', icon: '01', visible: true, locked: false },
    { id: 'projects', name: 'Karya Pilihan', desc: 'Studi kasus editorial unggulan & daftar proyek', icon: '02', visible: true, locked: false },
    { id: 'skills', name: 'Keahlian & Teknologi', desc: 'Kategori teknologi, tingkat kemahiran, dan tag keahlian', icon: '03', visible: true, locked: false },
    { id: 'experience', name: 'Linimasa Pengalaman', desc: 'Riwayat karier, peran pada klien, dan pencapaian utama', icon: '04', visible: true, locked: false },
    { id: 'certificates', name: 'Kredensial & Sertifikat', desc: 'Sertifikasi terverifikasi dengan tautan kredensial', icon: '05', visible: true, locked: false },
    { id: 'contact', name: 'Pernyataan Kontak', desc: 'Judul MARI MEMBANGUN SESUATU, formulir kontak & tautan sosial', icon: '06', visible: true, locked: false }
  ],
  three: {
    activePage: 'homepage',
    pages: {
      homepage: {
        enabled: true,
        parallax: true,
        parallaxStrength: 40,
        hover: true,
        opacity: 55,
        particles: { enabled: true, count: 600, size: 25, opacity: 35, drift: 20, color: '#c8b89a' },
        lighting: { ambientColor: '#111110', ambientIntensity: 40, dirColor: '#c8b89a', dirIntensity: 60, shadows: false },
        objects: [
          { id: 'geo1', name: 'Icosahedron', type: 'Icosahedron', wireframe: true, visible: true, rotX: 5, rotY: 7, rotZ: 0, scale: 100, posX: 3.5, posY: -0.5, posZ: -1 },
          { id: 'geo2', name: 'Torus Ring', type: 'Torus', wireframe: true, visible: true, rotX: 3, rotY: 0, rotZ: 4, scale: 100, posX: -3.8, posY: 1.5, posZ: -2 },
          { id: 'geo3', name: 'Octahedra Floaters (x5)', type: 'Octahedron', wireframe: true, visible: true, rotX: 6, rotY: 6, rotZ: 2, scale: 70, posX: 0, posY: 0, posZ: 0 }
        ]
      },
      about: {
        enabled: true,
        parallax: true,
        parallaxStrength: 30,
        hover: true,
        opacity: 18,
        particles: { enabled: true, count: 280, size: 18, opacity: 25, drift: 15, color: '#c8b89a' },
        lighting: { ambientColor: '#111110', ambientIntensity: 30, dirColor: '#c8b89a', dirIntensity: 50, shadows: false },
        objects: [
          { id: 'geo_a1', name: 'Large Torus Ring', type: 'Torus', wireframe: true, visible: true, rotX: 6, rotY: 12, rotZ: 0, scale: 120, posX: 0, posY: 0, posZ: 0 },
          { id: 'geo_a2', name: 'Center Icosahedron', type: 'Icosahedron', wireframe: true, visible: true, rotX: 4, rotY: 6, rotZ: 2, scale: 80, posX: 3, posY: -1, posZ: -1 }
        ]
      },
      projects: {
        enabled: true,
        parallax: true,
        parallaxStrength: 35,
        hover: true,
        opacity: 25,
        particles: { enabled: true, count: 400, size: 20, opacity: 30, drift: 20, color: '#c8b89a' },
        lighting: { ambientColor: '#111110', ambientIntensity: 40, dirColor: '#c8b89a', dirIntensity: 60, shadows: false },
        objects: [
          { id: 'geo_p1', name: 'Showcase Torus', type: 'Torus', wireframe: true, visible: true, rotX: 3, rotY: 5, rotZ: 0, scale: 100, posX: -2, posY: 1, posZ: -1 }
        ]
      },
      detail: {
        enabled: true,
        parallax: false,
        parallaxStrength: 15,
        hover: false,
        opacity: 20,
        particles: { enabled: true, count: 250, size: 15, opacity: 20, drift: 10, color: '#c8b89a' },
        lighting: { ambientColor: '#111110', ambientIntensity: 30, dirColor: '#c8b89a', dirIntensity: 40, shadows: false },
        objects: [
          { id: 'geo_d1', name: 'Subtle Background Wire', type: 'Icosahedron', wireframe: true, visible: true, rotX: 2, rotY: 2, rotZ: 0, scale: 90, posX: 2, posY: 0, posZ: -2 }
        ]
      }
    },
    accentColor: '#c8b89a'
  },
  seo: {
    activePage: 'home',
    pages: {
      home: {
        title: 'M Ihwal Maulana — Developer & AI Enthusiast',
        desc: 'Portofolio M Ihwal Maulana (WalZetass) — Mahasiswa Manajemen Informatika Politeknik LP3I Pekanbaru, pengembang WariPOS, CariKostKita, Duo Chat, dan Civic Report.',
        canonical: 'https://walzetass-kar.github.io',
        keywords: 'M Ihwal Maulana, WalZetass, WariPOS, CariKostKita, Duo Chat, LP3I Pekanbaru, Manajemen Informatika, Android Developer, POS Electron',
        ogTitle: 'M Ihwal Maulana — Developer & AI Enthusiast',
        ogDesc: 'Mahasiswa Manajemen Informatika Politeknik LP3I Pekanbaru · Developer · AI Enthusiast.',
        ogImage: 'assets/mockups/waripos-icon.png',
        sitemap: true,
        robots: true,
        schema: true,
        twitterCard: true,
        twitterHandle: '@WalZetass-kar'
      },
      about: {
        title: 'Tentang — M Ihwal Maulana | Mahasiswa & Developer',
        desc: 'Profil, keahlian teknis, riwayat pendidikan Politeknik LP3I Pekanbaru, organisasi BEM, dan repositori open source oleh M Ihwal Maulana.',
        canonical: 'https://walzetass-kar.github.io/about.html',
        keywords: 'tentang, biografi, Politeknik LP3I, BEM LP3I, WariPOS, CariKostKita, WalZetass-Kar',
        ogTitle: 'Tentang M Ihwal Maulana',
        ogDesc: 'Perjalanan akademis Politeknik LP3I, organisasi BEM, dan rekayasa perangkat lunak mandiri.',
        ogImage: 'assets/profil.png',
        sitemap: true,
        robots: true,
        schema: true,
        twitterCard: true,
        twitterHandle: '@WalZetass-kar'
      },
      projects: {
        title: 'Karya Nyata — M Ihwal Maulana',
        desc: 'Studi kasus sistem mandiri: WariPOS (POS offline-first), CariKostKita (Android Room), Duo Chat (private messenger), dan Civic Report AI.',
        canonical: 'https://walzetass-kar.github.io/projects.html',
        keywords: 'WariPOS, CariKostKita, Duo Chat, Civic Report, portfolio developer, open source',
        ogTitle: 'Karya Nyata — WalZetass',
        ogDesc: 'Koleksi sistem dan aplikasi siap rilis oleh M Ihwal Maulana.',
        ogImage: 'assets/mockups/waripos-icon.png',
        sitemap: true,
        robots: true,
        schema: true,
        twitterCard: true,
        twitterHandle: '@walzetass'
      }
    }
  },
  social: {
    links: [
      { id: 'soc_email', platform: 'Email', handle: 'mihwalmaulana09@gmail.com', url: 'mailto:mihwalmaulana09@gmail.com', visible: true },
      { id: 'soc_gh', platform: 'GitHub', handle: '@WalZetass-kar', url: 'https://github.com/WalZetass-kar', visible: true },
      { id: 'soc_li', platform: 'LinkedIn', handle: 'M Ihwal Maulana', url: 'https://linkedin.com/in/walzetass', visible: true },
      { id: 'soc_x', platform: 'Twitter/X', handle: '@walzetass', url: 'https://twitter.com/walzetass', visible: true },
      { id: 'soc_dr', platform: 'Proyek', handle: 'WalZetass-kar', url: 'https://github.com/WalZetass-kar?tab=repositories', visible: true }
    ],
    showInFooter: true,
    showInContact: true,
    showInHero: false,
    openNewTab: true,
    heroMax: 4
  },
  settings: {
    accent: '#c8b89a',
    siteTitle: 'WalZetass — M Ihwal Maulana',
    analytics: ''
  }
};

/* ─────────────────────────────────────────────────────────────
   SEEDING LOGIC
───────────────────────────────────────────────────────────── */
function seedDatabase(force = false) {
  initSchema();

  const countProf = db.prepare('SELECT COUNT(*) as count FROM profile').get();
  if (countProf.count > 0 && !force) {
    return;
  }

  if (force) {
    db.exec(`
      DELETE FROM profile;
      DELETE FROM landing_sections;
      DELETE FROM projects;
      DELETE FROM skills;
      DELETE FROM experience;
      DELETE FROM education;
      DELETE FROM certificates;
      DELETE FROM controls_settings;
      DELETE FROM media;
      DELETE FROM activity_log;
    `);
  }

  // 1. Seed Profile
  const insProf = db.prepare(`
    INSERT INTO profile (id, name, handle, title, location, bio, longbio, email, website, github, linkedin, twitter, dribbble, meta_title, meta_desc, available, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insProf.run(
    1,
    INITIAL_PROFILE.name,
    INITIAL_PROFILE.handle,
    INITIAL_PROFILE.title,
    INITIAL_PROFILE.location,
    INITIAL_PROFILE.bio,
    INITIAL_PROFILE.longbio,
    INITIAL_PROFILE.email,
    INITIAL_PROFILE.website,
    INITIAL_PROFILE.github,
    INITIAL_PROFILE.linkedin,
    INITIAL_PROFILE.twitter,
    INITIAL_PROFILE.dribbble,
    INITIAL_PROFILE.meta_title,
    INITIAL_PROFILE.meta_desc,
    INITIAL_PROFILE.available,
    INITIAL_PROFILE.avatar
  );

  // 2. Seed Landing Sections
  const insLanding = db.prepare(`
    INSERT INTO landing_sections (id, enabled, content_json)
    VALUES (?, ?, ?)
  `);
  Object.entries(INITIAL_LANDING).forEach(([secId, secData]) => {
    insLanding.run(secId, secData.enabled !== false ? 1 : 0, JSON.stringify(secData));
  });

  // 3. Seed Projects
  const insProj = db.prepare(`
    INSERT INTO projects (
      id, slug, num, title, title_plain, tagline, desc, category, year, role, duration,
      status, live_url, github_url, cover, spread1, spread2, fullwidth,
      stack_json, overview_title, overview_body1, overview_body2,
      challenges_json, solution_paras_json, results_json, gallery_json,
      next_id, next_title, order_index
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?
    )
  `);
  INITIAL_PROJECTS.forEach((p, idx) => {
    insProj.run(
      p.id,
      p.slug || p.id,
      p.num || String(idx + 1).padStart(2, '0'),
      p.title,
      p.title_plain || p.title.replace(/<[^>]*>?/gm, ''),
      p.tagline || '',
      p.desc || '',
      p.category || 'fullstack',
      p.year || '2024',
      p.role || '',
      p.duration || '',
      p.status || 'published',
      p.live_url || '#',
      p.github_url || '#',
      p.cover || '',
      p.spread1 || '',
      p.spread2 || '',
      p.fullwidth || '',
      JSON.stringify(p.stack || []),
      p.overview_title || '',
      p.overview_body1 || '',
      p.overview_body2 || '',
      JSON.stringify(p.challenges || []),
      JSON.stringify(p.solution_paras || []),
      JSON.stringify(p.results || []),
      JSON.stringify(p.gallery || []),
      p.next_id || '',
      p.next_title || '',
      p.order_index || (idx + 1)
    );
  });

  // 4. Seed Skills
  const insSkill = db.prepare(`
    INSERT INTO skills (id, name, category, level, order_index)
    VALUES (?, ?, ?, ?, ?)
  `);
  INITIAL_SKILLS.forEach((s, idx) => {
    insSkill.run(s.id, s.name, s.category, s.level, s.order_index || (idx + 1));
  });

  // 5. Seed Experience
  const insExp = db.prepare(`
    INSERT INTO experience (id, role, company, location, period, desc, highlights_json, type, current, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  INITIAL_EXPERIENCE.forEach((e, idx) => {
    insExp.run(
      e.id,
      e.role,
      e.company,
      e.location || '',
      e.period || '',
      e.desc || '',
      JSON.stringify(e.highlights || []),
      e.type || 'Penuh waktu',
      e.current ? 1 : 0,
      e.order_index || (idx + 1)
    );
  });

  // 6. Seed Education
  const insEdu = db.prepare(`
    INSERT INTO education (id, degree, institution, period, gpa, detail, tags_json, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  INITIAL_EDUCATION.forEach((ed, idx) => {
    insEdu.run(
      ed.id,
      ed.degree,
      ed.institution,
      ed.period || '',
      ed.gpa || '',
      ed.detail || '',
      JSON.stringify(ed.tags || []),
      ed.order_index || (idx + 1)
    );
  });

  // 7. Seed Certificates
  const insCert = db.prepare(`
    INSERT INTO certificates (id, title, issuer, year, desc, skills_json, url, credid, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  INITIAL_CERTIFICATES.forEach((c, idx) => {
    insCert.run(
      c.id,
      c.title,
      c.issuer,
      c.year || '',
      c.desc || '',
      JSON.stringify(c.skills || []),
      c.url || '#',
      c.credid || '',
      c.order_index || (idx + 1)
    );
  });

  // 8. Seed Media
  const insMedia = db.prepare(`
    INSERT INTO media (id, name, type, format, size, dim, src, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  INITIAL_MEDIA.forEach(m => {
    insMedia.run(m.id, m.name, m.type, m.format, m.size, m.dim, m.src, m.date);
  });

  // 9. Seed Controls Settings
  const insCtrl = db.prepare(`
    INSERT INTO controls_settings (key, value_json)
    VALUES (?, ?)
  `);
  insCtrl.run('sections', JSON.stringify(INITIAL_CONTROLS.sections));
  insCtrl.run('three', JSON.stringify(INITIAL_CONTROLS.three));
  insCtrl.run('seo', JSON.stringify(INITIAL_CONTROLS.seo));
  insCtrl.run('social', JSON.stringify(INITIAL_CONTROLS.social));
  insCtrl.run('settings', JSON.stringify(INITIAL_CONTROLS.settings));

  // 10. Seed Initial Log
  const insLog = db.prepare(`
    INSERT INTO activity_log (id, msg, time, date)
    VALUES (?, ?, ?, ?)
  `);
  const now = new Date();
  insLog.run(
    'log-init',
    'Database sistem diinisialisasi dengan data tunggal terpusat.',
    now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    now.toISOString()
  );
}

// Auto-seed on require
initSchema();
seedDatabase(false);
initAdminAuth();

/* ─────────────────────────────────────────────────────────────
   HELPERS & REPOSITORY API
───────────────────────────────────────────────────────────── */

function parseJSON(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// ── 1. Profile ──
function getProfile() {
  const row = db.prepare('SELECT * FROM profile WHERE id = 1').get();
  if (!row) return INITIAL_PROFILE;
  return {
    name: row.name,
    handle: row.handle,
    title: row.title,
    role: row.title,
    location: row.location,
    bio: row.bio,
    longbio: row.longbio,
    email: row.email,
    website: row.website,
    github: row.github,
    linkedin: row.linkedin,
    twitter: row.twitter,
    dribbble: row.dribbble,
    'meta-title': row.meta_title,
    'meta-desc': row.meta_desc,
    meta_title: row.meta_title,
    meta_desc: row.meta_desc,
    available: Boolean(row.available),
    avatar: row.avatar
  };
}

function updateProfile(data) {
  const current = getProfile();
  const merged = { ...current, ...data };
  const stmt = db.prepare(`
    UPDATE profile SET
      name = ?, handle = ?, title = ?, location = ?, bio = ?, longbio = ?,
      email = ?, website = ?, github = ?, linkedin = ?, twitter = ?, dribbble = ?,
      meta_title = ?, meta_desc = ?, available = ?, avatar = ?, updated_at = datetime('now')
    WHERE id = 1
  `);
  stmt.run(
    merged.name,
    merged.handle,
    merged.title,
    merged.location,
    merged.bio,
    merged.longbio,
    merged.email,
    merged.website,
    merged.github,
    merged.linkedin,
    merged.twitter,
    merged.dribbble,
    merged['meta-title'] || merged.meta_title || '',
    merged['meta-desc'] || merged.meta_desc || '',
    merged.available ? 1 : 0,
    merged.avatar
  );
  addLog('Profil diperbarui');
  return getProfile();
}

// ── 2. Landing Sections ──
function getLandingSections() {
  const rows = db.prepare('SELECT * FROM landing_sections').all();
  const result = {};
  rows.forEach(r => {
    const data = parseJSON(r.content_json, {});
    data.enabled = Boolean(r.enabled);
    result[r.id] = data;
  });
  return result;
}

function updateLandingSection(secId, data) {
  const enabled = data.enabled !== false ? 1 : 0;
  const stmt = db.prepare(`
    INSERT INTO landing_sections (id, enabled, content_json, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      enabled = excluded.enabled,
      content_json = excluded.content_json,
      updated_at = datetime('now')
  `);
  stmt.run(secId, enabled, JSON.stringify(data));
  addLog(`Bagian ${secId} diperbarui`);
  return getLandingSections()[secId];
}

// ── 3. Projects ──
function mapProjectRow(r) {
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug || r.id,
    num: r.num,
    title: r.title,
    titlePlain: r.title_plain || r.title.replace(/<[^>]*>?/gm, ''),
    tagline: r.tagline,
    desc: r.desc,
    category: r.category,
    year: r.year,
    role: r.role,
    duration: r.duration,
    status: r.status,
    live: r.live_url,
    github: r.github_url,
    liveUrl: r.live_url,
    githubUrl: r.github_url,
    cover: r.cover,
    spread1: r.spread1,
    spread2: r.spread2,
    fullwidth: r.fullwidth,
    stack: parseJSON(r.stack_json, []),
    overviewTitle: r.overview_title,
    overviewBody1: r.overview_body1,
    overviewBody2: r.overview_body2,
    challenges: parseJSON(r.challenges_json, []),
    solutionParas: parseJSON(r.solution_paras_json, []),
    results: parseJSON(r.results_json, []),
    gallery: parseJSON(r.gallery_json, []),
    nextId: r.next_id,
    nextTitle: r.next_title,
    order_index: r.order_index,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function getProjects(all = false) {
  const sql = all
    ? 'SELECT * FROM projects ORDER BY order_index ASC, id ASC'
    : "SELECT * FROM projects WHERE status = 'published' ORDER BY order_index ASC, id ASC";
  const rows = db.prepare(sql).all();
  return rows.map(mapProjectRow);
}

function getProjectByIdOrSlug(idOrSlug) {
  const row = db.prepare('SELECT * FROM projects WHERE id = ? OR slug = ? LIMIT 1').get(idOrSlug, idOrSlug);
  return mapProjectRow(row);
}

function saveProject(proj) {
  const id = proj.id || ('p' + Date.now());
  const slug = proj.slug || (proj.title ? proj.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : id);
  const title = proj.title || 'Proyek Baru';
  const titlePlain = proj.titlePlain || title.replace(/<[^>]*>?/gm, '');

  const stmt = db.prepare(`
    INSERT INTO projects (
      id, slug, num, title, title_plain, tagline, desc, category, year, role, duration,
      status, live_url, github_url, cover, spread1, spread2, fullwidth,
      stack_json, overview_title, overview_body1, overview_body2,
      challenges_json, solution_paras_json, results_json, gallery_json,
      next_id, next_title, order_index, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      num = excluded.num,
      title = excluded.title,
      title_plain = excluded.title_plain,
      tagline = excluded.tagline,
      desc = excluded.desc,
      category = excluded.category,
      year = excluded.year,
      role = excluded.role,
      duration = excluded.duration,
      status = excluded.status,
      live_url = excluded.live_url,
      github_url = excluded.github_url,
      cover = excluded.cover,
      spread1 = excluded.spread1,
      spread2 = excluded.spread2,
      fullwidth = excluded.fullwidth,
      stack_json = excluded.stack_json,
      overview_title = excluded.overview_title,
      overview_body1 = excluded.overview_body1,
      overview_body2 = excluded.overview_body2,
      challenges_json = excluded.challenges_json,
      solution_paras_json = excluded.solution_paras_json,
      results_json = excluded.results_json,
      gallery_json = excluded.gallery_json,
      next_id = excluded.next_id,
      next_title = excluded.next_title,
      order_index = excluded.order_index,
      updated_at = datetime('now')
  `);

  stmt.run(
    id,
    slug,
    proj.num || '01',
    title,
    titlePlain,
    proj.tagline || '',
    proj.desc || '',
    proj.category || 'fullstack',
    proj.year || '2024',
    proj.role || '',
    proj.duration || '',
    proj.status || 'published',
    proj.live || proj.liveUrl || '#',
    proj.github || proj.githubUrl || '#',
    proj.cover || '',
    proj.spread1 || '',
    proj.spread2 || '',
    proj.fullwidth || '',
    JSON.stringify(proj.stack || []),
    proj.overviewTitle || '',
    proj.overviewBody1 || '',
    proj.overviewBody2 || '',
    JSON.stringify(proj.challenges || []),
    JSON.stringify(proj.solutionParas || []),
    JSON.stringify(proj.results || []),
    JSON.stringify(proj.gallery || []),
    proj.nextId || '',
    proj.nextTitle || '',
    proj.order_index || 0
  );

  addLog(`Proyek "${titlePlain}" disimpan`);
  return getProjectByIdOrSlug(id);
}

function deleteProject(id) {
  const p = getProjectByIdOrSlug(id);
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  if (p) addLog(`Proyek "${p.titlePlain}" dihapus`);
  return { success: true, id };
}

// ── 4. Skills ──
function getSkills() {
  return db.prepare('SELECT * FROM skills ORDER BY order_index ASC, id ASC').all();
}

function saveSkill(skill) {
  const id = skill.id || ('s' + Date.now());
  const stmt = db.prepare(`
    INSERT INTO skills (id, name, category, level, order_index)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      level = excluded.level,
      order_index = excluded.order_index
  `);
  stmt.run(id, skill.name, skill.category, skill.level || 'advanced', skill.order_index || 0);
  addLog(`Keahlian "${skill.name}" disimpan`);
  return db.prepare('SELECT * FROM skills WHERE id = ?').get(id);
}

function deleteSkill(id) {
  db.prepare('DELETE FROM skills WHERE id = ?').run(id);
  addLog(`Keahlian ID ${id} dihapus`);
  return { success: true, id };
}

// ── 5. Experience ──
function getExperience() {
  const rows = db.prepare('SELECT * FROM experience ORDER BY order_index ASC, id ASC').all();
  return rows.map(r => ({
    id: r.id,
    role: r.role,
    company: r.company,
    location: r.location,
    period: r.period,
    desc: r.desc,
    highlights: parseJSON(r.highlights_json, []),
    type: r.type,
    current: Boolean(r.current),
    order_index: r.order_index
  }));
}

function saveExperience(exp) {
  const id = exp.id || ('e' + Date.now());
  const stmt = db.prepare(`
    INSERT INTO experience (id, role, company, location, period, desc, highlights_json, type, current, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      role = excluded.role,
      company = excluded.company,
      location = excluded.location,
      period = excluded.period,
      desc = excluded.desc,
      highlights_json = excluded.highlights_json,
      type = excluded.type,
      current = excluded.current,
      order_index = excluded.order_index
  `);
  stmt.run(
    id,
    exp.role,
    exp.company,
    exp.location || '',
    exp.period || '',
    exp.desc || '',
    JSON.stringify(exp.highlights || []),
    exp.type || 'Penuh waktu',
    exp.current ? 1 : 0,
    exp.order_index || 0
  );
  addLog(`Pengalaman "${exp.role} di ${exp.company}" disimpan`);
  return getExperience().find(e => e.id === id);
}

function deleteExperience(id) {
  db.prepare('DELETE FROM experience WHERE id = ?').run(id);
  addLog(`Pengalaman ID ${id} dihapus`);
  return { success: true, id };
}

// ── 6. Education ──
function getEducation() {
  const rows = db.prepare('SELECT * FROM education ORDER BY order_index ASC, id ASC').all();
  return rows.map(r => ({
    id: r.id,
    degree: r.degree,
    institution: r.institution,
    period: r.period,
    gpa: r.gpa,
    detail: r.detail,
    tags: parseJSON(r.tags_json, []),
    order_index: r.order_index
  }));
}

function saveEducation(edu) {
  const id = edu.id || ('ed' + Date.now());
  const stmt = db.prepare(`
    INSERT INTO education (id, degree, institution, period, gpa, detail, tags_json, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      degree = excluded.degree,
      institution = excluded.institution,
      period = excluded.period,
      gpa = excluded.gpa,
      detail = excluded.detail,
      tags_json = excluded.tags_json,
      order_index = excluded.order_index
  `);
  stmt.run(
    id,
    edu.degree,
    edu.institution,
    edu.period || '',
    edu.gpa || '',
    edu.detail || '',
    JSON.stringify(edu.tags || []),
    edu.order_index || 0
  );
  addLog(`Pendidikan "${edu.degree}" disimpan`);
  return getEducation().find(e => e.id === id);
}

function deleteEducation(id) {
  db.prepare('DELETE FROM education WHERE id = ?').run(id);
  addLog(`Pendidikan ID ${id} dihapus`);
  return { success: true, id };
}

// ── 7. Certificates ──
function getCertificates() {
  const rows = db.prepare('SELECT * FROM certificates ORDER BY order_index ASC, id ASC').all();
  return rows.map(r => ({
    id: r.id,
    title: r.title,
    issuer: r.issuer,
    year: r.year,
    desc: r.desc,
    skills: parseJSON(r.skills_json, []),
    url: r.url,
    credid: r.credid,
    order_index: r.order_index
  }));
}

function saveCertificate(cert) {
  const id = cert.id || ('c' + Date.now());
  const stmt = db.prepare(`
    INSERT INTO certificates (id, title, issuer, year, desc, skills_json, url, credid, order_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      issuer = excluded.issuer,
      year = excluded.year,
      desc = excluded.desc,
      skills_json = excluded.skills_json,
      url = excluded.url,
      credid = excluded.credid,
      order_index = excluded.order_index
  `);
  stmt.run(
    id,
    cert.title,
    cert.issuer,
    cert.year || '',
    cert.desc || '',
    JSON.stringify(cert.skills || []),
    cert.url || '#',
    cert.credid || '',
    cert.order_index || 0
  );
  addLog(`Sertifikat "${cert.title}" disimpan`);
  return getCertificates().find(c => c.id === id);
}

function deleteCertificate(id) {
  db.prepare('DELETE FROM certificates WHERE id = ?').run(id);
  addLog(`Sertifikat ID ${id} dihapus`);
  return { success: true, id };
}

// ── 8. Controls Settings (sections, three, seo, social, settings) ──
function getControlsSettings() {
  const rows = db.prepare('SELECT * FROM controls_settings').all();
  const res = { ...INITIAL_CONTROLS };
  rows.forEach(r => {
    res[r.key] = parseJSON(r.value_json, res[r.key]);
  });
  return res;
}

function saveControlsSettings(data) {
  const stmt = db.prepare(`
    INSERT INTO controls_settings (key, value_json, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value_json = excluded.value_json,
      updated_at = datetime('now')
  `);
  Object.entries(data).forEach(([k, v]) => {
    stmt.run(k, JSON.stringify(v));
  });
  addLog('Pengaturan kontrol portofolio diperbarui');
  return getControlsSettings();
}

// ── 9. Media ──
function getMedia() {
  return db.prepare('SELECT * FROM media ORDER BY date DESC, id DESC').all();
}

function saveMedia(item) {
  const id = item.id || ('m' + Date.now());
  const stmt = db.prepare(`
    INSERT INTO media (id, name, type, format, size, dim, src, date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      type = excluded.type,
      format = excluded.format,
      size = excluded.size,
      dim = excluded.dim,
      src = excluded.src
  `);
  stmt.run(id, item.name, item.type || 'png', item.format || 'Media', item.size || '1 MB', item.dim || '', item.src, item.date || new Date().toISOString().slice(0, 10));
  addLog(`Media "${item.name}" ditambahkan`);
  return db.prepare('SELECT * FROM media WHERE id = ?').get(id);
}

function deleteMedia(id) {
  db.prepare('DELETE FROM media WHERE id = ?').run(id);
  addLog(`Media ID ${id} dihapus`);
  return { success: true, id };
}

// ── 10. Contact Messages ──
function saveContactMessage(msg) {
  const id = 'msg_' + Date.now() + Math.random().toString(36).slice(2, 6);
  const stmt = db.prepare(`
    INSERT INTO contact_messages (id, name, email, project, message)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, msg.name, msg.email, msg.project || '', msg.message);
  addLog(`Pesan baru diterima dari ${msg.name}`);
  return { success: true, id };
}

function getContactMessages() {
  return db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC').all();
}

// ── 11. Activity Log ──
function addLog(msg) {
  const id = 'log_' + Date.now() + Math.random().toString(36).slice(2, 6);
  const now = new Date();
  const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const stmt = db.prepare(`
    INSERT INTO activity_log (id, msg, time, date)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, msg, time, now.toISOString());
}

function getLog(limit = 50) {
  return db.prepare('SELECT * FROM activity_log ORDER BY date DESC LIMIT ?').all(limit);
}

/* ─────────────────────────────────────────────────────────────
   AGGREGATED PAYLOADS
───────────────────────────────────────────────────────────── */

// Public landing & site aggregated payload
function getPublishedPortfolio() {
  const profile = getProfile();
  const landing = getLandingSections();
  const projects = getProjects(false);
  const skills = getSkills();
  const experience = getExperience();
  const education = getEducation();
  const certificates = getCertificates();
  const controls = getControlsSettings();

  return {
    profile,
    landing,
    projects,
    skills,
    experience,
    education,
    certificates,
    sections: controls.sections || INITIAL_CONTROLS.sections,
    three: controls.three || INITIAL_CONTROLS.three,
    seo: controls.seo || INITIAL_CONTROLS.seo,
    social: controls.social || INITIAL_CONTROLS.social,
    settings: controls.settings || INITIAL_CONTROLS.settings,
    timestamp: new Date().toISOString()
  };
}

// Full admin state payload
function getAdminState() {
  const profile = getProfile();
  const landing = getLandingSections();
  const projects = getProjects(true);
  const skills = getSkills();
  const experience = getExperience();
  const education = getEducation();
  const certificates = getCertificates();
  const media = getMedia();
  const controls = getControlsSettings();
  const log = getLog(50);

  return {
    profile,
    landing,
    projects,
    skills,
    experience,
    education,
    certificates,
    media,
    settings: controls.settings || { accent: '#c8b89a', siteTitle: 'WalZetass — M Ihwal Maulana', analytics: '' },
    controls,
    log,
    _lang: 'id',
    timestamp: new Date().toISOString()
  };
}

// Full batch sync from Admin CMS with deletion reconciliation
function saveAdminState(state) {
  if (!state || typeof state !== 'object') return getAdminState();

  if (state.profile) {
    updateProfile(state.profile);
  }

  if (state.landing && typeof state.landing === 'object') {
    Object.entries(state.landing).forEach(([secId, secData]) => {
      updateLandingSection(secId, secData);
    });
  }

  // Reconcile and save projects
  if (Array.isArray(state.projects)) {
    const incomingIds = state.projects.map(p => p.id).filter(Boolean);
    const existing = db.prepare('SELECT id FROM projects').all();
    existing.forEach(row => {
      if (!incomingIds.includes(row.id)) {
        deleteProject(row.id);
      }
    });
    state.projects.forEach(p => saveProject(p));
  }

  // Reconcile and save skills
  if (Array.isArray(state.skills)) {
    const incomingIds = state.skills.map(s => s.id).filter(Boolean);
    const existing = db.prepare('SELECT id FROM skills').all();
    existing.forEach(row => {
      if (!incomingIds.includes(row.id)) {
        deleteSkill(row.id);
      }
    });
    state.skills.forEach(s => saveSkill(s));
  }

  // Reconcile and save experience
  if (Array.isArray(state.experience)) {
    const incomingIds = state.experience.map(e => e.id).filter(Boolean);
    const existing = db.prepare('SELECT id FROM experience').all();
    existing.forEach(row => {
      if (!incomingIds.includes(row.id)) {
        deleteExperience(row.id);
      }
    });
    state.experience.forEach(e => saveExperience(e));
  }

  // Reconcile and save education
  if (Array.isArray(state.education)) {
    const incomingIds = state.education.map(ed => ed.id).filter(Boolean);
    const existing = db.prepare('SELECT id FROM education').all();
    existing.forEach(row => {
      if (!incomingIds.includes(row.id)) {
        deleteEducation(row.id);
      }
    });
    state.education.forEach(ed => saveEducation(ed));
  }

  // Reconcile and save certificates
  if (Array.isArray(state.certificates)) {
    const incomingIds = state.certificates.map(c => c.id).filter(Boolean);
    const existing = db.prepare('SELECT id FROM certificates').all();
    existing.forEach(row => {
      if (!incomingIds.includes(row.id)) {
        deleteCertificate(row.id);
      }
    });
    state.certificates.forEach(c => saveCertificate(c));
  }

  if (state.controls && typeof state.controls === 'object') {
    saveControlsSettings(state.controls);
  }

  if (state.settings && typeof state.settings === 'object') {
    const current = getControlsSettings();
    saveControlsSettings({ ...current, settings: state.settings });
  }

  addLog('Sinkronisasi penuh CMS berhasil disimpan ke database');
  return getAdminState();
}

/* ─────────────────────────────────────────────────────────────
   ADMIN AUTH
───────────────────────────────────────────────────────────── */
function hashPassword(password, salt) {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function getAdminAuth() {
  return db.prepare('SELECT * FROM admin_auth WHERE id = 1').get();
}

function initAdminAuth() {
  const existing = getAdminAuth();
  if (!existing) {
    const salt = crypto.randomBytes(32).toString('hex');
    const hash = hashPassword('admin123', salt);
    db.prepare(`INSERT INTO admin_auth (id, username, password_hash, salt) VALUES (1, 'admin', ?, ?)`).run(hash, salt);
  }
}

function verifyAdminCredentials(username, password) {
  const auth = getAdminAuth();
  if (!auth) return false;
  if (auth.username !== username) return false;
  const hash = hashPassword(password, auth.salt);
  return hash === auth.password_hash;
}

function changeAdminPassword(currentPassword, newPassword) {
  const auth = getAdminAuth();
  if (!auth) throw new Error('Admin auth not initialized');
  const currentHash = hashPassword(currentPassword, auth.salt);
  if (currentHash !== auth.password_hash) throw new Error('Kata sandi saat ini tidak sesuai');
  const newSalt = crypto.randomBytes(32).toString('hex');
  const newHash = hashPassword(newPassword, newSalt);
  db.prepare('UPDATE admin_auth SET password_hash = ?, salt = ?, updated_at = datetime(\'now\') WHERE id = 1').run(newHash, newSalt);
  return true;
}

function createSession() {
  const token = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
  // Clean up expired sessions first
  db.prepare("DELETE FROM admin_sessions WHERE expires_at < datetime('now')").run();
  db.prepare('INSERT INTO admin_sessions (token, expires_at) VALUES (?, ?)').run(token, expiresAt);
  return token;
}

function validateSession(token) {
  if (!token) return false;
  const session = db.prepare("SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')").get(token);
  return !!session;
}

function destroySession(token) {
  db.prepare('DELETE FROM admin_sessions WHERE token = ?').run(token);
}

module.exports = {
  db,
  initSchema,
  seedDatabase,
  getProfile,
  updateProfile,
  getLandingSections,
  updateLandingSection,
  getProjects,
  getProjectByIdOrSlug,
  saveProject,
  deleteProject,
  getSkills,
  saveSkill,
  deleteSkill,
  getExperience,
  saveExperience,
  deleteExperience,
  getEducation,
  saveEducation,
  deleteEducation,
  getCertificates,
  saveCertificate,
  deleteCertificate,
  getControlsSettings,
  saveControlsSettings,
  getMedia,
  saveMedia,
  deleteMedia,
  saveContactMessage,
  getContactMessages,
  addLog,
  getLog,
  getPublishedPortfolio,
  getAdminState,
  saveAdminState,
  initAdminAuth,
  verifyAdminCredentials,
  changeAdminPassword,
  createSession,
  validateSession,
  destroySession
};

