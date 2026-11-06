/* ═══════════════════════════════════════════════════════════
   WalZetass Portfolio — projects.js
   Projects List · Detail Hydration · Filter · Lightbox
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   PROJECT DATA — single source of truth
───────────────────────────────────────────────────────────── */
const PROJECTS = {
  'waripos': {
    id: 'p_waripos',
    slug: 'waripos',
    num: '01',
    title: 'WariPOS — Point of Sale<br><em>&amp; Retail Management</em>',
    titlePlain: 'WariPOS — Point of Sale & Retail Management',
    category: 'pos',
    year: '2024 — 2026',
    role: 'Lead System Developer',
    duration: 'Pengembangan Berkelanjutan',
    tagline: 'Sistem kasir dan manajemen ritel multi-platform dengan arsitektur offline-first, pencetakan struk termal ESC/POS dinamis, rekonsiliasi kas shift, dan sinkronisasi inventori.',
    desc: 'Sistem kasir dan manajemen ritel multi-platform dengan arsitektur offline-first, pencetakan struk termal ESC/POS dinamis, rekonsiliasi kas shift, dan sinkronisasi inventori.',
    live: 'https://github.com/WalZetass-kar/WariPOS/releases/latest',
    liveUrl: 'https://github.com/WalZetass-kar/WariPOS/releases/latest',
    github: 'https://github.com/WalZetass-kar/WariPOS',
    githubUrl: 'https://github.com/WalZetass-kar/WariPOS',
    featured: 1,
    cover: 'assets/mockups/waripos-icon.png',
    spread1: 'assets/mockups/dashboard-main.svg',
    spread2: 'assets/mockups/ecommerce-main.svg',
    fullwidth: 'assets/mockups/dashboard-main.svg',
    stack: ['Electron', 'Capacitor', 'React', 'TypeScript', 'SQLite (Drizzle ORM)', 'Thermal ESC/POS'],
    tags: ['pos', 'desktop', 'mobile', 'offline-first', 'retail', 'sqlite'],
    overviewTitle: 'Keandalan Operasional Ritel Penuh<br>Tanpa <em>Ketergantungan Internet</em>',
    overviewBody1: 'UMKM dan toko ritel kerap mengalami antrean tersendat dan risiko kehilangan transaksi saat koneksi internet terputus. WariPOS dirancang dengan prinsip offline-first menyeluruh: seluruh transaksi kasir, pemotongan stok, pembuatan nota, dan pencatatan shift disimpan langsung di database SQLite lokal perangkat.',
    overviewBody2: 'Saya merancang arsitektur database lokal, mesin pencetakan struk termal ESC/POS (58mm/80mm) dengan Dynamic Stacking agar teks nota panjang tidak bertumpuk, fitur Held Cart (simpan antrean), audit kas buka/tutup shift, serta pengiriman nota digital ke WhatsApp pelanggan.',
    challenges: [
      {
        title: 'Masalah: Transaksi Terhambat Saat Internet Putus',
        body: 'Kasir ritel membutuhkan respons instan (<50ms) tanpa bergantung pada sinyal internet agar antrean pelanggan tidak menumpuk.'
      },
      {
        title: 'Kontribusi: Engine ESC/POS & Audit Shift Kasir',
        body: 'Membangun modul cetak Bluetooth/USB 58mm & 80mm dengan tata letak dinamis serta rekonsiliasi uang fisik (Open/Close Shift) otomatis.'
      }
    ],
    solutionParas: [
      '<strong>Arsitektur Offline-First:</strong> Memanfaatkan SQLite lokal dengan Drizzle ORM untuk pemrosesan transaksi berkecepatan tinggi tanpa latensi jaringan.',
      '<strong>ESC/POS &amp; Dynamic Stacking:</strong> Engine pencetakan nota kustom mendukung Bluetooth dan USB printer, ekspor PDF kontinu, serta pengiriman nota instan via WhatsApp.',
      '<strong>Audit Kas &amp; Inventori:</strong> Fitur buka/tutup kasir dengan audit surplus/defisit otomatis serta notifikasi Low Stock Alert saat stok menipis.'
    ],
    results: [
      { num: '100%', label: 'Operasional luring tanpa ketergantungan internet' },
      { num: '58/80mm', label: 'Dukungan printer thermal ESC/POS Bluetooth & USB' },
      { num: 'Multi-OS', label: 'Distribusi Desktop Windows/Linux & Android APK' }
    ],
    gallery: [
      { src: 'assets/mockups/dashboard-main.svg', caption: 'Dasbor Kasir, Shift Audit & Analitik Penjualan' },
      { src: 'assets/mockups/ecommerce-main.svg', caption: 'Manajemen Katalog Produk & Held Cart' }
    ],
    nextId: 'absensi-lcc',
    nextTitle: 'Sistem Absensi QR LCC'
  },
  'absensi-lcc': {
    id: 'p_absensi_lcc',
    slug: 'absensi-lcc',
    num: '02',
    title: 'Sistem Absensi QR<br><em>LP3I Computer Club</em>',
    titlePlain: 'Sistem Absensi QR LP3I Computer Club (LCC)',
    category: 'web',
    year: '2025 — 2026',
    role: 'Ketua LCC & Full-Stack Developer',
    duration: 'Digunakan Aktif Organisasi',
    tagline: 'Platform presensi anggota berbasis pemindaian QR Code real-time untuk menggantikan pencatatan kertas manual pada pertemuan rutin dan workshop LP3I Computer Club.',
    desc: 'Platform presensi anggota berbasis pemindaian QR Code real-time untuk menggantikan pencatatan kertas manual pada pertemuan rutin dan workshop LP3I Computer Club.',
    live: '',
    liveUrl: '',
    github: 'https://github.com/WalZetass-kar',
    githubUrl: 'https://github.com/WalZetass-kar',
    featured: 1,
    cover: 'assets/mockups/dashboard-main.svg',
    spread1: 'assets/mockups/dashboard-main.svg',
    spread2: 'assets/mockups/mobile-main.svg',
    fullwidth: 'assets/mockups/dashboard-main.svg',
    stack: ['JavaScript (ES6+)', 'Node.js', 'Express', 'SQL', 'HTML5 QR Scanner', 'REST API'],
    tags: ['web', 'backend', 'qr-code', 'organization', 'fullstack'],
    overviewTitle: 'Digitalisasi Presensi Organisasi<br>yang <em>Cepat &amp; Terverifikasi</em>',
    overviewBody1: 'Sebelum sistem ini dibangun, pendataan kehadiran anggota LP3I Computer Club (LCC) pada sesi praktikum dan pertemuan mingguan masih menggunakan lembar tanda tangan manual yang lambat dan rawan selisih rekapitulasi.',
    overviewBody2: 'Sebagai pimpinan LCC sekaligus pengembang utama, saya merancang aplikasi web presensi berbasis QR Code yang memvalidasi identitas anggota dalam hitungan detik, mencatat timestamp kehadiran otomatis, dan menyediakan rekap laporan langsung bagi pengurus.',
    challenges: [
      {
        title: 'Masalah: Antrean & Rekapitulasi Manual di Kelas Praktikum',
        body: 'Pencatatan kehadiran puluhan anggota di awal sesi memakan waktu 15–20 menit dan menyulitkan evaluasi keaktifan anggota per semester.'
      },
      {
        title: 'Kontribusi: Validasi Token QR & Rekap Real-Time',
        body: 'Merancang skema database sesi kegiatan, pemindai kamera web responsif, pencegahan duplikasi scan, serta ekspor rekap kehadiran.'
      }
    ],
    solutionParas: [
      '<strong>Pemindaian QR Kamera Langsung:</strong> Pengurus maupun anggota dapat memindai QR sesi kegiatan langsung dari browser perangkat tanpa instalasi aplikasi tambahan.',
      '<strong>Validasi Duplikasi &amp; Sesi Aktif:</strong> Backend memverifikasi status keanggotaan dan memastikan satu NIM hanya tercatat satu kali pada setiap sesi pertemuan.',
      '<strong>Dasbor Rekapitulasi Pengurus:</strong> Menyajikan metrik kehadiran per divisi dan riwayat keaktifan anggota secara transparan.'
    ],
    results: [
      { num: '< 3 dtk', label: 'Waktu verifikasi presensi per anggota via QR' },
      { num: 'Real-time', label: 'Rekapitulasi kehadiran pengurus tanpa input ulang' },
      { num: 'Aktif', label: 'Digunakan langsung oleh LP3I Computer Club' }
    ],
    gallery: [
      { src: 'assets/mockups/dashboard-main.svg', caption: 'Dasbor Rekapitulasi Kehadiran Anggota LCC' },
      { src: 'assets/mockups/mobile-main.svg', caption: 'Antarmuka Pemindaian QR Mobile' }
    ],
    nextId: 'ktm-digital',
    nextTitle: 'KTM Digital Terverifikasi QR'
  },
  'ktm-digital': {
    id: 'p_ktm_digital',
    slug: 'ktm-digital',
    num: '03',
    title: 'KTM Digital — Kartu Mahasiswa<br><em>Terverifikasi QR</em>',
    titlePlain: 'KTM Digital — Kartu Tanda Mahasiswa Terverifikasi QR',
    category: 'web',
    year: '2025 — 2026',
    role: 'Full-Stack Developer',
    duration: 'Implementasi Kampus & Organisasi',
    tagline: 'Sistem identitas Kartu Tanda Mahasiswa (KTM) digital berbasis web dengan verifikasi keaslian QR Code instan untuk layanan administrasi dan kegiatan kemahasiswaan.',
    desc: 'Sistem identitas Kartu Tanda Mahasiswa (KTM) digital berbasis web dengan verifikasi keaslian QR Code instan untuk layanan administrasi dan kegiatan kemahasiswaan.',
    live: '',
    liveUrl: '',
    github: 'https://github.com/WalZetass-kar',
    githubUrl: 'https://github.com/WalZetass-kar',
    featured: 1,
    cover: 'assets/mockups/mobile-main.svg',
    spread1: 'assets/mockups/mobile-main.svg',
    spread2: 'assets/mockups/dashboard-main.svg',
    fullwidth: 'assets/mockups/mobile-main.svg',
    stack: ['React.js', 'TypeScript', 'Node.js', 'SQL', 'QR Verification', 'Responsive PWA'],
    tags: ['web', 'identity', 'qr-code', 'student-card', 'frontend'],
    overviewTitle: 'Identitas Mahasiswa Digital<br>yang <em>Mudah Diverifikasi</em>',
    overviewBody1: 'Kartu fisik mahasiswa sering kali tertinggal atau terlambat dicetak saat dibutuhkan untuk verifikasi keanggotaan kegiatan kampus, peminjaman fasilitas, maupun registrasi acara BEM dan klub mahasiswa.',
    overviewBody2: 'Saya membangun sistem KTM Digital yang merender kartu identitas mahasiswa responsif lengkap dengan kode QR unik yang dapat dipindai panitia atau pengurus untuk memeriksa status aktif mahasiswa secara langsung.',
    challenges: [
      {
        title: 'Masalah: Kendala Kartu Fisik & Verifikasi Manual',
        body: 'Proses pemeriksaan identitas mahasiswa saat registrasi kegiatan kampus sering terhambat apabila kartu fisik belum tersedia atau rusak.'
      },
      {
        title: 'Kontribusi: Generator Kartu & Endpoint Verifikasi QR',
        body: 'Membangun tampilan kartu digital presisi tinggi di perangkat mobile serta halaman verifikasi instan ketika QR dipindai.'
      }
    ],
    solutionParas: [
      '<strong>Kartu Digital Siap Akses:</strong> Mahasiswa dapat membuka KTM Digital dari ponsel kapan saja dengan tata letak bersih yang menampilkan NIM, program studi, dan status aktif.',
      '<strong>Verifikasi QR Terenkripsi:</strong> Setiap kode QR mengarah ke halaman validasi yang menampilkan kecocokan data mahasiswa di basis data.',
      '<strong>Integrasi Ekosistem Organisasi:</strong> Dirancang agar selaras dengan sistem absensi kegiatan BEM dan LP3I Computer Club.'
    ],
    results: [
      { num: 'Instan', label: 'Pengecekan keaslian identitas mahasiswa via QR' },
      { num: 'Mobile', label: 'Antarmuka kartu responsif di seluruh layar ponsel' },
      { num: 'Terpadu', label: 'Terhubung dengan alur kegiatan organisasi kampus' }
    ],
    gallery: [
      { src: 'assets/mockups/mobile-main.svg', caption: 'Tampilan KTM Digital & QR Verification' }
    ],
    nextId: 'carikostkita',
    nextTitle: 'CariKostKita Android App'
  },
  'carikostkita': {
    id: 'p_carikostkita',
    slug: 'carikostkita',
    num: '04',
    title: 'CariKostKita — Aplikasi<br><em>Pencarian Kost Android</em>',
    titlePlain: 'CariKostKita — Aplikasi Pencarian Kost Android',
    category: 'mobile',
    year: '2025 — 2026',
    role: 'Android Developer',
    duration: 'Proyek Mandiri & Akademik',
    tagline: 'Aplikasi Android native untuk eksplorasi dan pemetaan hunian kost di Pekanbaru dengan filter harga/fasilitas, penyimpanan favorit Room SQLite offline, dan integrasi Google Maps Intent.',
    desc: 'Aplikasi Android native untuk eksplorasi dan pemetaan hunian kost di Pekanbaru dengan filter harga/fasilitas, penyimpanan favorit Room SQLite offline, dan integrasi Google Maps Intent.',
    live: '',
    liveUrl: '',
    github: 'https://github.com/WalZetass-kar',
    githubUrl: 'https://github.com/WalZetass-kar',
    featured: 1,
    cover: 'assets/mockups/carikostkita-icon.png',
    spread1: 'assets/mockups/mobile-main.svg',
    spread2: 'assets/mockups/ecommerce-main.svg',
    fullwidth: 'assets/mockups/mobile-main.svg',
    stack: ['Android SDK (Java)', 'Material Design 3', 'Room SQLite', 'Google Maps Intent'],
    tags: ['mobile', 'android', 'java', 'sqlite', 'maps'],
    overviewTitle: 'Memudahkan Mahasiswa Baru<br>Mencari <em>Hunian Kost di Pekanbaru</em>',
    overviewBody1: 'Mahasiswa rantau di Pekanbaru sering kesulitan membandingkan harga, fasilitas, dan jarak kost ke kampus karena informasi tersebar di media sosial tanpa struktur data yang rapi.',
    overviewBody2: 'Saya mengembangkan CariKostKita secara native menggunakan Android SDK (Java) dan Material Design 3, dilengkapi penyimpanan daftar kost favorit secara luring (Room SQLite) serta navigasi rute langsung ke Google Maps dan WhatsApp pemilik kost.',
    challenges: [
      {
        title: 'Masalah: Informasi Kost Tersebar & Sulit Dibandingkan',
        body: 'Pencari kost harus menghubungi satu per satu pemilik hunian hanya untuk mengetahui ketersediaan kamar, fasilitas dasar, dan titik lokasi.'
      },
      {
        title: 'Kontribusi: Arsitektur Room Database & Filter Multi-Kriteria',
        body: 'Merancang skema entitas Room SQLite, fitur bookmark kost tanpa internet, filter kategori (Putra/Putri/Campur), dan deep-link navigasi lokasi.'
      }
    ],
    solutionParas: [
      '<strong>Penyimpanan Lokal Room SQLite:</strong> Memungkinkan pengguna menyimpan dan membandingkan kandidat kost favorit meskipun sedang berada di area minim sinyal.',
      '<strong>Integrasi Google Maps &amp; Kontak Langsung:</strong> Tombol aksi instan membuka rute navigasi Google Maps menuju lokasi kost atau memulai percakapan dengan pemilik.',
      '<strong>Antarmuka Material Design 3:</strong> Tata letak kartu hunian yang bersih dan mudah dipindai dengan rincian harga bulanan serta fasilitas kamar.'
    ],
    results: [
      { num: 'Native', label: 'Performa Android ringan dengan Java & Material 3' },
      { num: 'Offline', label: 'Data kost favorit tersimpan lokal di Room SQLite' },
      { num: '1-Tap', label: 'Integrasi rute Google Maps & kontak pemilik' }
    ],
    gallery: [
      { src: 'assets/mockups/mobile-main.svg', caption: 'Katalog Kost, Filter Harga & Detail Fasilitas' }
    ],
    nextId: 'duochat',
    nextTitle: 'Duo Chat (ChatPrivate)'
  },
  'duochat': {
    id: 'p_duochat',
    slug: 'duochat',
    num: '05',
    title: 'Duo Chat — 1-on-1<br><em>Private Messenger</em>',
    titlePlain: 'Duo Chat (ChatPrivate) — 1-on-1 Private Messenger',
    category: 'web',
    year: '2026',
    role: 'Full-Stack Web Developer',
    duration: 'Rilis Web App',
    tagline: 'Aplikasi perpesanan privat dua arah (1-on-1 private messenger) dengan sistem pairing token undangan eksklusif, sinkronisasi pesan real-time Supabase, dan autentikasi aman.',
    desc: 'Aplikasi perpesanan privat dua arah (1-on-1 private messenger) dengan sistem pairing token undangan eksklusif, sinkronisasi pesan real-time Supabase, dan autentikasi aman.',
    live: '',
    liveUrl: '',
    github: 'https://github.com/WalZetass-kar',
    githubUrl: 'https://github.com/WalZetass-kar',
    featured: 1,
    cover: 'assets/mockups/duochat-screen.png',
    spread1: 'assets/mockups/duochat-screen.png',
    spread2: 'assets/mockups/mobile-main.svg',
    fullwidth: 'assets/mockups/duochat-screen.png',
    stack: ['React', 'Tailwind CSS', 'Supabase Realtime', 'Google Auth', 'Web Crypto API'],
    tags: ['web', 'chat', 'realtime', 'supabase', 'privacy'],
    overviewTitle: 'Ruang Komunikasi Privat<br>Tanpa <em>Bising Media Sosial</em>',
    overviewBody1: 'Aplikasi chat umum dipenuhi grup kerja, notifikasi promosi, dan daftar kontak terbuka. Duo Chat dirancang khusus sebagai ruang komunikasi 1-on-1 yang terisolasi dan hanya menghubungkan dua pengguna yang telah melakukan pairing token.',
    overviewBody2: 'Saya mengimplementasikan alur autentikasi Google, mekanisme pembangkitan kode undangan satu kali pakai (pairing token), langganan kanal pesan real-time menggunakan Supabase, serta antarmuka responsif bergaya kontras tinggi.',
    challenges: [
      {
        title: 'Masalah: Privasi & Isolasi Koneksi Antar Pengguna',
        body: 'Memastikan ruang percakapan hanya dapat diakses oleh dua akun yang telah saling menyetujui kode pairing tanpa mengekspos profil ke publik.'
      },
      {
        title: 'Kontribusi: Pairing Token Flow & Realtime Channel',
        body: 'Membangun logika pencocokan kode undangan, manajemen sesi autentikasi, indikator status pesan real-time, dan proteksi akses data.'
      }
    ],
    solutionParas: [
      '<strong>Pairing Invitation Token:</strong> Pengguna hanya dapat terhubung setelah memasukkan kode token unik pasangan yang diverifikasi di sisi server.',
      '<strong>Sinkronisasi Pesan Instan:</strong> Menggunakan kanal WebSocket Supabase Realtime untuk pengiriman pesan instan dengan latensi rendah.',
      '<strong>Desain Fokus &amp; Tangguh:</strong> Antarmuka bebas distraksi yang dioptimalkan untuk layar mobile maupun desktop.'
    ],
    results: [
      { num: '1-on-1', label: 'Isolasi ruang obrolan eksklusif berbasis pairing token' },
      { num: 'Realtime', label: 'Sinkronisasi pesan instan via Supabase WebSocket' },
      { num: 'Auth', label: 'Proteksi sesi dengan Google OAuth & Row Level Security' }
    ],
    gallery: [
      { src: 'assets/mockups/duochat-screen.png', caption: 'Tampilan Antarmuka Duo Chat (ChatPrivate)' }
    ],
    nextId: 'civic-report',
    nextTitle: 'Civic Report — Platform Pengaduan AI'
  },
  'civic-report': {
    id: 'p_civic_report',
    slug: 'civic-report',
    num: '06',
    title: 'Civic Report — Platform<br><em>Pengaduan Publik AI</em>',
    titlePlain: 'Civic Report — Platform Pengaduan Infrastruktur AI',
    category: 'ai',
    year: '2025',
    role: 'Full-Stack & AI Integration Developer',
    duration: 'Eksplorasi Sistem AI & GIS',
    tagline: 'Platform pelaporan kerusakan infrastruktur publik dengan analisis foto otomatis menggunakan Google Gemini Vision, pengelompokan lokasi radius Haversine, dan peta interaktif.',
    desc: 'Platform pelaporan kerusakan infrastruktur publik dengan analisis foto otomatis menggunakan Google Gemini Vision, pengelompokan lokasi radius Haversine, dan peta interaktif.',
    live: '',
    liveUrl: '',
    github: 'https://github.com/WalZetass-kar',
    githubUrl: 'https://github.com/WalZetass-kar',
    featured: 1,
    cover: 'assets/mockups/dashboard-main.svg',
    spread1: 'assets/mockups/dashboard-main.svg',
    spread2: 'assets/mockups/ecommerce-main.svg',
    fullwidth: 'assets/mockups/dashboard-main.svg',
    stack: ['Next.js', 'Google GenAI SDK', 'Leaflet GIS', 'Node.js', 'MySQL'],
    tags: ['ai', 'web', 'geospatial', 'gemini', 'fullstack'],
    overviewTitle: 'Verifikasi Laporan Infrastruktur<br>Berbantuan <em>Google Gemini Vision</em>',
    overviewBody1: 'Kanal pengaduan warga sering kali menerima laporan ganda di titik lokasi yang sama atau unggahan foto yang tidak relevan dengan kerusakan fasilitas umum.',
    overviewBody2: 'Saya membangun prototipe Civic Report yang mengintegrasikan Google GenAI SDK untuk mengklasifikasikan jenis kerusakan dari foto warga secara otomatis serta rumus spasial Haversine untuk menggabungkan laporan yang berdekatan di peta Leaflet.',
    challenges: [
      {
        title: 'Masalah: Laporan Duplikat & Validasi Foto Manual',
        body: 'Petugas harus memilah ratusan foto aduan secara manual dan sering menemukan banyak tiket berbeda untuk satu titik jalan rusak yang sama.'
      },
      {
        title: 'Kontribusi: Klasifikasi Gemini Vision & Clustering Spasial',
        body: 'Mengintegrasikan prompt terstruktur Gemini Vision untuk mendeteksi kategori tingkat keparahan serta deduplikasi koordinat GPS berbasis Haversine.'
      }
    ],
    solutionParas: [
      '<strong>Analisis Gambar Multimodal:</strong> Google Gemini API mengekstrak kategori masalah (jalan berlubang, lampu mati, drainase) dan estimasi urgensi dari foto laporan.',
      '<strong>Deduplikasi Koordinat Haversine:</strong> Laporan baru dalam radius dekat dengan masalah serupa otomatis dikelompokkan sebagai dukungan suara (upvote) pada laporan aktif.',
      '<strong>Visualisasi Peta GIS:</strong> Peta interaktif Leaflet menampilkan sebaran titik laporan beserta status tindak lanjutnya.'
    ],
    results: [
      { num: 'Gemini AI', label: 'Klasifikasi otomatis foto kerusakan infrastruktur' },
      { num: 'Haversine', label: 'Pengelompokan laporan berdasarkan radius koordinat GPS' },
      { num: 'GIS Map', label: 'Pemetaan interaktif status laporan warga' }
    ],
    gallery: [
      { src: 'assets/mockups/dashboard-main.svg', caption: 'Dasbor Pemetaan & Verifikasi AI Civic Report' }
    ],
    nextId: 'waripos',
    nextTitle: 'WariPOS — Point of Sale Suite'
  }
};

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
  if (metaNum && typeof window.__projectCount === 'number' && window.__projectCount > 0) {
    metaNum.textContent = window.__projectCount;
  }
  set('.page-hero-meta [data-meta="period"]', p.pageMetaPeriod);
  set('.page-hero-meta [data-meta="ecosystem"]', p.pageMetaEcosystem);

  // Label filter (tanpa emoji)
  if (Array.isArray(p.filterLabels) && p.filterLabels.length) {
    const btns = document.querySelectorAll('.filter-bar .filter-btn');
    btns.forEach((btn, i) => {
      const lbl = p.filterLabels[i];
      if (!lbl) return;
      btn.textContent = String(lbl).replace(/^[⭐✦\s]+/, '');
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
  const putHTML = (id, val) => { if (val) setInnerHTML(id, val); };

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

    if (!Array.isArray(projs) || projs.length === 0) {
      projs = Object.values(PROJECTS);
    }

    container.innerHTML = projs.map((p, idx) => {
      const isReverse = idx % 2 === 1;
      const num = p.num || String(idx + 1).padStart(2, '0');
      const cat = p.category || 'fullstack';
      const catLabel = cat.toUpperCase();
      const year = p.year || '2025';
      const role = p.role || 'Developer';
      const slugOrId = p.slug || p.id;
      const stack = Array.isArray(p.stack) ? p.stack : [];
      const titleFormatted = p.title && p.title.includes('<br>') ? p.title : escapeHTML(p.titlePlain || p.title || '');
      const coverImg = p.cover || 'assets/mockups/dashboard-main.svg';
      const tagsAttr = Array.isArray(p.tags) ? p.tags.join(' ') : (p.tags || '');
      const isIcon = coverImg.includes('-icon') || coverImg.includes('icon.png');
      const cleanUrl = v => { const s = (v || '').trim(); return !s || s === '#' || s === 'undefined' ? '' : s; };
      const liveUrl = cleanUrl(p.live || p.liveUrl);
      const ghUrl = cleanUrl(p.github || p.githubUrl);

      const chals = Array.isArray(p.challenges) ? p.challenges : [];
      const problemText = (chals[0] && chals[0].body) || p.overviewBody1 || '';
      const contribText = (chals[1] && chals[1].body) || p.overviewBody2 || '';

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
              <span class="showcase-cat">${escapeHTML(catLabel)} · ${escapeHTML(year)} · ${escapeHTML(role)}</span>
            </div>
            <h2 class="showcase-title reveal-up visible">
              ${titleFormatted}
            </h2>
            <p class="showcase-desc reveal-up visible">
              ${escapeHTML(p.tagline || p.desc || '')}
            </p>
            ${(problemText || contribText) ? `
            <div class="showcase-specs-grid reveal-up visible">
              ${problemText ? `
              <div class="showcase-spec-box">
                <span class="showcase-spec-label">Masalah</span>
                <p class="showcase-spec-text">${escapeHTML(problemText)}</p>
              </div>` : ''}
              ${contribText ? `
              <div class="showcase-spec-box">
                <span class="showcase-spec-label">Kontribusi &amp; Fitur</span>
                <p class="showcase-spec-text">${escapeHTML(contribText)}</p>
              </div>` : ''}
            </div>` : ''}
            <div class="showcase-stack reveal-up visible">
              <span class="stack-label">Stack Teknologi</span>
              <div class="stack-tags">
                ${stack.map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}
              </div>
            </div>
            <div class="showcase-actions reveal-up visible">
              <a href="project-detail.html?id=${encodeURIComponent(slugOrId)}" class="btn-primary">Studi Kasus →</a>
              ${liveUrl ? `<a href="${escapeHTML(liveUrl)}" class="btn-ghost" target="_blank" rel="noopener">${liveUrl.includes('/releases') ? 'Rilis Unduhan ↗' : 'Demo Langsung ↗'}</a>` : ''}
              ${ghUrl ? `<a href="${escapeHTML(ghUrl)}" class="btn-ghost" target="_blank" rel="noopener">Kode Sumber (GitHub) ↗</a>` : ''}
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
    proj = PROJECTS[id] || Object.values(PROJECTS).find(p => p.id === id || p.slug === id);
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
  const liveUrl = (proj.liveUrl || proj.live || '').trim();
  const ghUrl = (proj.githubUrl || proj.github || '').trim();
  const liveBtn = document.getElementById('d-live-btn');
  if (liveBtn) {
    if (liveUrl && liveUrl !== '#') {
      liveBtn.href = liveUrl;
      liveBtn.style.display = '';
      liveBtn.textContent = liveUrl.includes('/releases') ? 'Rilis Unduhan ↗' : 'Demo Langsung ↗';
    } else {
      liveBtn.style.display = 'none';
    }
  }
  const ghBtn = document.getElementById('d-github-btn');
  if (ghBtn) {
    if (ghUrl && ghUrl !== '#') {
      ghBtn.href = ghUrl;
      ghBtn.style.display = '';
    } else {
      ghBtn.style.display = 'none';
    }
  }

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
