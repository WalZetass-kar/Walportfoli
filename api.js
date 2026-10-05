/* ═══════════════════════════════════════════════════════════
   WalZetass Portfolio — api.js
   Unified Client API Client & Synchronization Engine
   ═══════════════════════════════════════════════════════════ */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PortfolioAPI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ── Determine API Base URL ───────────────────────
  function resolveBaseUrl() {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    if (window.PORTFOLIO_API_URL) return window.PORTFOLIO_API_URL;

    const loc = window.location;
    if (loc.protocol === 'file:') {
      return 'http://localhost:3000';
    }

    // If already running directly from our node server
    if (loc.port === '3000') {
      return loc.origin;
    }

    // Default to localhost:3000 if running from Live Server (5500, etc.)
    return `${loc.protocol}//${loc.hostname || 'localhost'}:3000`;
  }

  let BASE_URL = resolveBaseUrl();
  const CHANNEL_NAME = 'wz_cms_channel';
  let broadcastChannel = null;

  // ── Supabase Configuration ───────────────────────
  const SUPABASE_CONFIG = {
    url: 'https://xnsnobxuajebpkxeqgvd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhuc25vYnh1YWplYnBreGVxZ3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNTUzMDEsImV4cCI6MjEwNjczMTMwMX0.8apNT2L4bnW_hWqKB-4T7bSwbVEuKty6U8XMYp5yY84'
  };

  async function supabaseRequest(table, query = '', options = {}) {
    const url = `${SUPABASE_CONFIG.url}/rest/v1/${table}${query}`;
    const defaultHeaders = {
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
    const res = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...(options.headers || {}) }
    });
    if (!res.ok) throw new Error(`Supabase request failed: HTTP ${res.status}`);
    return res.json().catch(() => null);
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    }
  } catch (e) {
    console.warn('[PortfolioAPI] BroadcastChannel not supported in this environment');
  }

  // ── HTTP Request Helper ──────────────────────────
  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {}),
      },
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = (data && data.error) || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`[PortfolioAPI] Error requesting ${endpoint}:`, err.message);
      throw err;
    }
  }

  // ── Cache helper ────────────────────────────────
  function getCached(key, fallback = null) {
    try {
      const item = localStorage.getItem('cache_' + key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  }

  function setCached(key, val) {
    try {
      localStorage.setItem('cache_' + key, JSON.stringify(val));
    } catch {}
  }

  // ── Portfolio API Service ────────────────────────
  const PortfolioAPI = {
    getBaseUrl() {
      return BASE_URL;
    },

    setBaseUrl(url) {
      BASE_URL = url.replace(/\/+$/, '');
    },

    // ── Public Aggregate Data ───────────────────────
    async getPortfolio() {
      // 1. Try local node server if available (e.g. localhost or custom backend)
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000');
      if (isLocal) {
        try {
          const res = await request('/api/portfolio', { method: 'GET' });
          if (res && res.data) {
            setCached('portfolio', res.data);
            return res.data;
          }
        } catch (e) {
          console.warn('[PortfolioAPI] Local server error, falling back:', e.message);
        }
      }

      // 2. Try Supabase REST API
      try {
        const [profData, landData, skillsData, expData, eduData, certsData, projData, ctrlData] = await Promise.all([
          supabaseRequest('profile', '?id=eq.1&select=*').catch(() => null),
          supabaseRequest('landing_sections', '?select=*').catch(() => null),
          supabaseRequest('skills', '?select=*&order=order_index.asc,id.asc').catch(() => null),
          supabaseRequest('experience', '?select=*&order=order_index.asc,created_at.desc').catch(() => null),
          supabaseRequest('education', '?select=*&order=order_index.asc,created_at.desc').catch(() => null),
          supabaseRequest('certificates', '?select=*&order=order_index.asc').catch(() => null),
          supabaseRequest('projects', '?select=*&status=eq.published&order=order_index.asc').catch(() => null),
          supabaseRequest('controls', '?id=eq.1&select=*').catch(() => null)
        ]);

        if (profData && profData.length > 0) {
          const landing = {};
          if (Array.isArray(landData)) {
            landData.forEach(item => {
              landing[item.key] = item.data;
            });
          }
          const ctrl = (ctrlData && ctrlData[0] && ctrlData[0].data) || {};
          const assembled = {
            profile: profData[0],
            landing,
            skills: skillsData || [],
            experience: expData || [],
            education: eduData || [],
            certificates: certsData || [],
            projects: projData || [],
            sections: ctrl.sections || {},
            three: ctrl.three || {},
            seo: ctrl.seo || {},
            social: ctrl.social || {},
            settings: ctrl.settings || {},
            timestamp: new Date().toISOString()
          };
          setCached('portfolio', assembled);
          return assembled;
        }
      } catch (err) {
        console.warn('[PortfolioAPI] Supabase fetch error:', err.message);
      }

      // 3. Try static JSON snapshot on GitHub Pages / root
      try {
        const isInSubdir = typeof window !== 'undefined' && (window.location.pathname.includes('/projects/') || window.location.pathname.includes('/admin/'));
        const jsonPath = isInSubdir ? '../data/portfolio.json' : 'data/portfolio.json';
        const staticRes = await fetch(jsonPath);
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (staticData) {
            setCached('portfolio', staticData);
            return staticData;
          }
        }
      } catch (e) {
        console.warn('[PortfolioAPI] Static snapshot load error:', e.message);
      }

      // 4. Try localStorage cache
      const cached = getCached('portfolio');
      if (cached) return cached;

      throw new Error('Gagal memuat data portofolio dari semua sumber');
    },

    // ── Full CMS State (Admin) ──────────────────────
    async getAdminState() {
      try {
        const res = await request('/api/admin/state', { method: 'GET' });
        if (res && res.data) {
          setCached('admin_state', res.data);
          return res.data;
        }
        throw new Error('Format state admin tidak valid');
      } catch (err) {
        const cached = getCached('admin_state');
        if (cached) {
          console.warn('[PortfolioAPI] Menggunakan cache lokal state admin:', err.message);
          return cached;
        }
        throw err;
      }
    },

    async saveAdminState(state) {
      const res = await request('/api/admin/state', {
        method: 'POST',
        body: state,
      });
      setCached('admin_state', res.data);
      PortfolioAPI.broadcastUpdate('CMS_STATE_UPDATED', res.data);
      return res;
    },

    // ── Projects CRUD ───────────────────────────────
    async getProjects(all = false) {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000');
      if (isLocal) {
        try {
          const res = await request(`/api/projects?all=${all ? 'true' : 'false'}`);
          if (res && res.data) return res.data;
        } catch (e) {}
      }
      try {
        const query = all ? '?select=*&order=order_index.asc' : '?select=*&status=eq.published&order=order_index.asc';
        const data = await supabaseRequest('projects', query);
        if (Array.isArray(data) && data.length) return data;
      } catch (e) {}

      const port = await this.getPortfolio().catch(() => null);
      return (port && port.projects) || [];
    },

    async getProject(idOrSlug) {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000');
      if (isLocal) {
        try {
          const res = await request(`/api/projects/${encodeURIComponent(idOrSlug)}`);
          if (res && res.data) return res.data;
        } catch (e) {}
      }
      try {
        const data = await supabaseRequest('projects', `?or=(id.eq.${encodeURIComponent(idOrSlug)},slug.eq.${encodeURIComponent(idOrSlug)})&select=*`);
        if (data && data.length) return data[0];
      } catch (e) {}

      const projs = await this.getProjects(true).catch(() => []);
      return projs.find(p => p.id === idOrSlug || p.slug === idOrSlug) || null;
    },

    async saveProject(proj) {
      const isUpdate = Boolean(proj.id);
      const endpoint = isUpdate ? `/api/projects/${encodeURIComponent(proj.id)}` : '/api/projects';
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await request(endpoint, { method, body: proj });
      PortfolioAPI.broadcastUpdate('PROJECT_SAVED', res.data);
      return res;
    },

    async deleteProject(id) {
      const res = await request(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
      PortfolioAPI.broadcastUpdate('PROJECT_DELETED', { id });
      return res;
    },

    // ── Profile CRUD ────────────────────────────────
    async getProfile() {
      const res = await request('/api/profile');
      return res.data;
    },

    async saveProfile(profile) {
      const res = await request('/api/profile', { method: 'PUT', body: profile });
      PortfolioAPI.broadcastUpdate('PROFILE_UPDATED', res.data);
      return res;
    },

    // ── Landing Sections CRUD ───────────────────────
    async getLandingSections() {
      const res = await request('/api/landing');
      return res.data;
    },

    async saveLandingSection(sectionId, data) {
      const res = await request(`/api/landing/${encodeURIComponent(sectionId)}`, {
        method: 'PUT',
        body: data,
      });
      PortfolioAPI.broadcastUpdate('SECTION_UPDATED', { sectionId, data: res.data });
      return res;
    },

    // ── Skills CRUD ─────────────────────────────────
    async getSkills() {
      const res = await request('/api/skills');
      return res.data || [];
    },

    async saveSkill(skill) {
      const isUpdate = Boolean(skill.id);
      const endpoint = isUpdate ? `/api/skills/${encodeURIComponent(skill.id)}` : '/api/skills';
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await request(endpoint, { method, body: skill });
      PortfolioAPI.broadcastUpdate('SKILL_SAVED', res.data);
      return res;
    },

    async deleteSkill(id) {
      const res = await request(`/api/skills/${encodeURIComponent(id)}`, { method: 'DELETE' });
      PortfolioAPI.broadcastUpdate('SKILL_DELETED', { id });
      return res;
    },

    // ── Experience CRUD ─────────────────────────────
    async getExperience() {
      const res = await request('/api/experience');
      return res.data || [];
    },

    async saveExperience(exp) {
      const isUpdate = Boolean(exp.id);
      const endpoint = isUpdate ? `/api/experience/${encodeURIComponent(exp.id)}` : '/api/experience';
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await request(endpoint, { method, body: exp });
      PortfolioAPI.broadcastUpdate('EXPERIENCE_SAVED', res.data);
      return res;
    },

    async deleteExperience(id) {
      const res = await request(`/api/experience/${encodeURIComponent(id)}`, { method: 'DELETE' });
      PortfolioAPI.broadcastUpdate('EXPERIENCE_DELETED', { id });
      return res;
    },

    // ── Education CRUD ──────────────────────────────
    async getEducation() {
      const res = await request('/api/education');
      return res.data || [];
    },

    async saveEducation(edu) {
      const isUpdate = Boolean(edu.id);
      const endpoint = isUpdate ? `/api/education/${encodeURIComponent(edu.id)}` : '/api/education';
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await request(endpoint, { method, body: edu });
      PortfolioAPI.broadcastUpdate('EDUCATION_SAVED', res.data);
      return res;
    },

    async deleteEducation(id) {
      const res = await request(`/api/education/${encodeURIComponent(id)}`, { method: 'DELETE' });
      PortfolioAPI.broadcastUpdate('EDUCATION_DELETED', { id });
      return res;
    },

    // ── Certificates CRUD ───────────────────────────
    async getCertificates() {
      const res = await request('/api/certificates');
      return res.data || [];
    },

    async saveCertificate(cert) {
      const isUpdate = Boolean(cert.id);
      const endpoint = isUpdate ? `/api/certificates/${encodeURIComponent(cert.id)}` : '/api/certificates';
      const method = isUpdate ? 'PUT' : 'POST';
      const res = await request(endpoint, { method, body: cert });
      PortfolioAPI.broadcastUpdate('CERTIFICATE_SAVED', res.data);
      return res;
    },

    async deleteCertificate(id) {
      const res = await request(`/api/certificates/${encodeURIComponent(id)}`, { method: 'DELETE' });
      PortfolioAPI.broadcastUpdate('CERTIFICATE_DELETED', { id });
      return res;
    },

    // ── Controls & Settings ─────────────────────────
    async getControlsState() {
      const res = await request('/api/controls');
      return res.data;
    },

    async saveControlsState(controls) {
      const res = await request('/api/controls', { method: 'POST', body: controls });
      PortfolioAPI.broadcastUpdate('CONTROLS_SAVED', res.data);
      return res;
    },

    // ── Media ───────────────────────────────────────
    async getMedia() {
      const res = await request('/api/media');
      return res.data || [];
    },

    async saveMedia(item) {
      const res = await request('/api/media', { method: 'POST', body: item });
      PortfolioAPI.broadcastUpdate('MEDIA_SAVED', res.data);
      return res;
    },

    async deleteMedia(id) {
      const res = await request(`/api/media/${encodeURIComponent(id)}`, { method: 'DELETE' });
      PortfolioAPI.broadcastUpdate('MEDIA_DELETED', { id });
      return res;
    },

    // ── Contact Submission ──────────────────────────
    async sendContact(data) {
      const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '3000');
      if (isLocal) {
        try {
          return await request('/api/contact', { method: 'POST', body: data });
        } catch (e) {
          console.warn('[PortfolioAPI] Local contact endpoint failed, trying Supabase:', e.message);
        }
      }

      // Send to Supabase directly
      try {
        const id = 'msg_' + Date.now();
        const payload = {
          id,
          name: data.name,
          email: data.email,
          project: data.project || '',
          message: data.message
        };
        await supabaseRequest('contact_messages', '', {
          method: 'POST',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify(payload)
        });
        return { success: true, message: 'Pesan berhasil terkirim' };
      } catch (err) {
        console.error('[PortfolioAPI] Contact send error:', err);
        throw err;
      }
    },

    async getContactMessages() {
      const res = await request('/api/contact');
      return res.data || [];
    },

    // ── Reset Database ──────────────────────────────
    async resetDatabase() {
      const res = await request('/api/reset', { method: 'POST' });
      PortfolioAPI.broadcastUpdate('DATABASE_RESET', {});
      return res;
    },

    // ── Broadcast & Real-Time Events ────────────────
    broadcastUpdate(type, payload = {}) {
      const message = { type, payload, timestamp: Date.now() };

      if (broadcastChannel) {
        try {
          broadcastChannel.postMessage(message);
        } catch (e) {
          console.warn('[PortfolioAPI] BroadcastChannel error:', e);
        }
      }

      // Also trigger a window event in the current window
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('portfolio_updated', { detail: message }));
      }
    },

    onUpdate(callback) {
      if (typeof window === 'undefined') return () => {};

      const handler = (evt) => {
        const data = evt.detail || evt.data;
        callback(data);
      };

      if (broadcastChannel) {
        broadcastChannel.addEventListener('message', handler);
      }
      window.addEventListener('portfolio_updated', handler);

      // Return cleanup function
      return () => {
        if (broadcastChannel) {
          broadcastChannel.removeEventListener('message', handler);
        }
        window.removeEventListener('portfolio_updated', handler);
      };
    },
  };

  return PortfolioAPI;
});
