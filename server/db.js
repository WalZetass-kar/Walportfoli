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
      featured INTEGER DEFAULT 0,
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

  // ── Migrasi ringan: tambah kolom baru ke tabel yang sudah ada ──
  // CREATE TABLE IF NOT EXISTS di atas tidak mengubah tabel lama,
  // jadi kolom baru harus dicek satu per satu lalu di-ALTER bila belum ada.
  const migrations = [
    ['projects', 'featured', 'INTEGER DEFAULT 0'],
  ];
  for (const [table, column, type] of migrations) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (cols.length && !cols.some(c => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      console.log(`  → migrasi: ${table}.${column} ditambahkan`);
    }
  }

  // ── Backfill landing section ──
  // Section baru (aboutpage, detail, chrome, dst.) hanya otomatis ada di DB
  // yang baru di-seed. DB lama perlu diisi ulang, tapi tanpa menimpa
  // nilai yang mungkin sudah diedit lewat admin.
  const insMissing = db.prepare(`
    INSERT INTO landing_sections (id, enabled, content_json)
    VALUES (?, ?, ?)
  `);
  for (const [secId, secData] of Object.entries(INITIAL_LANDING)) {
    const row = db.prepare('SELECT id, content_json FROM landing_sections WHERE id = ?').get(secId);
    if (!row) {
      insMissing.run(secId, secData.enabled !== false ? 1 : 0, JSON.stringify(secData));
      console.log(`  → backfill: landing section "${secId}" dibuat`);
      continue;
    }
    // Section sudah ada: tambahkan hanya key yang belum punya,
    // supaya hasil edit lewat admin tidak tertimpa.
    const current = parseJSON(row.content_json, {});
    const added = Object.keys(secData).filter(k => !(k in current));
    if (added.length) {
      const merged = { ...secData, ...current };
      db.prepare('UPDATE landing_sections SET content_json = ? WHERE id = ?')
        .run(JSON.stringify(merged), secId);
      console.log(`  → backfill: "${secId}" +${added.length} field baru (${added.join(', ')})`);
    }
  }

  // Hero sekarang membaca nama/role/bio dari tabel profile. Key lama di
  // landing_sections masih ada di DB lama dan akan membayangi, jadi dibuang.
  const heroRow = db.prepare('SELECT content_json FROM landing_sections WHERE id = ?').get('hero');
  if (heroRow) {
    const hero = parseJSON(heroRow.content_json, {});
    const stale = ['title', 'role', 'bio'].filter(k => k in hero);
    if (stale.length) {
      stale.forEach(k => delete hero[k]);
      db.prepare('UPDATE landing_sections SET content_json = ? WHERE id = ?')
        .run(JSON.stringify(hero), 'hero');
      console.log(`  → migrasi: hero.${stale.join(', hero.')} dihapus (sekarang dari profile)`);
    }
  }

  // Sync concise copy to existing DB rows so decluttered text takes effect immediately
  db.prepare(`
    UPDATE profile SET
      bio = ?,
      longbio = ?,
      avatar = 'assets/profil.png'
    WHERE id = 1
  `).run(INITIAL_PROFILE.bio, INITIAL_PROFILE.longbio);

  for (const secKey of ['hero', 'about', 'skills', 'certs', 'contact', 'chrome']) {
    if (INITIAL_LANDING[secKey]) {
      db.prepare('UPDATE landing_sections SET content_json = ? WHERE id = ?')
        .run(JSON.stringify(INITIAL_LANDING[secKey]), secKey);
    }
  }
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
  bio: 'Mahasiswa Manajemen Informatika Politeknik LP3I Pekanbaru yang membangun aplikasi web, desktop POS, dan mobile untuk kebutuhan nyata.',
  longbio: 'Saya M Ihwal Maulana (WalZetass), mahasiswa Manajemen Informatika di Politeknik LP3I Pekanbaru yang aktif memimpin organisasi kampus sekaligus membangun sistem perangkat lunak mandiri yang siap pakai di lapangan.',
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
    eyebrow: 'INFORMATICS STUDENT · PEKANBARU',
    btn1Text: 'Lihat Proyek',
    btn1Link: '#projects',
    btn2Text: 'Hubungi Saya',
    btn2Link: '#contact',
    portraitAlt: 'M Ihwal Maulana - Formal',
    anonAvatar: 'assets/anonim.png',
    anonAlt: 'M Ihwal Maulana - Anonymous',
    scrollTag: 'SCROLL',
    focusText: '',
    coreTech: ['JavaScript', 'TypeScript', 'React.js', 'Node.js', 'Electron', 'Android Java', 'SQLite', 'Gemini API'],
    glanceLabels: ['TEKNOLOGI INTI', 'KARYA UNGGULAN'],
    featuredProjects: [
      { title: 'WariPOS Suite', desc: 'Kasir desktop & mobile offline-first', link: 'project-detail.html?id=waripos' },
      { title: 'Sistem Absensi QR LCC', desc: 'Presensi QR real-time organisasi', link: 'project-detail.html?id=absensi-lcc' },
      { title: 'KTM Digital', desc: 'Identitas mahasiswa terverifikasi QR', link: 'project-detail.html?id=ktm-digital' }
    ]
  },
  marquee: {
    enabled: true,
    text: ''
  },
  about: {
    enabled: true,
    label: '02 — Tentang',
    headline: 'Rekayasa sistem<br>yang <em>berdaya guna</em>',
    text1: 'Saya <strong>M Ihwal Maulana</strong> (<em>WalZetass</em>), mahasiswa Manajemen Informatika di Politeknik LP3I Pekanbaru yang aktif memimpin organisasi kampus sekaligus membangun sistem perangkat lunak mandiri yang siap pakai di lapangan.',
    text2: '',
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
    btnLink: 'projects.html',
    // Chrome halaman projects.html
    pageLabel: 'Karya Pilihan',
    pageHeadline: 'Sistem & Aplikasi<br><em>berorientasi solusi nyata</em>',
    pageSub: 'Kumpulan proyek yang saya bangun sendiri: aplikasi web, mobile, desktop & POS, backend REST API, sampai perkakas berbasis AI.',
    pageMetaPeriod: '2023 – Sekarang',
    pageMetaEcosystem: 'WalZetass-Kar Ecosystem',
    filterLabels: ['Semua', 'Unggulan', 'Web App', 'Desktop & POS', 'Mobile App', 'AI Tools', 'Backend'],
    ctaLabel: 'Punya ide proyek?',
    ctaHeadline: 'Mari bangun<br><em>sesuatu yang hebat</em>',
    ctaBtnText: 'Hubungi Saya →',
    ctaBtnLink: '#contact',
    emptyText: 'Belum ada karya yang dipublikasikan.'
  },
  // ── Konten halaman about.html (sebelumnya 100% hardcoded) ──
  aboutpage: {
    enabled: true,
    kicker: 'Pekanbaru, Riau, Indonesia · Mahasiswa Manajemen Informatika & Developer',
    statement: 'Saya merancang sistem<br>yang <em>efisien</em> dan<br>berorientasi <em>solusi nyata.</em>',
    metaRows: [
      { label: 'Nama', value: 'M Ihwal Maulana' },
      { label: 'Akun', value: 'WalZetass' },
      { label: 'Lokasi', value: 'Pekanbaru, Indonesia' },
      { label: 'Fokus', value: 'Aplikasi Bisnis & Native System' },
      { label: 'Status', value: 'Aktif Mahasiswa LP3I' }
    ],
    body: [
      'Saya adalah mahasiswa Manajemen Informatika di Politeknik LP3I Kampus Pekanbaru sekaligus pengembang perangkat lunak independen. Berfokus pada perancangan sistem yang benar-benar dipakai di lapangan, bukan sekadar demo yang berhenti di layar.',
      'Pendekatan rekayasa saya berakar dari pemecahan masalah konkret di lapangan: bagaimana sistem tetap andal bekerja tanpa koneksi internet, bagaimana alur data kas tetap presisi, dan bagaimana antarmuka maniac-mempermudah pengguna harian.',
      'Ketika tidak sedang membuat kode, saya aktif dalam organisasi BEM Politeknik LP3I Pekanbaru pada Divisi Kominfo & Media Kreatif, mendalami Google GenAI SDK, dan mengelola 21+ repositori open source di GitHub.'
    ],
    manifesto: 'Kode adalah instrumen. Solusi nyata adalah dampaknya.',
    counters: [
      { target: 21, suffix: '+', label: 'Repositori GitHub', source: 'static' },
      { target: 0, suffix: '+', label: 'Sistem Mandiri Selesai', source: 'projects' },
      { target: 0, suffix: '+', label: 'Kredensial Kompetensi', source: 'certificates' },
      { target: 100, suffix: '%', label: 'Dedikasi & Kesiapan', source: 'static' }
    ],
    chapters: [
      { num: '01', label: 'Tentang' },
      { num: '02', label: 'Toolbox' },
      { num: '03', label: 'Pengalaman' },
      { num: '04', label: 'Pendidikan' },
      { num: '05', label: 'Kredensial' },
      { num: '06', label: 'Kontak' }
    ],
    toolbox: {
      label: 'Alat & Teknologi',
      title: 'Keahlian di balik<br>setiap <em>karya</em>',
      intro: 'Rangkaian teknologi yang dikurasi — bukan sekadar setiap alat yang ada, melainkan alat yang membuat hasil karya lebih baik.'
    },
    journey: {
      label: 'Perjalanan Nyata',
      title: 'Jejak akademis,<br>organisasi & <em>rekayasa</em>'
    },
    education: {
      label: 'Latar Belakang Akademis',
      title: 'Fondasi<br><em>pengetahuan</em>'
    },
    credentials: {
      label: 'Sertifikasi',
      title: 'Bukti<br><em>pembelajaran</em>',
      intro: 'Setiap sertifikasi adalah investasi yang disengaja — mengonfirmasi kompetensi teknis dan pemahaman arsitektural.'
    },
    contact: {
      headline: 'MARI\nKITA\nBANGUN.',
      tagline: 'Terbuka untuk kolaborasi proyek, pengembangan sistem,<br>dan peluang rekayasa perangkat lunak.',
      channelTitle: 'Kanal Komunikasi',
      responseTitle: 'Waktu respon',
      responseBody: 'Saya biasanya merespons dalam <strong>24 jam</strong> pada hari kerja. Untuk proyek mendesak, beri tanda [MENDESAK] pada subjek pesan.',
      hoursTitle: 'Jam kerja',
      hoursBody: 'WIB (UTC+7) · Sen–Jum<br>09:00 — 18:00 waktu lokal',
      hoursNote: 'Tersedia untuk kolaborasi asinkron di zona waktu mana pun.',
      availStatus: 'Tersedia untuk proyek',
      availNext: 'Slot terdekat: <strong>Oktober 2026</strong>'
    }
  },
  // ── Label & tombol di project-detail.html ──
  detail: {
    enabled: true,
    backLink: '← Kembali ke Karya',
    breadcrumbLabel: 'Studi Kasus',
    summaryLabel: 'Ringkasan',
    stackLabel: 'Stack Teknologi',
    challengesTitle: 'Tantangan nyata yang <em>dihadapi</em>',
    challengesLabel: 'Tantangan',
    solutionTitle: 'Pendekatan teknis yang <em>berhasil</em>',
    solutionLabel: 'Solusi',
    resultsTitle: 'Dampak nyata <em>terukur</em>',
    resultsLabel: 'Hasil',
    galleryTitle: 'Tangkapan <em>layar lainnya</em>',
    galleryLabel: 'Galeri',
    nextLabel: 'Proyek Selanjutnya',
    tocLabels: ['Ringkasan', 'Tangkapan Layar', 'Tantangan', 'Solusi', 'Detail', 'Hasil', 'Galeri'],
    notFoundTitle: 'Proyek Tidak Ditemukan',
    notFoundBody: 'Proyek yang Anda cari tidak tersedia.'
  },
  // ── Chrome global: nav, brand, form, footer ──
  chrome: {
    enabled: true,
    brand: 'WalZetass',
    navLabels: ['Tentang', 'Karya', 'Keahlian', 'Perjalanan', 'Sertifikasi', 'Kontak'],
    formName: 'Nama',
    formEmail: 'Email',
    formProject: 'Topik / Proyek',
    formMessage: 'Pesan',
    formPlaceholderName: 'Nama Anda',
    formPlaceholderEmail: 'email@domain.com',
    formPlaceholderProject: 'Web · POS · Android · AI',
    formPlaceholderMessage: 'Tulis pesan singkat Anda...',
    formSubmit: 'Kirim Pesan',
    formSending: 'Mengirim…',
    formErrEmpty: 'Harap lengkapi semua kolom…',
    formErrEmail: 'Format email tidak valid.',
    formOk: 'Pesan terkirim. Terima kasih!',
    formFail: 'Gagal mengirim. Coba lagi atau hubungi via email.',
    copyEmailBtn: 'Salin Email',
    copyEmailOk: '✓ Tersalin!',
    glanceOverlay: 'Lihat Studi Kasus ↗',
    emptyProjects: 'Belum ada karya yang dipublikasikan.',
    emptySkills: 'Belum ada keahlian yang dicatat.',
    emptyTimeline: 'Belum ada perjalanan yang dicatat.',
    emptyCerts: 'Belum ada kredensial yang dicatat.'
  },
  skills: {
    enabled: true,
    label: '04 — Keahlian',
    headline: 'Alat &<br><em>Teknologi Nyata</em>',
    intro: ''
  },
  experience: {
    enabled: true,
    label: '05 — Jejak Perjalanan',
    headline: 'Pendidikan &<br><em>Kontribusi</em>'
  },
  certs: {
    enabled: true,
    label: '06 — Kredensial',
    headline: 'Sertifikasi & <em>Kompetensi</em>'
  },
  contact: {
    enabled: true,
    label: '07 — Kontak',
    headline: 'Mari bangun<br>sesuatu yang <em>berdampak</em>',
    sub: 'Terbuka untuk kolaborasi proyek dan diskusi teknis.',
    email: 'mihwalmaulana09@gmail.com'
  }
};

const INITIAL_PROJECTS = [
  {
    id: 'waripos',
    slug: 'waripos',
    num: '01',
    title: 'WariPOS — Point of Sale<br><em>&amp; Retail Management</em>',
    title_plain: 'WariPOS — Point of Sale & Retail Management',
    tagline: 'Sistem kasir dan manajemen ritel multi-platform dengan arsitektur offline-first, pencetakan struk termal ESC/POS dinamis, rekonsiliasi kas shift, dan sinkronisasi inventori.',
    desc: 'UMKM dan toko ritel kerap mengalami antrean tersendat serta risiko kehilangan transaksi saat koneksi internet terputus. WariPOS dirancang dengan arsitektur offline-first berbasis SQLite lokal sehingga transaksi kasir, pemotongan stok, pembuatan nota termal ESC/POS 58mm/80mm, dan audit kas shift berjalan instan tanpa ketergantungan jaringan.',
    category: 'Desktop & Mobile POS',
    year: '2024 — 2026',
    role: 'Lead System Developer',
    duration: 'Pengembangan Berkelanjutan',
    status: 'published',
    live_url: 'https://github.com/WalZetass-kar/WariPOS/releases/latest',
    github_url: 'https://github.com/WalZetass-kar/WariPOS',
    cover: 'assets/mockups/dashboard-main.svg',
    spread1: 'assets/mockups/waripos-icon.png',
    spread2: 'assets/mockups/dashboard-main.svg',
    fullwidth: 'assets/mockups/ecommerce-main.svg',
    stack: ['Electron', 'Capacitor', 'React', 'TypeScript', 'SQLite (Drizzle ORM)', 'Thermal ESC/POS'],
    overview_title: 'Keandalan Operasional Ritel Penuh<br>Tanpa <em>Ketergantungan Internet</em>',
    overview_body1: 'UMKM dan toko ritel kerap mengalami antrean tersendat dan risiko kehilangan transaksi saat koneksi internet terputus. WariPOS dirancang dengan prinsip offline-first menyeluruh: seluruh transaksi kasir, pemotongan stok, pembuatan nota, dan pencatatan shift disimpan langsung di database SQLite lokal perangkat.',
    overview_body2: 'Mendukung pemindai barcode USB/kamera, pencetakan struk termal ESC/POS (58mm/80mm) dengan Dynamic Stacking agar teks nota tidak saling bertumpuk, ekspor PDF kontinu, serta pembagian nota digital langsung ke WhatsApp pelanggan.',
    challenges: [
      {
        title: 'Integritas Transaksi Offline & Rekonsiliasi Kas',
        body: 'Menjamin konsistensi pemotongan stok dan audit uang fisik kasir (Open/Close Shift) di SQLite lokal tanpa selisih data.'
      },
      {
        title: 'Pencetakan Struk Termal ESC/POS Dinamis',
        body: 'Mengatasi keterbatasan lebar kertas printer termal dengan dynamic vertical stacking agar nama barang panjang dan harga tetap rapi di kertas 58mm maupun 80mm.'
      },
      {
        title: 'Basis Kode Tunggal Desktop & Android',
        body: 'Menyatukan arsitektur TypeScript dan komponen React untuk aplikasi desktop Windows/Linux (Electron) serta perangkat kasir mobile Android (Capacitor).'
      }
    ],
    solution_paras: [
      '<strong>Arsitektur Offline-First:</strong> Memanfaatkan SQLite lokal dengan Drizzle ORM untuk pemrosesan transaksi berkecepatan tinggi tanpa latensi jaringan.',
      '<strong>ESC/POS &amp; Dynamic Stacking:</strong> Engine pencetakan nota kustom mendukung printer Bluetooth dan USB, ekspor PDF kontinu, serta pengiriman nota instan via WhatsApp.',
      '<strong>Audit Kas &amp; Inventori:</strong> Fitur buka/tutup kasir (Open/Close Shift) dengan perhitungan surplus/defisit otomatis, Held Carts (antrean transaksi tertunda), serta notifikasi Low Stock Alert.'
    ],
    results: [
      { num: '100% Offline', label: 'Transaksi & stok berjalan penuh tanpa koneksi internet' },
      { num: '58 / 80mm', label: 'Dukungan printer termal ESC/POS Bluetooth & USB' },
      { num: 'Shift Audit', label: 'Rekonsiliasi kas fisik buka/tutup shift otomatis' },
      { num: 'Multi-OS', label: 'Tersedia untuk Windows, Linux (Electron) & Android APK' }
    ],
    gallery: [
      { src: 'assets/mockups/dashboard-main.svg', caption: 'Antarmuka Kasir & Manajemen Inventori WariPOS' },
      { src: 'assets/mockups/waripos-icon.png', caption: 'Identitas Aplikasi WariPOS Suite' },
      { src: 'assets/mockups/ecommerce-main.svg', caption: 'Katalog Produk, Held Cart & Rekonsiliasi Shift' }
    ],
    next_id: 'absensi-lcc',
    next_title: 'Sistem Absensi QR<br><em>LP3I Computer Club</em>',
    featured: 1,
    order_index: 1
  },
  {
    id: 'absensi-lcc',
    slug: 'absensi-lcc',
    num: '02',
    title: 'Sistem Absensi QR<br><em>LP3I Computer Club</em>',
    title_plain: 'Sistem Absensi QR — LP3I Computer Club (LCC)',
    tagline: 'Sistem pencatatan kehadiran anggota organisasi LP3I Computer Club berbasis pemindaian QR Code real-time untuk menggantikan rekapitulasi absensi manual.',
    desc: 'Lahir dari kebutuhan langsung saat memimpin LP3I Computer Club (LCC) di Politeknik LP3I Pekanbaru. Sebelumnya pencatatan kehadiran pertemuan rutin dan kelas praktikum dilakukan secara manual sehingga rawan antrean dan rekapitulasi lambat. Sistem ini mengotomatisasi validasi kehadiran anggota lewat scan QR dan menyajikan rekap kehadiran pengurus secara langsung.',
    category: 'Web Application',
    year: '2025 — 2026',
    role: 'Full-Stack Developer & Pengurus LCC',
    duration: 'Digunakan Internal Organisasi',
    status: 'published',
    live_url: '',
    github_url: 'https://github.com/WalZetass-kar',
    cover: 'assets/mockups/dashboard-main.svg',
    spread1: 'assets/mockups/dashboard-main.svg',
    spread2: 'assets/mockups/ecommerce-main.svg',
    fullwidth: 'assets/mockups/dashboard-main.svg',
    stack: ['JavaScript', 'Node.js', 'Express.js', 'SQL', 'HTML5 & CSS3', 'QR Code Scanner'],
    overview_title: 'Digitalisasi Kehadiran Anggota<br><em>LP3I Computer Club</em>',
    overview_body1: 'Sebagai pengurus LP3I Computer Club (LCC), saya mengamati proses absensi kertas dan form manual sering menghambat jalannya sesi pelatihan rutin serta menyulitkan evaluasi keaktifan anggota setiap semester.',
    overview_body2: 'Sistem Absensi LCC dibangun agar setiap anggota cukup memindai QR Code sesi kegiatan. Data kehadiran tercatat otomatis beserta waktu presensi, divisi, dan status kehadiran, siap diekspor oleh pengurus.',
    challenges: [
      {
        title: 'Antrean Presensi Saat Kegiatan Dimulai',
        body: 'Puluhan anggota hadir bersamaan di awal sesi sehingga proses input manual memakan waktu 15–20 menit.'
      },
      {
        title: 'Validasi Keanggotaan & Duplikasi Presensi',
        body: 'Mencegah input ganda pada sesi yang sama serta memastikan hanya anggota terdaftar yang tercatat hadir.'
      },
      {
        title: 'Rekapitulasi Keaktifan Pengurus & Anggota',
        body: 'Menyajikan laporan kehadiran per pertemuan dan akumulasi semester tanpa perlu menggabungkan lembar data manual.'
      }
    ],
    solution_paras: [
      '<strong>Pemindaian QR Instan:</strong> Menghadirkan modul pemindaian QR berbasis kamera web/perangkat seluler dengan validasi token sesi unik.',
      '<strong>Pencegahan Duplikasi di Database:</strong> Constraint relasional memastikan satu identitas anggota hanya tercatat satu kali per sesi kegiatan.',
      '<strong>Dasbor Rekapitulasi Langsung:</strong> Pengurus LCC dapat memantau daftar hadir real-time dan mengunduh rekap keaktifan anggota.'
    ],
    results: [
      { num: 'QR Scan', label: 'Verifikasi kehadiran anggota dalam hitungan detik' },
      { num: 'Real-Time', label: 'Dasbor rekapitulasi langsung untuk pengurus LCC' },
      { num: 'Zero Dup', label: 'Validasi sesi otomatis tanpa pencatatan ganda' }
    ],
    gallery: [
      { src: 'assets/mockups/dashboard-main.svg', caption: 'Dasbor Rekapitulasi Kehadiran Anggota LCC' },
      { src: 'assets/mockups/mobile-main.svg', caption: 'Tampilan Pemindaian QR Presensi Kegiatan' }
    ],
    next_id: 'ktm-digital',
    next_title: 'KTM Digital<br><em>Verifikasi QR Mahasiswa</em>',
    featured: 1,
    order_index: 2
  },
  {
    id: 'ktm-digital',
    slug: 'ktm-digital',
    num: '03',
    title: 'KTM Digital — Kartu Tanda<br><em>Mahasiswa Terverifikasi QR</em>',
    title_plain: 'KTM Digital — Kartu Tanda Mahasiswa Terverifikasi QR',
    tagline: 'Aplikasi identitas Kartu Tanda Mahasiswa (KTM) digital berbasis web dengan fitur verifikasi keaktifan mahasiswa instan melalui pemindaian QR Code.',
    desc: 'Dirancang untuk menjawab kendala mahasiswa yang kerap lupa membawa kartu fisik saat mengikuti kegiatan kampus, ujian, atau acara organisasi BEM & LCC. KTM Digital menampilkan identitas resmi mahasiswa yang responsif di ponsel lengkap dengan QR Code unik untuk verifikasi status aktif secara cepat.',
    category: 'Web Application',
    year: '2025 — 2026',
    role: 'Full-Stack Developer',
    duration: 'Inisiatif Kampus & Organisasi',
    status: 'published',
    live_url: '',
    github_url: 'https://github.com/WalZetass-kar',
    cover: 'assets/mockups/mobile-main.svg',
    spread1: 'assets/mockups/mobile-main.svg',
    spread2: 'assets/mockups/dashboard-main.svg',
    fullwidth: 'assets/mockups/mobile-main.svg',
    stack: ['TypeScript', 'React.js', 'Next.js', 'Tailwind CSS', 'SQL', 'QR Verification'],
    overview_title: 'Identitas Mahasiswa Digital<br>yang <em>Mudah Diverifikasi</em>',
    overview_body1: 'Kartu mahasiswa fisik sering tertinggal atau rusak ketika dibutuhkan untuk verifikasi administrasi kegiatan kemahasiswaan. KTM Digital menyediakan kartu identitas di peramban ponsel yang dapat diakses kapan saja.',
    overview_body2: 'Setiap kartu dilengkapi kode QR terenkripsi yang ketika dipindai oleh panitia atau pengurus organisasi akan menampilkan halaman validasi profil mahasiswa (NIM, Program Studi, dan status aktif).',
    challenges: [
      {
        title: 'Keamanan & Keaslian Identitas Kartu',
        body: 'Memastikan tampilan KTM digital tidak sekadar gambar statis, melainkan terhubung ke endpoint verifikasi QR yang valid.'
      },
      {
        title: 'Kenyamanan Akses di Layar Seluler',
        body: 'Merancang tata letak kartu proporsional yang tajam di berbagai ukuran layar smartphone dengan kontras QR tinggi agar mudah dipindai.'
      }
    ],
    solution_paras: [
      '<strong>Endpoint Verifikasi QR:</strong> Setiap kode QR mengarah ke rute verifikasi unik yang memeriksa kecocokan NIM dan status mahasiswa di database.',
      '<strong>Desain Mobile-First Responsif:</strong> Antarmuka kartu dirancang ringan dengan pemuatan cepat bahkan pada jaringan seluler kampus yang terbatas.'
    ],
    results: [
      { num: 'QR Verify', label: 'Validasi keaslian identitas mahasiswa via pemindaian QR' },
      { num: 'Mobile UI', label: 'Akses instan kartu mahasiswa langsung dari smartphone' },
      { num: 'Terintegrasi', label: 'Mendukung ekosistem kegiatan BEM & organisasi kampus' }
    ],
    gallery: [
      { src: 'assets/mockups/mobile-main.svg', caption: 'Tampilan Kartu Tanda Mahasiswa Digital & Kode QR' },
      { src: 'assets/mockups/dashboard-main.svg', caption: 'Halaman Validasi Status Mahasiswa' }
    ],
    next_id: 'carikostkita',
    next_title: 'CariKostKita<br><em>Android App</em>',
    featured: 1,
    order_index: 3
  },
  {
    id: 'carikostkita',
    slug: 'carikostkita',
    num: '04',
    title: 'CariKostKita<br><em>Android Native App</em>',
    title_plain: 'CariKostKita — Aplikasi Pencarian Kost Android',
    tagline: 'Aplikasi Android native untuk eksplorasi dan pemetaan hunian kost di Pekanbaru dengan filter fasilitas, penyimpanan favorit Room SQLite offline, dan integrasi Google Maps.',
    desc: 'Mahasiswa rantau di Pekanbaru sering kesulitan membandingkan harga, fasilitas, dan lokasi kost secara akurat karena informasi tersebar di media sosial. CariKostKita hadir sebagai aplikasi Android native (Java & Material Design 3) dengan penyimpanan lokal Room SQLite, pencarian multi-kriteria, serta tombol navigasi Google Maps dan kontak WhatsApp pemilik kost.',
    category: 'Mobile App (Android)',
    year: '2025 — 2026',
    role: 'Android Developer',
    duration: 'Proyek Mandiri',
    status: 'published',
    live_url: '',
    github_url: 'https://github.com/WalZetass-kar',
    cover: 'assets/mockups/mobile-main.svg',
    spread1: 'assets/mockups/carikostkita-icon.png',
    spread2: 'assets/mockups/mobile-main.svg',
    fullwidth: 'assets/mockups/mobile-main.svg',
    stack: ['Android SDK (Java)', 'Material Design 3', 'Room SQLite', 'Google Maps Intent', 'RecyclerView'],
    overview_title: 'Memudahkan Mahasiswa Rantau<br>Menemukan <em>Hunian Tepat</em>',
    overview_body1: 'Pencarian tempat kost bagi mahasiswa baru di Pekanbaru kerap memakan waktu karena informasi harga, sisa kamar, dan titik lokasi tidak terstruktur.',
    overview_body2: 'CariKostKita dibangun menggunakan Android SDK (Java) dan arsitektur Room Database sehingga daftar kost favorit tetap dapat dibuka secara offline saat survei langsung ke lokasi.',
    challenges: [
      {
        title: 'Akses Data Kost Saat Survei Lapangan',
        body: 'Menyimpan daftar kost favorit dan detail fasilitas secara lokal di perangkat menggunakan Room SQLite agar tetap bisa diakses meski sinyal seluler lemah.'
      },
      {
        title: 'Integrasi Navigasi & Komunikasi Langsung',
        body: 'Menghubungkan halaman detail kost langsung ke rute Google Maps Intent dan percakapan WhatsApp pemilik kost dalam satu ketukan.'
      }
    ],
    solution_paras: [
      '<strong>Arsitektur Room SQLite:</strong> Menyediakan caching lokal dan fitur markah (bookmark) hunian kost pilihan.',
      '<strong>Filter Harga &amp; Kategori Kost:</strong> Memfilter kost putra, putri, atau campur beserta rentang harga bulanan dan fasilitas utama.',
      '<strong>Deep-Link Intent Android:</strong> Integrasi langsung dengan aplikasi Google Maps untuk petunjuk arah dan WhatsApp untuk negosiasi kamar.'
    ],
    results: [
      { num: 'Native Java', label: 'Performa ringan dengan komponen Material Design 3' },
      { num: 'Room DB', label: 'Penyimpanan daftar kost favorit secara offline' },
      { num: 'Maps Intent', label: 'Navigasi langsung ke titik koordinat hunian kost' }
    ],
    gallery: [
      { src: 'assets/mockups/mobile-main.svg', caption: 'Antarmuka Daftar & Detail Hunian CariKostKita' },
      { src: 'assets/mockups/carikostkita-icon.png', caption: 'Identitas Aplikasi CariKostKita Android' }
    ],
    next_id: 'duochat',
    next_title: 'Duo Chat<br><em>Private Messenger</em>',
    featured: 1,
    order_index: 4
  },
  {
    id: 'duochat',
    slug: 'duochat',
    num: '05',
    title: 'Duo Chat<br><em>(ChatPrivate 1-on-1)</em>',
    title_plain: 'Duo Chat (ChatPrivate) — Private Messenger',
    tagline: 'Aplikasi perpesanan eksklusif dua arah (1-on-1 private messenger) dengan autentikasi sesi aman, pairing invitation token real-time, dan antarmuka fokus privasi.',
    desc: 'Aplikasi chat umum sering penuh dengan distraksi grup dan notifikasi massal. Duo Chat (ChatPrivate) dirancang khusus sebagai ruang komunikasi privat dua orang dengan sistem tautan undangan (pairing token), sinkronisasi pesan real-time berbasis Supabase, dan kontrol penuh atas riwayat percakapan.',
    category: 'Web Application',
    year: '2026',
    role: 'Full-Stack Developer',
    duration: 'Proyek Mandiri',
    status: 'published',
    live_url: '',
    github_url: 'https://github.com/WalZetass-kar',
    cover: 'assets/mockups/duochat-screen.png',
    spread1: 'assets/mockups/duochat-screen.png',
    spread2: 'assets/mockups/dashboard-main.svg',
    fullwidth: 'assets/mockups/duochat-screen.svg',
    stack: ['React.js', 'Tailwind CSS', 'Supabase Realtime', 'Google OAuth', 'Web Crypto API'],
    overview_title: 'Ruang Komunikasi Privat<br>Tanpa <em>Distraksi Sosial</em>',
    overview_body1: 'Duo Chat membatasi koneksi secara eksklusif untuk dua pengguna yang saling terhubung melalui kode undangan terverifikasi (pairing token).',
    overview_body2: 'Memanfaatkan Supabase Realtime untuk pengiriman pesan instan, indikator status baca, serta kebijakan Row-Level Security (RLS) ketat sehingga hanya pasangan ruang chat terkait yang dapat membaca pesan.',
    challenges: [
      {
        title: 'Mekanisme Pairing Dua Pengguna yang Aman',
        body: 'Memastikan proses penyambungan akun hanya bisa dilakukan lewat token undangan sekali pakai tanpa mengekspos daftar pengguna publik.'
      },
      {
        title: 'Sinkronisasi Pesan Real-Time & Keamanan RLS',
        body: 'Menjaga latensi pesan tetap rendah sembari menerapkan Row-Level Security di PostgreSQL/Supabase.'
      }
    ],
    solution_paras: [
      '<strong>Pairing Token Eksklusif:</strong> Sistem pembuatan dan klaim kode pasangan unik untuk mengunci ruang percakapan 1-on-1.',
      '<strong>Supabase Realtime &amp; RLS:</strong> Langganan perubahan tabel pesan secara langsung dengan proteksi akses tingkat baris.'
    ],
    results: [
      { num: '1-on-1 Lock', label: 'Ruang percakapan privat dengan pairing token unik' },
      { num: 'Realtime', label: 'Sinkronisasi pesan instan via Supabase WebSockets' },
      { num: 'RLS Policy', label: 'Isolasi akses data ketat di level database' }
    ],
    gallery: [
      { src: 'assets/mockups/duochat-screen.png', caption: 'Tangkapan Layar Antarmuka Duo Chat (ChatPrivate)' }
    ],
    next_id: 'civic-report',
    next_title: 'Civic Report<br><em>Platform Pengaduan AI</em>',
    featured: 1,
    order_index: 5
  },
  {
    id: 'civic-report',
    slug: 'civic-report',
    num: '06',
    title: 'Civic Report<br><em>Platform Pengaduan Publik AI</em>',
    title_plain: 'Civic Report — Platform Pengaduan Infrastruktur Berbasis AI',
    tagline: 'Platform pelaporan kerusakan infrastruktur publik dengan analisis foto otomatis menggunakan Google Gemini Vision, pengelompokan lokasi Haversine, dan pemetaan interaktif.',
    desc: 'Laporan warga terkait jalan rusak, lampu jalan mati, atau drainase tersumbat sering kali menumpuk akibat duplikasi laporan di titik yang sama dan kurangnya deskripsi awal. Civic Report mengintegrasikan Google Gemini API untuk menganalisis foto laporan secara otomatis, mengklasifikasikan tingkat urgensi, serta mengelompokkan laporan berdekatan menggunakan rumus spasial Haversine pada peta Leaflet GIS.',
    category: 'AI & Geospatial Web',
    year: '2025',
    role: 'Full-Stack & AI Developer',
    duration: 'Eksplorasi AI & GIS',
    status: 'published',
    live_url: '',
    github_url: 'https://github.com/WalZetass-kar',
    cover: 'assets/mockups/ecommerce-main.svg',
    spread1: 'assets/mockups/dashboard-main.svg',
    spread2: 'assets/mockups/ecommerce-main.svg',
    fullwidth: 'assets/mockups/dashboard-main.svg',
    stack: ['Next.js', 'Google Gemini API', 'Leaflet GIS', 'Node.js', 'MySQL'],
    overview_title: 'Verifikasi & Pemetaan Laporan Warga<br>Berbantuan <em>Google Gemini AI</em>',
    overview_body1: 'Civic Report memudahkan warga mengirimkan foto kerusakan fasilitas umum beserta titik koordinat GPS langsung dari peramban.',
    overview_body2: 'Model multimodal Google Gemini menganalisis foto yang diunggah untuk mengidentifikasi jenis kerusakan infrastruktur dan menyusun ringkasan teknis, sementara algoritma Haversine menggabungkan laporan yang berada dalam radius berdekatan.',
    challenges: [
      {
        title: 'Duplikasi Laporan pada Titik Lokasi yang Sama',
        body: 'Banyak warga melaporkan kerusakan jalan yang sama sehingga daftar laporan menjadi berulang.'
      },
      {
        title: 'Klasifikasi Awal Foto Laporan Warga',
        body: 'Menyaring foto yang relevan dan mengekstrak kategori serta tingkat keparahan kerusakan secara otomatis.'
      }
    ],
    solution_paras: [
      '<strong>Integrasi Google Gemini Vision:</strong> Menganalisis citra laporan untuk menghasilkan deskripsi awal, kategori infrastruktur, dan estimasi tingkat urgensi.',
      '<strong>Clustering Spasial Haversine &amp; Leaflet GIS:</strong> Menghitung jarak antartitik koordinat untuk mengelompokkan laporan serupa pada satu penanda peta interaktif.'
    ],
    results: [
      { num: 'Gemini AI', label: 'Klasifikasi & ringkasan otomatis dari foto laporan' },
      { num: 'Haversine', label: 'Pengelompokan laporan dalam radius koordinat terdekat' },
      { num: 'Leaflet GIS', label: 'Visualisasi peta sebaran laporan infrastruktur publik' }
    ],
    gallery: [
      { src: 'assets/mockups/ecommerce-main.svg', caption: 'Peta Interaktif & Katalog Laporan Infrastruktur' },
      { src: 'assets/mockups/dashboard-main.svg', caption: 'Dasbor Analisis & Status Penanganan Laporan' }
    ],
    next_id: 'waripos',
    next_title: 'WariPOS — Point of Sale<br><em>&amp; Retail Management</em>',
    featured: 1,
    order_index: 6
  }
];

const INITIAL_SKILLS = [];

const INITIAL_EXPERIENCE = [
  {
    id: 'exp_bem_lp3i',
    role: 'Divisi Kominfo & Media Kreatif',
    company: 'BEM Politeknik LP3I Pekanbaru',
    location: 'Pekanbaru, Riau',
    period: '2025 — Sekarang',
    desc: 'Mengelola komunikasi publik dan publikasi digital organisasi mahasiswa, sekaligus menginisiasi pengembangan sistem internal seperti KTM Digital terverifikasi QR untuk mendukung administrasi kegiatan kampus.',
    highlights: ['Komunikasi Publik', 'KTM Digital QR', 'Media Kreatif', 'BEM LP3I'],
    type: 'Organisasi Kampus',
    current: 1,
    order_index: 1
  },
  {
    id: 'exp_lcc_lp3i',
    role: 'Pengurus & Pengembang Sistem Internal',
    company: 'LP3I Computer Club (LCC)',
    location: 'Politeknik LP3I Pekanbaru',
    period: '2025 — Sekarang',
    desc: 'Memimpin kegiatan komunitas pemrograman mahasiswa dan membangun Sistem Absensi QR LCC yang digunakan langsung oleh anggota untuk pencatatan kehadiran pertemuan rutin dan kelas praktikum.',
    highlights: ['Sistem Absensi QR LCC', 'Kepemimpinan Komunitas', 'Web Development', 'Mentoring'],
    type: 'Komunitas Teknis',
    current: 1,
    order_index: 2
  },
  {
    id: 'exp_independent_dev',
    role: 'Independent Software Developer',
    company: 'WalZetass-Kar Open Source Ecosystem',
    location: 'Pekanbaru · GitHub',
    period: '2023 — Sekarang',
    desc: 'Merancang dan memelihara 21+ repositori perangkat lunak mandiri lintas platform: sistem kasir ritel offline-first WariPOS (Electron, Capacitor, React, SQLite), aplikasi Android native CariKostKita, Duo Chat, dan eksperimen Google Gemini API.',
    highlights: ['WariPOS Suite', 'CariKostKita Android', 'Duo Chat', '21+ Repositori GitHub'],
    type: 'Pengembangan Mandiri',
    current: 1,
    order_index: 3
  }
];

const INITIAL_EDUCATION = [
  {
    id: 'ed1791166668989',
    degree: 'D2 Manajemen Informatika',
    institution: 'Politeknik LP3I Kampus Pekanbaru',
    period: '2025 — Sekarang',
    gpa: '3,70',
    detail: 'Fokus pada rekayasa perangkat lunak, perancangan basis data relasional, pemrograman web & mobile, serta analisis sistem informasi bisnis terapan.',
    tags: ['Manajemen Informatika', 'Basis Data', 'Rekayasa Perangkat Lunak', 'IPK 3,70'],
    order_index: 0
  },
  {
    id: 'ed1791166684663',
    degree: 'Jurusan IPA',
    institution: 'SMA Negeri 2 Kubu Babussalam',
    period: '2022 — 2025',
    gpa: '90',
    detail: 'Pendidikan menengah atas jurusan Ilmu Pengetahuan Alam dengan fokus pada matematika, logika komputasi dasar, dan eksplorasi mandiri pemrograman web.',
    tags: ['IPA', 'Nilai Rata-rata 90'],
    order_index: 1
  }
];

const INITIAL_CERTIFICATES = [
  {
    id: 'cert_lp3i_db',
    title: 'Sertifikasi Kompetensi Basis Data & Pemrograman Terstruktur',
    issuer: 'Politeknik LP3I Pekanbaru',
    year: '2025',
    desc: 'Validasi kompetensi perancangan basis data relasional, normalisasi skema, kueri SQL teroptimasi, serta logika pemrograman aplikasi bisnis terstruktur.',
    skills: ['Relational Database', 'SQL', 'Pemrograman Terstruktur'],
    url: 'https://github.com/WalZetass-kar',
    credid: 'LP3I-DB-2025',
    order_index: 1
  },
  {
    id: 'cert_gcloud_genai',
    title: 'Generative AI with Google Cloud & SDK',
    issuer: 'Google Cloud · Dicoding Indonesia',
    year: '2024',
    desc: 'Pelatihan implementasi Large Language Models, rekayasa prompt terstruktur, dan integrasi Google GenAI SDK untuk aplikasi berbasis kecerdasan buatan.',
    skills: ['Google GenAI SDK', 'Prompt Engineering', 'LLM Integration'],
    url: 'https://www.dicoding.com',
    credid: 'GC-GENAI-2024',
    order_index: 2
  },
  {
    id: 'cert_dicoding_web',
    title: 'Dasar Pemrograman Web & Arsitektur Frontend',
    issuer: 'Dicoding Indonesia · IDCamp',
    year: '2023',
    desc: 'Standardisasi pengembangan web semantik HTML5, tata letak responsif CSS Grid & Flexbox, serta manipulasi DOM dan JavaScript modern.',
    skills: ['HTML5 & CSS3', 'JavaScript ES6+', 'Responsive Web Design'],
    url: 'https://www.dicoding.com',
    credid: 'DC-WEB-2023',
    order_index: 3
  }
];
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

function hydrateFromPortfolioJsonIfEmpty() {
  try {
    const jsonPath = path.join(DATA_DIR, 'portfolio.json');
    const raw = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf8')) : {};

    // Clean any corrupted replacement characters in existing skills
    db.exec("UPDATE skills SET name = REPLACE(name, '\uFFFD', '·') WHERE name LIKE '%\uFFFD%'");

    const skillCount = db.prepare('SELECT COUNT(*) as count FROM skills').get().count;
    const skillsSource = (Array.isArray(raw.skills) && raw.skills.length > 0) ? raw.skills : INITIAL_SKILLS;
    if (skillCount === 0 && skillsSource.length > 0) {
      const insSkill = db.prepare(`
        INSERT OR IGNORE INTO skills (id, name, category, level, order_index)
        VALUES (?, ?, ?, ?, ?)
      `);
      skillsSource.forEach((s, idx) => {
        const cleanName = String(s.name || '').replace(/\uFFFD+/g, '·');
        insSkill.run(s.id || `s_${idx}`, cleanName, s.category || 'General', s.level || 'intermediate', s.order_index || idx);
      });
    }

    const projCount = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    const projSource = (Array.isArray(raw.projects) && raw.projects.length > 0) ? raw.projects : INITIAL_PROJECTS;
    if (projCount === 0 && projSource.length > 0) {
      const insProj = db.prepare(`
        INSERT OR IGNORE INTO projects (
          id, slug, num, title, title_plain, tagline, desc, category, year, role, duration,
          status, live_url, github_url, cover, spread1, spread2, fullwidth,
          stack_json, overview_title, overview_body1, overview_body2,
          challenges_json, solution_paras_json, results_json, gallery_json,
          next_id, next_title, featured, order_index
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )
      `);
      projSource.forEach((p, idx) => {
        insProj.run(
          p.id || `proj_${idx + 1}`,
          p.slug || p.id || `proj-${idx + 1}`,
          p.num || String(idx + 1).padStart(2, '0'),
          p.title || 'Proyek',
          p.title_plain || p.titlePlain || String(p.title || '').replace(/<[^>]*>?/gm, ''),
          p.tagline || '',
          p.desc || '',
          p.category || 'Web Application',
          p.year || '2025',
          p.role || 'Developer',
          p.duration || '',
          p.status || 'published',
          p.live_url !== undefined ? p.live_url : (p.liveUrl || ''),
          p.github_url !== undefined ? p.github_url : (p.githubUrl || ''),
          p.cover || 'assets/mockups/dashboard-main.svg',
          p.spread1 || p.cover || '',
          p.spread2 || 'assets/mockups/dashboard-main.svg',
          p.fullwidth || p.cover || '',
          JSON.stringify(p.stack || []),
          p.overview_title || p.overviewTitle || '',
          p.overview_body1 || p.overviewBody1 || '',
          p.overview_body2 || p.overviewBody2 || '',
          JSON.stringify(p.challenges || []),
          JSON.stringify(p.solution_paras || p.solutionParas || []),
          JSON.stringify(p.results || []),
          JSON.stringify(p.gallery || []),
          p.next_id || p.nextId || '',
          p.next_title || p.nextTitle || '',
          p.featured !== undefined ? (p.featured ? 1 : 0) : 1,
          p.order_index !== undefined ? p.order_index : (idx + 1)
        );
      });
    }

    const expCount = db.prepare('SELECT COUNT(*) as count FROM experience').get().count;
    const expSource = (Array.isArray(raw.experience) && raw.experience.length > 0) ? raw.experience : INITIAL_EXPERIENCE;
    if (expCount === 0 && expSource.length > 0) {
      const insExp = db.prepare(`
        INSERT OR IGNORE INTO experience (id, role, company, location, period, desc, highlights_json, type, current, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      expSource.forEach((e, idx) => {
        insExp.run(
          e.id || `exp_${idx + 1}`,
          e.role || '',
          e.company || '',
          e.location || '',
          e.period || '',
          e.desc || '',
          JSON.stringify(e.highlights || []),
          e.type || 'Organisasi',
          e.current ? 1 : 0,
          e.order_index !== undefined ? e.order_index : (idx + 1)
        );
      });
    }

    const eduCount = db.prepare('SELECT COUNT(*) as count FROM education').get().count;
    const eduSource = (Array.isArray(raw.education) && raw.education.length > 0) ? raw.education : INITIAL_EDUCATION;
    if (eduCount === 0 && eduSource.length > 0) {
      const insEdu = db.prepare(`
        INSERT OR IGNORE INTO education (id, degree, institution, period, gpa, detail, tags_json, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      eduSource.forEach((ed, idx) => {
        insEdu.run(
          ed.id || `ed_${idx}`,
          ed.degree || '',
          ed.institution || '',
          ed.period || '',
          ed.gpa || '',
          ed.detail || '',
          JSON.stringify(ed.tags || []),
          ed.order_index !== undefined ? ed.order_index : idx
        );
      });
    } else if (eduCount > 0) {
      // Backfill detail/tags on existing education rows if they were seeded empty
      INITIAL_EDUCATION.forEach((ed) => {
        db.prepare(`
          UPDATE education
          SET degree = CASE WHEN degree = 'D2 Manajement Informatika' THEN ? ELSE degree END,
              detail = CASE WHEN detail IS NULL OR detail = '' THEN ? ELSE detail END,
              tags_json = CASE WHEN tags_json IS NULL OR tags_json = '[]' THEN ? ELSE tags_json END
          WHERE id = ?
        `).run(ed.degree, ed.detail, JSON.stringify(ed.tags), ed.id);
      });
    }

    const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
    const certSource = (Array.isArray(raw.certificates) && raw.certificates.length > 0) ? raw.certificates : INITIAL_CERTIFICATES;
    if (certCount === 0 && certSource.length > 0) {
      const insCert = db.prepare(`
        INSERT OR IGNORE INTO certificates (id, title, issuer, year, desc, skills_json, url, credid, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      certSource.forEach((c, idx) => {
        insCert.run(
          c.id || `cert_${idx + 1}`,
          c.title || '',
          c.issuer || '',
          c.year || '',
          c.desc || '',
          JSON.stringify(c.skills || []),
          c.url || '#',
          c.credid || '',
          c.order_index !== undefined ? c.order_index : (idx + 1)
        );
      });
    }
  } catch (err) {
    console.warn('Warning hydrating from portfolio.json:', err.message);
  }
}

// Auto-seed on require
initSchema();
seedDatabase(false);
hydrateFromPortfolioJsonIfEmpty();
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

// Merge dalam (deep) — payload hanya menimpa key yang dikirimnya.
// Tanpa ini, satu PUT berisi satu field akan menghapus seluruh isi section.
function deepMerge(target, source) {
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (k === 'enabled') continue;
    if (v && typeof v === 'object' && !Array.isArray(v) &&
        out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function updateLandingSection(secId, data) {
  const existingRow = db.prepare('SELECT content_json FROM landing_sections WHERE id = ?').get(secId);
  const existing = existingRow ? parseJSON(existingRow.content_json, {}) : {};
  const merged = deepMerge(existing, data || {});
  const enabled = (data && data.enabled !== false) ? 1 : 0;

  const stmt = db.prepare(`
    INSERT INTO landing_sections (id, enabled, content_json, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      enabled = excluded.enabled,
      content_json = excluded.content_json,
      updated_at = datetime('now')
  `);
  stmt.run(secId, enabled, JSON.stringify(merged));
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
    featured: r.featured ? 1 : 0,
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
  const titlePlain = proj.titlePlain || proj.title_plain || title.replace(/<[^>]*>?/gm, '');

  const stmt = db.prepare(`
    INSERT INTO projects (
      id, slug, num, title, title_plain, tagline, desc, category, year, role, duration,
      status, live_url, github_url, cover, spread1, spread2, fullwidth,
      stack_json, overview_title, overview_body1, overview_body2,
      challenges_json, solution_paras_json, results_json, gallery_json,
      next_id, next_title, featured, order_index, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, datetime('now')
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
      featured = excluded.featured,
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
    proj.live || proj.liveUrl || proj.live_url || '#',
    proj.github || proj.githubUrl || proj.github_url || '#',
    proj.cover || '',
    proj.spread1 || '',
    proj.spread2 || '',
    proj.fullwidth || '',
    JSON.stringify(
      Array.isArray(proj.stack)
        ? proj.stack
        : (typeof proj.stack_json === 'string' ? parseJSON(proj.stack_json, []) : (proj.stack || []))
    ),
    proj.overviewTitle || '',
    proj.overviewBody1 || '',
    proj.overviewBody2 || '',
    JSON.stringify(proj.challenges || []),
    JSON.stringify(proj.solutionParas || []),
    JSON.stringify(proj.results || []),
    JSON.stringify(proj.gallery || []),
    proj.nextId || '',
    proj.nextTitle || '',
    proj.featured ? 1 : 0,
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

