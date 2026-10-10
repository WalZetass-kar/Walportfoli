/* ═══════════════════════════════════════════════════════════
   WalZetass Portfolio — Admin Dashboard Controller
   Single Source of Truth · All sections 1:1 with Landing Page
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS & STATE
───────────────────────────────────────────────────────────── */
const API = '/api';
let authToken = sessionStorage.getItem('admin_token') || '';
let currentSection = 'hero';
let pendingDeleteFn = null;

// Section meta for header display
const SECTION_META = {
  hero:         { title: 'Hero & Profil',           subtitle: 'Kelola tampilan hero dan informasi profil utama' },
  about:        { title: 'Tentang & Statistik',     subtitle: 'Konten bagian about dan kartu metrik statistik' },
  projects:     { title: 'Proyek Nyata',            subtitle: 'CRUD proyek dengan urutan tampil di Landing Page' },
  skills:       { title: 'Keahlian & Alat',         subtitle: 'Kategori dan chip teknologi yang tampil di #skills' },
  experience:   { title: 'Pengalaman & Pendidikan', subtitle: 'Linimasa pengalaman dan riwayat pendidikan' },
  certificates: { title: 'Sertifikasi',             subtitle: 'Kartu sertifikat dan kredensial yang tampil di Landing Page' },
  contact:      { title: 'Kontak & Sosial',         subtitle: 'Bagian kontak, email utama, dan tautan media sosial' },
  inbox:        { title: 'Kotak Pesan',             subtitle: 'Pesan masuk dari pengunjung Landing Page' },
  settings:     { title: 'Pengaturan & Akun',       subtitle: 'Keamanan akun dan info sistem' },
};

/* ─────────────────────────────────────────────────────────────
   API HELPERS
───────────────────────────────────────────────────────────── */

const SUPABASE_URL = 'https://xnsnobxuajebpkxeqgvd.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuc25vYnh1YWplYnBreGVxZ3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNTUzMDEsImV4cCI6MjEwNjczMTMwMX0.8apNT2L4bnW_hWqKB-4T7bSwbVEuKty6U8XMYp5yY84';

async function supabaseProxy(endpoint, options) {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : null;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const req = async (path, reqOpts) => {
    const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, { ...reqOpts, headers: { ...headers, ...(reqOpts.headers||{}) } });
    const json = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(json.message || json.error || `Supabase HTTP ${res.status}`);
    return json;
  };

  if (body) {
    if (body.stack_json !== undefined) { body.stack = JSON.parse(body.stack_json||'[]'); delete body.stack_json; }
    if (body.links_json !== undefined) { body.links = JSON.parse(body.links_json||'[]'); delete body.links_json; }
    if (body.gallery_json !== undefined) { body.gallery = JSON.parse(body.gallery_json||'[]'); delete body.gallery_json; }
    if (body.highlights_json !== undefined) { body.highlights = JSON.parse(body.highlights_json||'[]'); delete body.highlights_json; }
    if (body.tags_json !== undefined) { body.tags = JSON.parse(body.tags_json||'[]'); delete body.tags_json; }
    if (body.skills_json !== undefined) { body.skills = JSON.parse(body.skills_json||'[]'); delete body.skills_json; }
    if (body.current !== undefined && typeof body.current === 'number') { body.current = body.current === 1; }
  }

  const mapOut = (r) => {
    if (!r) return r;
    const out = { ...r };
    if (out.stack !== undefined) { out.stack_json = JSON.stringify(out.stack); delete out.stack; }
    if (out.links !== undefined) { out.links_json = JSON.stringify(out.links); delete out.links; }
    if (out.gallery !== undefined) { out.gallery_json = JSON.stringify(out.gallery); delete out.gallery; }
    if (out.highlights !== undefined) { out.highlights_json = JSON.stringify(out.highlights); delete out.highlights; }
    if (out.tags !== undefined) { out.tags_json = JSON.stringify(out.tags); delete out.tags; }
    if (out.skills !== undefined) { out.skills_json = JSON.stringify(out.skills); delete out.skills; }
    if (out.current !== undefined && typeof out.current === 'boolean') { out.current = out.current ? 1 : 0; }
    return out;
  };

  if (endpoint === '/auth/verify') return { success: true, valid: true };
  if (endpoint === '/auth/logout') return { success: true };
  if (endpoint === '/auth/login' && method === 'POST') {
    const res = await req(`admin_auth?username=eq.${encodeURIComponent(body.username)}`, { method: 'GET' });
    if (res.length > 0 && res[0].password === body.password) return { success: true, token: 'supabase-token' };
    throw new Error('Kredensial tidak valid');
  }

  if (endpoint === '/profile' && method === 'GET') {
    const res = await req('profile?id=eq.1', { method: 'GET' });
    return { success: true, data: res[0] || {} };
  }
  if (endpoint === '/profile' && method === 'PUT') {
    const res = await req('profile?id=eq.1', { method: 'PATCH', body: JSON.stringify(body) });
    return { success: true, data: res[0] };
  }

  if (endpoint === '/landing' && method === 'GET') {
    const res = await req('landing_sections', { method: 'GET' });
    const data = {};
    res.forEach(r => data[r.key] = r.data);
    return { success: true, data };
  }
  if (endpoint.startsWith('/landing/') && method === 'PUT') {
    const section = endpoint.split('/')[2];
    const res = await req('landing_sections', {
      method: 'POST',
      headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ key: section, data: body })
    });
    return { success: true, data: res[0] };
  }

  const tables = ['projects', 'skills', 'experience', 'education', 'certificates'];
  for (const table of tables) {
    if (endpoint === '/' + table || endpoint.startsWith('/' + table + '?')) {
      if (method === 'GET') {
        const res = await req(table, { method: 'GET' });
        return { success: true, data: res.map(mapOut) };
      }
      if (method === 'POST') {
        if (!body.id) body.id = Date.now().toString();
        const res = await req(table, { method: 'POST', body: JSON.stringify(body) });
        return { success: true, data: mapOut(res[0]) };
      }
    }
    if (endpoint.startsWith('/' + table + '/')) {
      const parts = endpoint.split('/');
      const id = parts[2];
      if (method === 'PUT' && id) {
        const res = await req(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(body) });
        return { success: true, data: mapOut(res[0]) };
      }
      if (method === 'DELETE' && id) {
        await req(`${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
        return { success: true };
      }
    }
  }

  if (endpoint === '/contact' && method === 'GET') {
    const res = await req('contact_messages', { method: 'GET' });
    return { success: true, data: res };
  }

  if (endpoint === '/upload' && method === 'POST') {
    return { success: true, url: body.data, filename: body.filename };
  }

  throw new Error('Supabase Proxy: Endpoint not mapped ' + method + ' ' + endpoint);
}


async function apiFetch(endpoint, options = {}) {
  const isServerless = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  if (isServerless) return await supabaseProxy(endpoint, options);

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(API + endpoint, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

function broadcastChange(type = 'CMS_STATE_UPDATED', payload = {}) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('wz_cms_channel');
      bc.postMessage({ type, payload, timestamp: Date.now() });
      setTimeout(() => { try { bc.close(); } catch(e){} }, 200);
    }
    localStorage.setItem('cache_portfolio_update', Date.now().toString());
  } catch (e) {
    console.warn('[Admin] Broadcast error:', e);
  }
}

async function apiGet(endpoint) {
  return apiFetch(endpoint, { method: 'GET' });
}

async function apiPost(endpoint, body) {
  const res = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) });
  if (!endpoint.includes('/auth/')) broadcastChange('MUTATION_POST', { endpoint });
  return res;
}

async function apiPut(endpoint, body) {
  const res = await apiFetch(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  if (!endpoint.includes('/auth/')) broadcastChange('MUTATION_PUT', { endpoint });
  return res;
}

async function apiDelete(endpoint) {
  const res = await apiFetch(endpoint, { method: 'DELETE' });
  if (!endpoint.includes('/auth/')) broadcastChange('MUTATION_DELETE', { endpoint });
  return res;
}

/* ─────────────────────────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────────────────────────── */
function showToast(message, type = 'success', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
  toast.innerHTML = `<span>${icon}</span> ${escapeHtml(message)}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(12px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ─────────────────────────────────────────────────────────────
   DELETE CONFIRM MODAL
───────────────────────────────────────────────────────────── */
function showConfirm(title, message, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = message;
  document.getElementById('confirmModal').style.display = 'flex';
  pendingDeleteFn = onConfirm;
}

function closeConfirm() {
  document.getElementById('confirmModal').style.display = 'none';
  pendingDeleteFn = null;
}

/* ─────────────────────────────────────────────────────────────
   BUTTON LOADING STATE
───────────────────────────────────────────────────────────── */
function btnLoading(btn, loading, originalText) {
  if (loading) {
    btn._originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="loading-spinner"></span> Menyimpan...`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText || btn._originalText || 'Simpan';
  }
}

/* ─────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function nanoid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return iso; }
}

/* ─────────────────────────────────────────────────────────────
   AUTH: LOGIN / LOGOUT
───────────────────────────────────────────────────────────── */
async function checkAuth() {
  if (!authToken) return false;
  try {
    const res = await apiGet('/auth/verify');
    return res.valid === true;
  } catch {
    return false;
  }
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboardShell').style.display = 'none';
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboardShell').style.display = 'flex';
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!username || !password) {
    errEl.textContent = 'Username dan password wajib diisi.';
    errEl.style.display = 'block';
    return;
  }
  btnLoading(btn, true);
  try {
    const res = await apiPost('/auth/login', { username, password });
    authToken = res.token;
    sessionStorage.setItem('admin_token', authToken);
    showDashboard();
    await loadDashboard();
  } catch (err) {
    errEl.textContent = err.message || 'Login gagal. Periksa kembali kredensial Anda.';
    errEl.style.display = 'block';
    btnLoading(btn, false, 'Masuk ke Dashboard');
  }
}

async function handleLogout() {
  try {
    await apiPost('/auth/logout', {});
  } catch {}
  authToken = '';
  sessionStorage.removeItem('admin_token');
  showLogin();
}

/* ─────────────────────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────────────────────── */
function navigateTo(section) {
  currentSection = section;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.section === section);
  });

  // Update section panels
  document.querySelectorAll('.section-panel').forEach(el => {
    el.classList.toggle('active', el.id === `panel-${section}`);
  });

  // Update header
  const meta = SECTION_META[section] || {};
  document.getElementById('sectionTitle').textContent = meta.title || section;
  document.getElementById('sectionSubtitle').textContent = meta.subtitle || '';

  // Load section data
  loadSection(section);
}

async function loadSection(section) {
  switch (section) {
    case 'hero':         await loadHero(); break;
    case 'about':        await loadAbout(); break;
    case 'projects':     await loadProjects(); break;
    case 'skills':       await loadSkills(); break;
    case 'experience':   await loadExperience(); break;
    case 'certificates': await loadCertificates(); break;
    case 'contact':      await loadContact(); break;
    case 'inbox':        await loadInbox(); break;
    case 'settings':     loadSettings(); break;
    case 'pages':        await loadPagesEditor(); break;
  }
}

/* ─────────────────────────────────────────────────────────────
   INITIAL LOAD
───────────────────────────────────────────────────────────── */
async function loadDashboard() {
  navigateTo('hero');
  // Load badge counts
  try {
    const projRes = await apiGet('/projects?all=true');
    document.getElementById('badgeProjects').textContent = projRes.data ? projRes.data.length : 0;
  } catch {}
  try {
    const msgs = await apiGet('/contact');
    const unread = (msgs.data || []).filter(m => m.status === 'unread').length;
    const badge = document.getElementById('badgeInbox');
    if (unread > 0) {
      badge.textContent = unread;
      badge.style.display = 'inline';
    }
  } catch {}
}

/* ─────────────────────────────────────────────────────────────
   § 01. HERO & PROFIL
───────────────────────────────────────────────────────────── */
async function loadHero() {
  try {
    const [profileRes, landingRes] = await Promise.all([
      apiGet('/profile'),
      apiGet('/landing'),
    ]);
    const p = profileRes.data || {};
    const l = landingRes.data || {};
    const hero = l.hero || {};
    const about = l.about || {};

    // Profile fields
    document.getElementById('profileName').value = p.name || '';
    document.getElementById('profileHandle').value = p.handle || '';
    document.getElementById('profileTitle').value = p.title || '';
    document.getElementById('profileLocation').value = p.location || '';
    document.getElementById('profileBio').value = p.bio || '';
    document.getElementById('profileLongbio').value = p.longbio || '';
    document.getElementById('profileEmail').value = p.email || '';
    document.getElementById('profileGithub').value = p.github || '';
    document.getElementById('profileLinkedin').value = p.linkedin || '';
    document.getElementById('profileTwitter').value = p.twitter || '';
    document.getElementById('profileDribbble').value = p.dribbble || p.website || '';
    document.getElementById('profileAvailable').checked = !!p.available;
    document.getElementById('profileAvatar').value = p.avatar || '';
    const avatarImg = document.getElementById('avatarPreviewImg');
    if (p.avatar) avatarImg.src = p.avatar;

    // CTA fields from landing hero
    document.getElementById('heroCta1Text').value = hero.btn1Text || 'Lihat Karya Pilihan →';
    document.getElementById('heroCta1Link').value = hero.btn1Link || '#projects';
    document.getElementById('heroCta2Text').value = hero.btn2Text || 'Hubungi Saya';
    document.getElementById('heroCta2Link').value = hero.btn2Link || '#contact';

    // Stats from about section (they appear in hero row on Landing)
    document.getElementById('heroStat1Val').value = about.stat1Num || '';
    document.getElementById('heroStat1Label').value = about.stat1Label || '';
    document.getElementById('heroStat2Val').value = about.stat2Num || '';
    document.getElementById('heroStat2Label').value = about.stat2Label || '';
    document.getElementById('heroStat3Val').value = about.stat3Num || '';
    document.getElementById('heroStat3Label').value = about.stat3Label || '';
  } catch (err) {
    showToast('Gagal memuat data hero: ' + err.message, 'error');
  }
}

async function saveProfile() {
  const btn = document.getElementById('saveProfileBtn');
  btnLoading(btn, true);
  try {
    const body = {
      name:     document.getElementById('profileName').value.trim(),
      handle:   document.getElementById('profileHandle').value.trim(),
      title:    document.getElementById('profileTitle').value.trim(),
      location: document.getElementById('profileLocation').value.trim(),
      bio:      document.getElementById('profileBio').value.trim(),
      longbio:  document.getElementById('profileLongbio').value.trim(),
      email:    document.getElementById('profileEmail').value.trim(),
      github:   document.getElementById('profileGithub').value.trim(),
      linkedin: document.getElementById('profileLinkedin').value.trim(),
      twitter:  document.getElementById('profileTwitter').value.trim(),
      dribbble: document.getElementById('profileDribbble').value.trim(),
      website:  document.getElementById('profileDribbble').value.trim(),
      available: document.getElementById('profileAvailable').checked ? 1 : 0,
      avatar:   document.getElementById('profileAvatar').value.trim(),
    };
    await apiPut('/profile', body);
    showToast('Profil berhasil disimpan!');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnLoading(btn, false, 'Simpan Profil');
  }
}

async function saveHeroCta() {
  const btn = document.getElementById('saveHeroCtaBtn');
  btnLoading(btn, true);
  try {
    const landing = (await apiGet('/landing')).data || {};
    const hero = { ...(landing.hero || {}),
      btn1Text: document.getElementById('heroCta1Text').value.trim(),
      btn1Link: document.getElementById('heroCta1Link').value.trim(),
      btn2Text: document.getElementById('heroCta2Text').value.trim(),
      btn2Link: document.getElementById('heroCta2Link').value.trim(),
    };
    await apiPut('/landing/hero', hero);
    showToast('CTA hero berhasil disimpan!');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnLoading(btn, false, 'Simpan CTA');
  }
}

async function saveHeroStats() {
  const btn = document.getElementById('saveHeroStatsBtn');
  btnLoading(btn, true);
  try {
    const landing = (await apiGet('/landing')).data || {};
    const about = { ...(landing.about || {}),
      stat1Num:   document.getElementById('heroStat1Val').value.trim(),
      stat1Label: document.getElementById('heroStat1Label').value.trim(),
      stat2Num:   document.getElementById('heroStat2Val').value.trim(),
      stat2Label: document.getElementById('heroStat2Label').value.trim(),
      stat3Num:   document.getElementById('heroStat3Val').value.trim(),
      stat3Label: document.getElementById('heroStat3Label').value.trim(),
    };
    await apiPut('/landing/about', about);
    showToast('Metrik hero berhasil disimpan!');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnLoading(btn, false, 'Simpan Metrik');
  }
}

/* ─────────────────────────────────────────────────────────────
   § 02. ABOUT & STATISTIK
───────────────────────────────────────────────────────────── */
async function loadAbout() {
  try {
    const res = await apiGet('/landing');
    const landing = res.data || {};
    const a = landing.about || {};
    const m = landing.marquee || {};
    document.getElementById('aboutHeadline').value = a.headline || '';
    document.getElementById('aboutText1').value = a.text1 || '';
    document.getElementById('aboutText2').value = a.text2 || '';
    document.getElementById('aboutStat1Val').value = a.stat1Num || '';
    document.getElementById('aboutStat1Label').value = a.stat1Label || '';
    document.getElementById('aboutStat2Val').value = a.stat2Num || '';
    document.getElementById('aboutStat2Label').value = a.stat2Label || '';
    document.getElementById('aboutStat3Val').value = a.stat3Num || '';
    document.getElementById('aboutStat3Label').value = a.stat3Label || '';
    const mInput = document.getElementById('aboutMarquee');
    if (mInput) mInput.value = m.text || '';
  } catch (err) {
    showToast('Gagal memuat about: ' + err.message, 'error');
  }
}

async function saveAbout() {
  const btn = document.getElementById('saveAboutBtn');
  btnLoading(btn, true);
  try {
    const body = {
      headline:   document.getElementById('aboutHeadline').value,
      text1:      document.getElementById('aboutText1').value,
      text2:      document.getElementById('aboutText2').value,
      stat1Num:   document.getElementById('aboutStat1Val').value,
      stat1Label: document.getElementById('aboutStat1Label').value,
      stat2Num:   document.getElementById('aboutStat2Val').value,
      stat2Label: document.getElementById('aboutStat2Label').value,
      stat3Num:   document.getElementById('aboutStat3Val').value,
      stat3Label: document.getElementById('aboutStat3Label').value,
    };
    await apiPut('/landing/about', body);

    const mInput = document.getElementById('aboutMarquee');
    if (mInput) {
      const mText = mInput.value.trim();
      if (mText) {
        await apiPut('/landing/marquee', { text: mText, enabled: true });
      }
    }

    showToast('Bagian About & Marquee berhasil disimpan!');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnLoading(btn, false, 'Simpan Bagian About');
  }
}

/* ─────────────────────────────────────────────────────────────
   § 03. PROYEK
───────────────────────────────────────────────────────────── */
let projectsData = [];

async function loadProjects() {
  const list = document.getElementById('projectsList');
  list.innerHTML = `<div class="empty-state"><div class="loading-spinner"></div></div>`;
  try {
    const res = await apiGet('/projects?all=true');
    projectsData = (res.data || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    renderProjectsList();
    document.getElementById('badgeProjects').textContent = projectsData.length;
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p class="empty-state-desc">Gagal memuat proyek: ${escapeHtml(err.message)}</p></div>`;
  }
}

function renderProjectsList() {
  const list = document.getElementById('projectsList');
  if (!projectsData.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">📂</div>
      <div class="empty-state-title">Belum ada proyek</div>
      <p class="empty-state-desc">Klik "+ Tambah Proyek" untuk menambahkan proyek pertama Anda.</p>
    </div>`;
    return;
  }
  list.innerHTML = projectsData.map((p, i) => `
    <div class="item-card" data-id="${escapeHtml(p.id)}">
      <div class="item-card-order">
        <button class="btn-icon" onclick="moveProject('${escapeHtml(p.id)}', -1)" title="Naik" ${i === 0 ? 'disabled' : ''}>
          <svg viewBox="0 0 10 10" fill="none" width="10" height="10"><path d="M2 7l3-4 3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
        <button class="btn-icon" onclick="moveProject('${escapeHtml(p.id)}', 1)" title="Turun" ${i === projectsData.length - 1 ? 'disabled' : ''}>
          <svg viewBox="0 0 10 10" fill="none" width="10" height="10"><path d="M2 3l3 4 3-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="item-body">
        <div class="item-title">${p.featured ? '⭐ ' : ''}${escapeHtml(p.title || 'Tanpa Judul')}</div>
        <div class="item-meta">
          <span class="status-dot ${p.status === 'published' ? '' : 'status-dot--draft'}"></span>
          ${escapeHtml(p.category || '—')} · ${escapeHtml(p.year || '—')} · ${p.status === 'published' ? 'Published' : 'Draft'}${p.featured ? ' · <strong>Unggulan</strong>' : ''}
        </div>
      </div>
      <div class="item-actions">
        <button class="btn-ghost-sm" onclick="editProject('${escapeHtml(p.id)}')">Edit</button>
        <button class="btn-icon btn-icon--danger" onclick="deleteProject('${escapeHtml(p.id)}', '${escapeHtml(p.title || '')}')" title="Hapus">
          <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M2 3h10M5 3V2h4v1M3 3l1 9h6l1-9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

async function moveProject(id, dir) {
  const idx = projectsData.findIndex(p => p.id === id);
  if (idx < 0) return;
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= projectsData.length) return;
  // Swap
  [projectsData[idx], projectsData[newIdx]] = [projectsData[newIdx], projectsData[idx]];
  // Update order_index for both
  projectsData.forEach((p, i) => p.order_index = i);
  renderProjectsList();
  // Persist
  try {
    await Promise.all([
      apiPut(`/projects/${projectsData[idx].id}`, projectsData[idx]),
      apiPut(`/projects/${projectsData[newIdx].id}`, projectsData[newIdx]),
    ]);
    showToast('Urutan proyek diperbarui');
  } catch (err) {
    showToast('Gagal menyimpan urutan: ' + err.message, 'error');
  }
}

function openProjectModal(project = null) {
  const modal = document.getElementById('projectModal');
  const title = document.getElementById('projectModalTitle');
  const isNew = !project;
  title.textContent = isNew ? 'Tambah Proyek Baru' : 'Edit Proyek';
  document.getElementById('projectId').value = project ? project.id : '';
  document.getElementById('projectTitle').value = project ? (project.title || '') : '';
  document.getElementById('projectCategory').value = project ? (project.category || '') : '';
  document.getElementById('projectYear').value = project ? (project.year || '') : '';
  document.getElementById('projectStatus').value = project ? (project.status || 'published') : 'published';
  document.getElementById('projectFeatured').value = project && project.featured ? '1' : '0';
  document.getElementById('projectTagline').value = project ? (project.tagline || '') : '';
  document.getElementById('projectDesc').value = project ? (project.desc || '') : '';
  document.getElementById('projectStack').value = project ? (project.stack_json ? JSON.parse(project.stack_json).join(', ') : '') : '';
  document.getElementById('projectLiveUrl').value = project ? (project.live_url || '') : '';
  document.getElementById('projectGithubUrl').value = project ? (project.github_url || '') : '';
  document.getElementById('projectCover').value = project ? (project.cover || '') : '';
  const preview = document.getElementById('projectCoverPreview');
  if (project && project.cover) {
    preview.src = project.cover;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }
  modal.style.display = 'flex';
}

function editProject(id) {
  const proj = projectsData.find(p => p.id === id);
  if (proj) openProjectModal(proj);
}

function deleteProject(id, name) {
  showConfirm(
    'Hapus Proyek?',
    `Proyek "${name}" akan dihapus secara permanen dari database. Landing Page tidak akan lagi menampilkannya.`,
    async () => {
      try {
        await apiDelete(`/projects/${id}`);
        showToast('Proyek berhasil dihapus');
        await loadProjects();
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  );
}

async function saveProject() {
  const btn = document.getElementById('saveProjectBtn');
  btnLoading(btn, true);
  try {
    const id = document.getElementById('projectId').value;
    const stackStr = document.getElementById('projectStack').value;
    const stack = stackStr ? stackStr.split(',').map(s => s.trim()).filter(Boolean) : [];
    const body = {
      id: id || undefined,
      title:       document.getElementById('projectTitle').value.trim(),
      category:    document.getElementById('projectCategory').value.trim(),
      year:        document.getElementById('projectYear').value.trim(),
      status:      document.getElementById('projectStatus').value,
      featured:    document.getElementById('projectFeatured').value === '1' ? 1 : 0,
      tagline:     document.getElementById('projectTagline').value.trim(),
      desc:        document.getElementById('projectDesc').value.trim(),
      stack_json:  JSON.stringify(stack),
      live_url:    document.getElementById('projectLiveUrl').value.trim(),
      github_url:  document.getElementById('projectGithubUrl').value.trim(),
      cover:       document.getElementById('projectCover').value.trim(),
      order_index: id ? (projectsData.find(p => p.id === id) || {}).order_index || 0 : projectsData.length,
    };
    if (id) {
      await apiPut(`/projects/${id}`, body);
    } else {
      await apiPost('/projects', body);
    }
    showToast('Proyek berhasil disimpan!');
    document.getElementById('projectModal').style.display = 'none';
    await loadProjects();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnLoading(btn, false, 'Simpan Proyek');
  }
}

/* ─────────────────────────────────────────────────────────────
   § 04. KEAHLIAN
───────────────────────────────────────────────────────────── */
let skillsData = [];

async function loadSkills() {
  const grid = document.getElementById('skillsList');
  grid.innerHTML = `<div class="empty-state"><div class="loading-spinner"></div></div>`;
  try {
    const res = await apiGet('/skills');
    skillsData = res.data || [];
    renderSkillsGrid();
    // Update datalist
    const cats = [...new Set(skillsData.map(s => s.category).filter(Boolean))];
    const dl = document.getElementById('categoryList');
    dl.innerHTML = cats.map(c => `<option value="${escapeHtml(c)}" />`).join('');
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p class="empty-state-desc">Gagal memuat: ${escapeHtml(err.message)}</p></div>`;
  }
}

function renderSkillsGrid() {
  const grid = document.getElementById('skillsList');
  if (!skillsData.length) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-state-title">Belum ada keahlian</div></div>`;
    return;
  }
  // Group by category
  const cats = {};
  skillsData.forEach(s => {
    if (!cats[s.category]) cats[s.category] = [];
    cats[s.category].push(s);
  });
  grid.innerHTML = Object.entries(cats).map(([cat, skills]) => `
    <div class="skills-cat-card">
      <div class="skills-cat-title">
        <span>${escapeHtml(cat)}</span>
        <span style="font-size:0.6rem;color:var(--text-3)">${skills.length} item</span>
      </div>
      <div class="skills-chips">
        ${skills.sort((a,b)=>(a.order_index||0)-(b.order_index||0)).map(s => `
          <span class="skill-chip">
            ${escapeHtml(s.name)}
            <button class="skill-chip-del" onclick="deleteSkill('${escapeHtml(s.id)}', '${escapeHtml(s.name)}')" title="Hapus">&times;</button>
          </span>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function openSkillModal(skill = null) {
  const modal = document.getElementById('skillModal');
  document.getElementById('skillModalTitle').textContent = skill ? 'Edit Keahlian' : 'Tambah Keahlian';
  document.getElementById('skillId').value = skill ? skill.id : '';
  document.getElementById('skillName').value = skill ? skill.name : '';
  document.getElementById('skillCategory').value = skill ? skill.category : '';
  document.getElementById('skillLevel').value = skill ? skill.level : 'advanced';
  modal.style.display = 'flex';
}

function deleteSkill(id, name) {
  showConfirm('Hapus Keahlian?', `"${name}" akan dihapus dari database.`, async () => {
    try {
      await apiDelete(`/skills/${id}`);
      showToast('Keahlian dihapus');
      await loadSkills();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function saveSkill() {
  const btn = document.getElementById('saveSkillBtn');
  btnLoading(btn, true);
  try {
    const id = document.getElementById('skillId').value;
    const body = {
      id: id || undefined,
      name:     document.getElementById('skillName').value.trim(),
      category: document.getElementById('skillCategory').value.trim(),
      level:    document.getElementById('skillLevel').value,
      order_index: skillsData.length,
    };
    if (!body.name) throw new Error('Nama keahlian wajib diisi');
    if (id) {
      await apiPut(`/skills/${id}`, body);
    } else {
      await apiPost('/skills', body);
    }
    showToast('Keahlian berhasil disimpan!');
    document.getElementById('skillModal').style.display = 'none';
    await loadSkills();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnLoading(btn, false, 'Simpan');
  }
}

/* ─────────────────────────────────────────────────────────────
   § 05. PENGALAMAN & PENDIDIKAN
───────────────────────────────────────────────────────────── */
let expData = [];
let eduData = [];

async function loadExperience() {
  try {
    const [expRes, eduRes] = await Promise.all([apiGet('/experience'), apiGet('/education')]);
    expData = (expRes.data || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    eduData = (eduRes.data || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    renderExpList();
    renderEduList();
  } catch (err) {
    showToast('Gagal memuat pengalaman: ' + err.message, 'error');
  }
}

function renderExpList() {
  const list = document.getElementById('expList');
  if (!expData.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-title">Belum ada pengalaman</div></div>`;
    return;
  }
  list.innerHTML = expData.map((e, i) => `
    <div class="item-card">
      <div class="item-card-order">
        <button class="btn-icon" onclick="moveExp('${escapeHtml(e.id)}', -1)" ${i===0?'disabled':''}>
          <svg viewBox="0 0 10 10" fill="none" width="10" height="10"><path d="M2 7l3-4 3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
        <button class="btn-icon" onclick="moveExp('${escapeHtml(e.id)}', 1)" ${i===expData.length-1?'disabled':''}>
          <svg viewBox="0 0 10 10" fill="none" width="10" height="10"><path d="M2 3l3 4 3-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="item-body">
        <div class="item-title">${escapeHtml(e.role || 'Tanpa Judul')}</div>
        <div class="item-meta">${escapeHtml(e.company || '—')} · ${escapeHtml(e.period || '')} · ${escapeHtml(e.type || '')}</div>
      </div>
      <div class="item-actions">
        <button class="btn-ghost-sm" onclick="editExp('${escapeHtml(e.id)}')">Edit</button>
        <button class="btn-icon btn-icon--danger" onclick="deleteExp('${escapeHtml(e.id)}', '${escapeHtml(e.role || '')}')">
          <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M2 3h10M5 3V2h4v1M3 3l1 9h6l1-9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

function renderEduList() {
  const list = document.getElementById('eduList');
  if (!eduData.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-title">Belum ada pendidikan</div></div>`;
    return;
  }
  list.innerHTML = eduData.map((e, i) => `
    <div class="item-card">
      <div class="item-card-order">
        <button class="btn-icon" onclick="moveEdu('${escapeHtml(e.id)}', -1)" ${i===0?'disabled':''}>
          <svg viewBox="0 0 10 10" fill="none" width="10" height="10"><path d="M2 7l3-4 3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
        <button class="btn-icon" onclick="moveEdu('${escapeHtml(e.id)}', 1)" ${i===eduData.length-1?'disabled':''}>
          <svg viewBox="0 0 10 10" fill="none" width="10" height="10"><path d="M2 3l3 4 3-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="item-body">
        <div class="item-title">${escapeHtml(e.degree || 'Tanpa Judul')}</div>
        <div class="item-meta">${escapeHtml(e.institution || '—')} · ${escapeHtml(e.period || '')}</div>
      </div>
      <div class="item-actions">
        <button class="btn-ghost-sm" onclick="editEdu('${escapeHtml(e.id)}')">Edit</button>
        <button class="btn-icon btn-icon--danger" onclick="deleteEdu('${escapeHtml(e.id)}', '${escapeHtml(e.degree || '')}')">
          <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M2 3h10M5 3V2h4v1M3 3l1 9h6l1-9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

async function moveExp(id, dir) {
  const idx = expData.findIndex(e => e.id === id);
  if (idx < 0) return;
  const ni = idx + dir;
  if (ni < 0 || ni >= expData.length) return;
  [expData[idx], expData[ni]] = [expData[ni], expData[idx]];
  expData.forEach((e, i) => e.order_index = i);
  renderExpList();
  try {
    await Promise.all([apiPut(`/experience/${expData[idx].id}`, expData[idx]), apiPut(`/experience/${expData[ni].id}`, expData[ni])]);
  } catch (err) { showToast('Gagal simpan urutan: '+err.message,'error'); }
}

async function moveEdu(id, dir) {
  const idx = eduData.findIndex(e => e.id === id);
  if (idx < 0) return;
  const ni = idx + dir;
  if (ni < 0 || ni >= eduData.length) return;
  [eduData[idx], eduData[ni]] = [eduData[ni], eduData[idx]];
  eduData.forEach((e, i) => e.order_index = i);
  renderEduList();
  try {
    await Promise.all([apiPut(`/education/${eduData[idx].id}`, eduData[idx]), apiPut(`/education/${eduData[ni].id}`, eduData[ni])]);
  } catch (err) { showToast('Gagal simpan urutan: '+err.message,'error'); }
}

function openExpModal(exp = null) {
  document.getElementById('expModalTitle').textContent = exp ? 'Edit Pengalaman' : 'Tambah Pengalaman';
  document.getElementById('expId').value = exp ? exp.id : '';
  document.getElementById('expRole').value = exp ? (exp.role||'') : '';
  document.getElementById('expCompany').value = exp ? (exp.company||'') : '';
  document.getElementById('expPeriod').value = exp ? (exp.period||'') : '';
  document.getElementById('expType').value = exp ? (exp.type||'Organisasi') : 'Organisasi';
  document.getElementById('expLocation').value = exp ? (exp.location||'') : '';
  document.getElementById('expDesc').value = exp ? (exp.desc||'') : '';
  const hl = exp && exp.highlights_json ? JSON.parse(exp.highlights_json) : [];
  document.getElementById('expHighlights').value = hl.join('; ');
  document.getElementById('expCurrent').checked = !!(exp && exp.current);
  document.getElementById('expModal').style.display = 'flex';
}

function editExp(id) { openExpModal(expData.find(e => e.id === id)); }

function deleteExp(id, name) {
  showConfirm('Hapus Pengalaman?', `"${name}" akan dihapus.`, async () => {
    try {
      await apiDelete(`/experience/${id}`);
      showToast('Pengalaman dihapus');
      await loadExperience();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function saveExp() {
  const btn = document.getElementById('saveExpBtn');
  btnLoading(btn, true);
  try {
    const id = document.getElementById('expId').value;
    const hlStr = document.getElementById('expHighlights').value;
    const hl = hlStr ? hlStr.split(';').map(s => s.trim()).filter(Boolean) : [];
    const body = {
      id: id || undefined,
      role:            document.getElementById('expRole').value.trim(),
      company:         document.getElementById('expCompany').value.trim(),
      period:          document.getElementById('expPeriod').value.trim(),
      type:            document.getElementById('expType').value,
      location:        document.getElementById('expLocation').value.trim(),
      desc:            document.getElementById('expDesc').value.trim(),
      highlights_json: JSON.stringify(hl),
      current:         document.getElementById('expCurrent').checked ? 1 : 0,
      order_index:     id ? (expData.find(e=>e.id===id)||{}).order_index||0 : expData.length,
    };
    if (id) await apiPut(`/experience/${id}`, body);
    else await apiPost('/experience', body);
    showToast('Pengalaman berhasil disimpan!');
    document.getElementById('expModal').style.display = 'none';
    await loadExperience();
  } catch (err) { showToast(err.message, 'error'); }
  finally { btnLoading(btn, false, 'Simpan'); }
}

function openEduModal(edu = null) {
  document.getElementById('eduModalTitle').textContent = edu ? 'Edit Pendidikan' : 'Tambah Pendidikan';
  document.getElementById('eduId').value = edu ? edu.id : '';
  document.getElementById('eduDegree').value = edu ? (edu.degree||'') : '';
  document.getElementById('eduInstitution').value = edu ? (edu.institution||'') : '';
  document.getElementById('eduPeriod').value = edu ? (edu.period||'') : '';
  document.getElementById('eduGpa').value = edu ? (edu.gpa||'') : '';
  document.getElementById('eduDetail').value = edu ? (edu.detail||'') : '';
  const tags = edu && edu.tags_json ? JSON.parse(edu.tags_json) : [];
  document.getElementById('eduTags').value = tags.join(', ');
  document.getElementById('eduModal').style.display = 'flex';
}

function editEdu(id) { openEduModal(eduData.find(e => e.id === id)); }

function deleteEdu(id, name) {
  showConfirm('Hapus Pendidikan?', `"${name}" akan dihapus.`, async () => {
    try {
      await apiDelete(`/education/${id}`);
      showToast('Pendidikan dihapus');
      await loadExperience();
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function saveEdu() {
  const btn = document.getElementById('saveEduBtn');
  btnLoading(btn, true);
  try {
    const id = document.getElementById('eduId').value;
    const tagsStr = document.getElementById('eduTags').value;
    const tags = tagsStr ? tagsStr.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const body = {
      id: id || undefined,
      degree:      document.getElementById('eduDegree').value.trim(),
      institution: document.getElementById('eduInstitution').value.trim(),
      period:      document.getElementById('eduPeriod').value.trim(),
      gpa:         document.getElementById('eduGpa').value.trim(),
      detail:      document.getElementById('eduDetail').value.trim(),
      tags_json:   JSON.stringify(tags),
      order_index: id ? (eduData.find(e=>e.id===id)||{}).order_index||0 : eduData.length,
    };
    if (id) await apiPut(`/education/${id}`, body);
    else await apiPost('/education', body);
    showToast('Pendidikan berhasil disimpan!');
    document.getElementById('eduModal').style.display = 'none';
    await loadExperience();
  } catch (err) { showToast(err.message, 'error'); }
  finally { btnLoading(btn, false, 'Simpan'); }
}

/* ─────────────────────────────────────────────────────────────
   § 06. SERTIFIKASI
───────────────────────────────────────────────────────────── */
let certsData = [];

async function loadCertificates() {
  const list = document.getElementById('certsList');
  list.innerHTML = `<div class="empty-state"><div class="loading-spinner"></div></div>`;
  try {
    const res = await apiGet('/certificates');
    certsData = (res.data || []).sort((a,b)=>(a.order_index||0)-(b.order_index||0));
    renderCertsList();
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p class="empty-state-desc">${escapeHtml(err.message)}</p></div>`;
  }
}

function renderCertsList() {
  const list = document.getElementById('certsList');
  if (!certsData.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-title">Belum ada sertifikat</div></div>`;
    return;
  }
  list.innerHTML = certsData.map((c, i) => `
    <div class="item-card">
      <div class="item-card-order">
        <button class="btn-icon" onclick="moveCert('${escapeHtml(c.id)}',-1)" ${i===0?'disabled':''}>
          <svg viewBox="0 0 10 10" fill="none" width="10" height="10"><path d="M2 7l3-4 3 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
        <button class="btn-icon" onclick="moveCert('${escapeHtml(c.id)}',1)" ${i===certsData.length-1?'disabled':''}>
          <svg viewBox="0 0 10 10" fill="none" width="10" height="10"><path d="M2 3l3 4 3-4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="item-body">
        <div class="item-title">${escapeHtml(c.title||'Tanpa Judul')}</div>
        <div class="item-meta">${escapeHtml(c.issuer||'—')} · ${escapeHtml(c.year||'')}</div>
      </div>
      <div class="item-actions">
        <button class="btn-ghost-sm" onclick="editCert('${escapeHtml(c.id)}')">Edit</button>
        <button class="btn-icon btn-icon--danger" onclick="deleteCert('${escapeHtml(c.id)}','${escapeHtml(c.title||'')}')">
          <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M2 3h10M5 3V2h4v1M3 3l1 9h6l1-9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

async function moveCert(id, dir) {
  const idx = certsData.findIndex(c=>c.id===id);
  if (idx<0) return;
  const ni=idx+dir;
  if (ni<0||ni>=certsData.length) return;
  [certsData[idx],certsData[ni]]=[certsData[ni],certsData[idx]];
  certsData.forEach((c,i)=>c.order_index=i);
  renderCertsList();
  try {
    await Promise.all([apiPut(`/certificates/${certsData[idx].id}`,certsData[idx]),apiPut(`/certificates/${certsData[ni].id}`,certsData[ni])]);
  } catch(err){showToast('Gagal simpan urutan: '+err.message,'error');}
}

function openCertModal(cert=null) {
  document.getElementById('certModalTitle').textContent = cert ? 'Edit Sertifikat' : 'Tambah Sertifikat';
  document.getElementById('certId').value = cert ? cert.id : '';
  document.getElementById('certTitle').value = cert ? (cert.title||'') : '';
  document.getElementById('certIssuer').value = cert ? (cert.issuer||'') : '';
  document.getElementById('certYear').value = cert ? (cert.year||'') : '';
  document.getElementById('certCredid').value = cert ? (cert.credid||'') : '';
  document.getElementById('certBadge').value = cert ? (cert.badge||cert.credid||'') : '';
  document.getElementById('certDesc').value = cert ? (cert.desc||'') : '';
  const skills = cert && cert.skills_json ? JSON.parse(cert.skills_json) : [];
  document.getElementById('certSkills').value = skills.join(', ');
  document.getElementById('certUrl').value = cert ? (cert.url||'') : '';
  document.getElementById('certModal').style.display = 'flex';
}

function editCert(id) { openCertModal(certsData.find(c=>c.id===id)); }

function deleteCert(id, name) {
  showConfirm('Hapus Sertifikat?', `"${name}" akan dihapus.`, async () => {
    try {
      await apiDelete(`/certificates/${id}`);
      showToast('Sertifikat dihapus');
      await loadCertificates();
    } catch(err){showToast(err.message,'error');}
  });
}

async function saveCert() {
  const btn = document.getElementById('saveCertBtn');
  btnLoading(btn, true);
  try {
    const id = document.getElementById('certId').value;
    const skillsStr = document.getElementById('certSkills').value;
    const skills = skillsStr ? skillsStr.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const body = {
      id: id||undefined,
      title:       document.getElementById('certTitle').value.trim(),
      issuer:      document.getElementById('certIssuer').value.trim(),
      year:        document.getElementById('certYear').value.trim(),
      credid:      document.getElementById('certCredid').value.trim(),
      desc:        document.getElementById('certDesc').value.trim(),
      skills_json: JSON.stringify(skills),
      url:         document.getElementById('certUrl').value.trim(),
      order_index: id ? (certsData.find(c=>c.id===id)||{}).order_index||0 : certsData.length,
    };
    if (id) await apiPut(`/certificates/${id}`, body);
    else await apiPost('/certificates', body);
    showToast('Sertifikat berhasil disimpan!');
    document.getElementById('certModal').style.display = 'none';
    await loadCertificates();
  } catch(err){showToast(err.message,'error');}
  finally{btnLoading(btn,false,'Simpan');}
}

/* ─────────────────────────────────────────────────────────────
   § 07. KONTAK & SOSIAL
───────────────────────────────────────────────────────────── */
async function loadContact() {
  try {
    const [profileRes, landingRes] = await Promise.all([apiGet('/profile'), apiGet('/landing')]);
    const p = profileRes.data || {};
    const contact = (landingRes.data || {}).contact || {};
    document.getElementById('contactHeadline').value = contact.headline || '';
    document.getElementById('contactSub').value = contact.sub || '';
    document.getElementById('contactEmail').value = p.email || contact.email || '';
    document.getElementById('contactGithub').value = p.github || '';
    document.getElementById('contactLinkedin').value = p.linkedin || '';
    document.getElementById('contactTwitter').value = p.twitter || '';
    document.getElementById('contactInstagram').value = p.dribbble || '';
  } catch (err) {
    showToast('Gagal memuat kontak: ' + err.message, 'error');
  }
}

async function saveContact() {
  const btn = document.getElementById('saveContactBtn');
  btnLoading(btn, true);
  try {
    const email = document.getElementById('contactEmail').value.trim();
    const github = document.getElementById('contactGithub').value.trim();
    const linkedin = document.getElementById('contactLinkedin').value.trim();
    const twitter = document.getElementById('contactTwitter').value.trim();
    const instagram = document.getElementById('contactInstagram').value.trim();
    // Save profile socials
    const profileRes = await apiGet('/profile');
    await apiPut('/profile', { ...profileRes.data, email, github, linkedin, twitter, dribbble: instagram, website: instagram });
    // Save contact landing section
    const landingRes = await apiGet('/landing');
    const contactSection = {
      ...((landingRes.data || {}).contact || {}),
      headline: document.getElementById('contactHeadline').value,
      sub:      document.getElementById('contactSub').value,
      email,
    };
    await apiPut('/landing/contact', contactSection);
    showToast('Kontak & sosial berhasil disimpan!');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnLoading(btn, false, 'Simpan Kontak & Sosial');
  }
}

/* ─────────────────────────────────────────────────────────────
   § 08. INBOX
───────────────────────────────────────────────────────────── */
async function loadInbox() {
  const list = document.getElementById('inboxList');
  list.innerHTML = `<div class="empty-state"><div class="loading-spinner"></div></div>`;
  try {
    const res = await apiGet('/contact');
    const msgs = (res.data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (!msgs.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📬</div><div class="empty-state-title">Belum ada pesan masuk</div><p class="empty-state-desc">Pesan dari formulir kontak Landing Page akan muncul di sini.</p></div>`;
      return;
    }
    list.innerHTML = msgs.map(m => `
      <div class="msg-card ${m.status === 'unread' ? 'msg-card--unread' : ''}">
        <div class="msg-header">
          <div>
            <div class="msg-sender">${escapeHtml(m.name || '—')}</div>
            <div class="msg-meta">${escapeHtml(m.email || '')} · ${fmtDate(m.created_at)} ${m.status === 'unread' ? '· <span style="color:var(--accent)">Baru</span>' : ''}</div>
          </div>
        </div>
        ${m.project ? `<div class="msg-subject">${escapeHtml(m.project)}</div>` : ''}
        <div class="msg-body">${escapeHtml(m.message || '')}</div>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><p class="empty-state-desc">${escapeHtml(err.message)}</p></div>`;
  }
}

/* ─────────────────────────────────────────────────────────────
   § 09. SETTINGS
───────────────────────────────────────────────────────────── */
function loadSettings() {
  document.getElementById('sysServer').textContent = window.location.origin;
  document.getElementById('sysSession').textContent = authToken ? 'Active (24h)' : 'None';
}

async function changePassword() {
  const btn = document.getElementById('changePasswordBtn');
  const current = document.getElementById('currentPassword').value;
  const newPw = document.getElementById('newPassword').value;
  const confirm = document.getElementById('confirmPassword').value;
  if (!current || !newPw) { showToast('Isi semua field password', 'error'); return; }
  if (newPw.length < 6) { showToast('Password baru minimal 6 karakter', 'error'); return; }
  if (newPw !== confirm) { showToast('Konfirmasi password tidak sesuai', 'error'); return; }
  btnLoading(btn, true);
  try {
    await apiPost('/auth/change-password', { currentPassword: current, newPassword: newPw });
    showToast('Password berhasil diubah!');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btnLoading(btn, false, 'Ubah Password');
  }
}

/* ─────────────────────────────────────────────────────────────
   IMAGE UPLOAD HELPERS
───────────────────────────────────────────────────────────── */
function setupUploadZone(zoneId, fileInputId, onUrl) {
  const zone = document.getElementById(zoneId);
  const fileInput = document.getElementById(fileInputId);
  if (!zone || !fileInput) return;

  zone.addEventListener('click', () => fileInput.click());
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.style.borderColor = 'var(--accent)'; });
  zone.addEventListener('dragleave', () => { zone.style.borderColor = ''; });
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file, onUrl);
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) uploadFile(file, onUrl);
    fileInput.value = '';
  });
}

async function uploadFile(file, onUrl) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const res = await apiPost('/upload', { data: e.target.result, filename: file.name, type: file.type });
      if (res.url) {
        onUrl(res.url);
        showToast('Gambar berhasil diunggah!');
      }
    } catch (err) {
      showToast('Upload gagal: ' + err.message, 'error');
    }
  };
  reader.readAsDataURL(file);
}

/* ─────────────────────────────────────────────────────────────
   INIT & EVENT BINDING
───────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {

  // Check auth on load
  const valid = await checkAuth();
  if (valid) {
    showDashboard();
    await loadDashboard();
  } else {
    authToken = '';
    sessionStorage.removeItem('admin_token');
    showLogin();
  }

  // Login form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('logoutBtnSettings').addEventListener('click', handleLogout);

  // Nav items
  document.querySelectorAll('.nav-item[data-section]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.section);
    });
  });

  // ── Hero & Profile buttons ──
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('saveHeroCtaBtn').addEventListener('click', saveHeroCta);
  document.getElementById('saveHeroStatsBtn').addEventListener('click', saveHeroStats);

  // Avatar upload
  setupUploadZone('avatarUploadZone', 'avatarFileInput', url => {
    document.getElementById('profileAvatar').value = url;
    document.getElementById('avatarPreviewImg').src = url;
  });
  document.getElementById('profileAvatar').addEventListener('input', e => {
    document.getElementById('avatarPreviewImg').src = e.target.value;
  });

  // ── About ──
  document.getElementById('saveAboutBtn').addEventListener('click', saveAbout);

  // ── Halaman & Chrome ──
  const savePagesBtn = document.getElementById('savePagesBtn');
  if (savePagesBtn && typeof savePagesEditor === 'function') {
    savePagesBtn.addEventListener('click', savePagesEditor);
  }

  // ── Projects ──
  document.getElementById('addProjectBtn').addEventListener('click', () => openProjectModal());
  document.getElementById('closeProjectModal').addEventListener('click', () => { document.getElementById('projectModal').style.display='none'; });
  document.getElementById('cancelProjectModal').addEventListener('click', () => { document.getElementById('projectModal').style.display='none'; });
  document.getElementById('saveProjectBtn').addEventListener('click', saveProject);

  // Project cover upload
  setupUploadZone('projectImgUploadZone', 'projectImgFile', url => {
    document.getElementById('projectCover').value = url;
    const prev = document.getElementById('projectCoverPreview');
    prev.src = url;
    prev.style.display = 'block';
  });
  document.getElementById('projectCover').addEventListener('input', e => {
    const prev = document.getElementById('projectCoverPreview');
    if (e.target.value) { prev.src = e.target.value; prev.style.display = 'block'; }
    else { prev.style.display = 'none'; }
  });

  // ── Skills ──
  document.getElementById('addSkillBtn').addEventListener('click', () => openSkillModal());
  document.getElementById('closeSkillModal').addEventListener('click', () => { document.getElementById('skillModal').style.display='none'; });
  document.getElementById('cancelSkillModal').addEventListener('click', () => { document.getElementById('skillModal').style.display='none'; });
  document.getElementById('saveSkillBtn').addEventListener('click', saveSkill);

  // ── Experience ──
  document.getElementById('addExpBtn').addEventListener('click', () => openExpModal());
  document.getElementById('closeExpModal').addEventListener('click', () => { document.getElementById('expModal').style.display='none'; });
  document.getElementById('cancelExpModal').addEventListener('click', () => { document.getElementById('expModal').style.display='none'; });
  document.getElementById('saveExpBtn').addEventListener('click', saveExp);

  document.getElementById('addEduBtn').addEventListener('click', () => openEduModal());
  document.getElementById('closeEduModal').addEventListener('click', () => { document.getElementById('eduModal').style.display='none'; });
  document.getElementById('cancelEduModal').addEventListener('click', () => { document.getElementById('eduModal').style.display='none'; });
  document.getElementById('saveEduBtn').addEventListener('click', saveEdu);

  // ── Certificates ──
  document.getElementById('addCertBtn').addEventListener('click', () => openCertModal());
  document.getElementById('closeCertModal').addEventListener('click', () => { document.getElementById('certModal').style.display='none'; });
  document.getElementById('cancelCertModal').addEventListener('click', () => { document.getElementById('certModal').style.display='none'; });
  document.getElementById('saveCertBtn').addEventListener('click', saveCert);

  // ── Contact ──
  document.getElementById('saveContactBtn').addEventListener('click', saveContact);

  // ── Inbox ──
  document.getElementById('refreshInboxBtn').addEventListener('click', loadInbox);

  // ── Settings ──
  document.getElementById('changePasswordBtn').addEventListener('click', changePassword);

  // ── Confirm modal ──
  document.getElementById('confirmOk').addEventListener('click', () => {
    if (pendingDeleteFn) pendingDeleteFn();
    closeConfirm();
  });
  document.getElementById('confirmCancel').addEventListener('click', closeConfirm);

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.style.display = 'none';
    });
  });

  // ESC closes modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => { m.style.display = 'none'; });
    }
  });
});
