/* ═══════════════════════════════════════════════════════════
   WalZetass Portfolio — server.js
   Dynamic Backend API Server & Database Single Source of Truth
   ═══════════════════════════════════════════════════════════ */

'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./server/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (supports Live Server, localhost, custom domains)
app.use(cors());

// Body parsers with high limit to support base64 image uploads if needed
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static asset serving for website and admin
app.use(express.static(path.join(__dirname)));

/* ─────────────────────────────────────────────────────────────
   PUBLIC AGGREGATED ENDPOINTS
───────────────────────────────────────────────────────────── */

// 1. Consolidated portfolio data for public landing & subpages
app.get('/api/portfolio', (req, res) => {
  try {
    const data = db.getPublishedPortfolio();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching portfolio data:', err);
    res.status(500).json({ success: false, error: 'Gagal memuat data portofolio' });
  }
});

// 2. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

/* ─────────────────────────────────────────────────────────────
   ADMIN CMS STATE & BATCH SYNC
───────────────────────────────────────────────────────────── */

// Full CMS state
app.get('/api/admin/state', (req, res) => {
  try {
    const data = db.getAdminState();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error getting admin state:', err);
    res.status(500).json({ success: false, error: 'Gagal membaca state admin' });
  }
});

// Batch save state from admin dashboard
app.post('/api/admin/state', requireAuth, (req, res) => {
  try {
    const updated = db.saveAdminState(req.body);
    res.json({ success: true, data: updated, message: 'Semua perubahan berhasil disimpan dan dipublikasikan.' });
  } catch (err) {
    console.error('Error saving admin state:', err);
    res.status(500).json({ success: false, error: 'Gagal menyimpan state admin' });
  }
});

/* ─────────────────────────────────────────────────────────────
   AUTH MIDDLEWARE
───────────────────────────────────────────────────────────── */
/**
 * requireAuth — validates Bearer session token from Authorization header.
 * Attach to any mutation endpoint that must be admin-only.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || !db.validateSession(token)) {
    return res.status(401).json({ success: false, error: 'Tidak terotorisasi. Silakan login ke Admin Dashboard.' });
  }
  next();
}

/* ─────────────────────────────────────────────────────────────
   AUTHENTICATION ENDPOINTS
───────────────────────────────────────────────────────────── */

// POST /api/auth/login — verify credentials and return a session token
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username dan password wajib diisi.' });
    }
    if (!db.verifyAdminCredentials(username, password)) {
      return res.status(401).json({ success: false, error: 'Kredensial tidak valid.' });
    }
    const token = db.createSession();
    res.json({ success: true, token, message: 'Login berhasil.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/verify — check whether a token is still valid (no auth required)
app.get('/api/auth/verify', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const valid = db.validateSession(token);
  res.json({ success: valid, valid });
});

// POST /api/auth/logout — destroy the current session token
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) db.destroySession(token);
  res.json({ success: true, message: 'Berhasil logout.' });
});

// POST /api/auth/change-password — change admin password (requires valid session)
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password baru minimal 6 karakter.' });
    }
    db.changeAdminPassword(currentPassword, newPassword);
    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   FILE UPLOAD (Base64 or URL)
───────────────────────────────────────────────────────────── */
/**
 * POST /api/upload — accepts a base64-encoded file (data URI or plain base64),
 * saves it to assets/uploads/, and returns the public URL.
 * Requires valid admin session.
 */
app.post('/api/upload', requireAuth, (req, res) => {
  try {
    const { data, filename } = req.body;
    if (!data || !filename) {
      return res.status(400).json({ success: false, error: 'Data dan filename wajib diisi.' });
    }
    // Accept base64 data URI (e.g. "data:image/png;base64,...") or plain base64
    const base64Data = data.includes(',') ? data.split(',')[1] : data;
    const uploadsDir = path.join(__dirname, 'assets', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    const url = `/assets/uploads/${safeName}`;
    res.json({ success: true, url, filename: safeName, message: 'File berhasil diunggah.' });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   PROFILE CRUD
───────────────────────────────────────────────────────────── */
app.get('/api/profile', (req, res) => {
  try {
    res.json({ success: true, data: db.getProfile() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/profile', requireAuth, (req, res) => {
  try {
    const updated = db.updateProfile(req.body);
    res.json({ success: true, data: updated, message: 'Profil berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/profile', requireAuth, (req, res) => {
  try {
    const updated = db.updateProfile(req.body);
    res.json({ success: true, data: updated, message: 'Profil berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   LANDING SECTIONS CRUD
───────────────────────────────────────────────────────────── */
app.get('/api/landing', (req, res) => {
  try {
    res.json({ success: true, data: db.getLandingSections() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/landing/:section', requireAuth, (req, res) => {
  try {
    const updated = db.updateLandingSection(req.params.section, req.body);
    res.json({ success: true, data: updated, message: `Bagian ${req.params.section} berhasil disimpan` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/landing', requireAuth, (req, res) => {
  try {
    const sections = req.body;
    Object.entries(sections).forEach(([sec, data]) => {
      db.updateLandingSection(sec, data);
    });
    res.json({ success: true, data: db.getLandingSections(), message: 'Bagian landing page berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   PROJECTS CRUD
───────────────────────────────────────────────────────────── */
app.get('/api/projects', (req, res) => {
  try {
    const all = req.query.all === 'true' || req.query.status === 'all';
    res.json({ success: true, data: db.getProjects(all) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const proj = db.getProjectByIdOrSlug(req.params.id);
    if (!proj) {
      return res.status(404).json({ success: false, error: 'Proyek tidak ditemukan' });
    }
    res.json({ success: true, data: proj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/projects', requireAuth, (req, res) => {
  try {
    const saved = db.saveProject(req.body);
    res.json({ success: true, data: saved, message: 'Proyek berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/projects/:id', requireAuth, (req, res) => {
  try {
    const saved = db.saveProject({ ...req.body, id: req.params.id });
    res.json({ success: true, data: saved, message: 'Proyek berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/projects/:id', requireAuth, (req, res) => {
  try {
    const result = db.deleteProject(req.params.id);
    res.json({ success: true, data: result, message: 'Proyek berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   SKILLS CRUD
───────────────────────────────────────────────────────────── */
app.get('/api/skills', (req, res) => {
  try {
    res.json({ success: true, data: db.getSkills() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/skills', requireAuth, (req, res) => {
  try {
    const saved = db.saveSkill(req.body);
    res.json({ success: true, data: saved, message: 'Keahlian berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/skills/:id', requireAuth, (req, res) => {
  try {
    const saved = db.saveSkill({ ...req.body, id: req.params.id });
    res.json({ success: true, data: saved, message: 'Keahlian berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/skills/:id', requireAuth, (req, res) => {
  try {
    res.json({ success: true, data: db.deleteSkill(req.params.id), message: 'Keahlian berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   EXPERIENCE CRUD
───────────────────────────────────────────────────────────── */
app.get('/api/experience', (req, res) => {
  try {
    res.json({ success: true, data: db.getExperience() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/experience', requireAuth, (req, res) => {
  try {
    const saved = db.saveExperience(req.body);
    res.json({ success: true, data: saved, message: 'Pengalaman berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/experience/:id', requireAuth, (req, res) => {
  try {
    const saved = db.saveExperience({ ...req.body, id: req.params.id });
    res.json({ success: true, data: saved, message: 'Pengalaman berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/experience/:id', requireAuth, (req, res) => {
  try {
    res.json({ success: true, data: db.deleteExperience(req.params.id), message: 'Pengalaman berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   EDUCATION CRUD
───────────────────────────────────────────────────────────── */
app.get('/api/education', (req, res) => {
  try {
    res.json({ success: true, data: db.getEducation() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/education', requireAuth, (req, res) => {
  try {
    const saved = db.saveEducation(req.body);
    res.json({ success: true, data: saved, message: 'Pendidikan berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/education/:id', requireAuth, (req, res) => {
  try {
    const saved = db.saveEducation({ ...req.body, id: req.params.id });
    res.json({ success: true, data: saved, message: 'Pendidikan berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/education/:id', requireAuth, (req, res) => {
  try {
    res.json({ success: true, data: db.deleteEducation(req.params.id), message: 'Pendidikan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   CERTIFICATES CRUD
───────────────────────────────────────────────────────────── */
app.get('/api/certificates', (req, res) => {
  try {
    res.json({ success: true, data: db.getCertificates() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/certificates', requireAuth, (req, res) => {
  try {
    const saved = db.saveCertificate(req.body);
    res.json({ success: true, data: saved, message: 'Sertifikat berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/certificates/:id', requireAuth, (req, res) => {
  try {
    const saved = db.saveCertificate({ ...req.body, id: req.params.id });
    res.json({ success: true, data: saved, message: 'Sertifikat berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/certificates/:id', requireAuth, (req, res) => {
  try {
    res.json({ success: true, data: db.deleteCertificate(req.params.id), message: 'Sertifikat berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   CONTROLS & SETTINGS (Sections, Three.js, SEO, Social, Site)
───────────────────────────────────────────────────────────── */
app.get('/api/controls', (req, res) => {
  try {
    res.json({ success: true, data: db.getControlsSettings() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/controls', requireAuth, (req, res) => {
  try {
    const updated = db.saveControlsSettings(req.body);
    res.json({ success: true, data: updated, message: 'Pengaturan kontrol berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/controls', requireAuth, (req, res) => {
  try {
    const updated = db.saveControlsSettings(req.body);
    res.json({ success: true, data: updated, message: 'Pengaturan kontrol berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   MEDIA
───────────────────────────────────────────────────────────── */
app.get('/api/media', (req, res) => {
  try {
    res.json({ success: true, data: db.getMedia() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/media', requireAuth, (req, res) => {
  try {
    const item = db.saveMedia(req.body);
    res.json({ success: true, data: item, message: 'Media berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/media/:id', requireAuth, (req, res) => {
  try {
    res.json({ success: true, data: db.deleteMedia(req.params.id), message: 'Media berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   CONTACT MESSAGES
───────────────────────────────────────────────────────────── */
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, project, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'Nama, email, dan pesan wajib diisi.' });
    }
    const result = db.saveContactMessage({ name, email, project, message });
    res.json({ success: true, data: result, message: 'Pesan Anda telah berhasil dikirim.' });
  } catch (err) {
    console.error('Error saving contact message:', err);
    res.status(500).json({ success: false, error: 'Gagal mengirim pesan' });
  }
});

app.get('/api/contact', (req, res) => {
  try {
    res.json({ success: true, data: db.getContactMessages() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   LOGS & RESET
───────────────────────────────────────────────────────────── */
app.get('/api/log', (req, res) => {
  try {
    res.json({ success: true, data: db.getLog(req.query.limit ? parseInt(req.query.limit, 10) : 50) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/reset', requireAuth, (req, res) => {
  try {
    db.seedDatabase(true);
    res.json({ success: true, message: 'Database berhasil direset ke data default.' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Gagal mereset database' });
  }
});

// 404 fallback for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, error: 'Endpoint tidak ditemukan' });
  }
  next();
});

const server = app.listen(PORT, () => {
  console.log(`✓ Portofolio backend server berjalan di http://localhost:${PORT}`);
  console.log(`✓ API Portfolio: http://localhost:${PORT}/api/portfolio`);
  console.log(`✓ Admin State:   http://localhost:${PORT}/api/admin/state`);
});

module.exports = { app, server };
