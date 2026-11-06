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

    // Static live-server ports on local dev machine
    if (['5500', '5501', '5502', '8080'].includes(loc.port)) {
      return `${loc.protocol}//${loc.hostname || 'localhost'}:3000`;
    }

    // Same origin when served by Express (port 3000, Cloud Run, or reverse proxy)
    return loc.origin;
  }

  function isStaticPagesHost() {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname || '';
    return window.location.protocol === 'file:' || host.endsWith('.github.io');
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
    // BroadcastChannel optional
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

    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = (data && data.error) || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
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
      // 1. Try Express backend server first whenever not on a purely static host
      if (!isStaticPagesHost()) {
        try {
          const res = await request('/api/portfolio', { method: 'GET' });
          if (res && res.data) {
            setCached('portfolio', res.data);
            return res.data;
          }
        } catch (e) {
          // Fall through to static snapshot
        }
      }

      // 2. Try static JSON snapshot on GitHub Pages / root
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
        // Fall through
      }

      // 3. Try localStorage cache
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
      if (!isStaticPagesHost()) {
        try {
          const res = await request(`/api/projects?all=${all ? 'true' : 'false'}`);
          if (res && Array.isArray(res.data)) return res.data;
        } catch (e) {}
      }

      const port = await this.getPortfolio().catch(() => null);
      return (port && Array.isArray(port.projects)) ? port.projects : [];
    },

    async getProject(idOrSlug) {
      if (!isStaticPagesHost()) {
        try {
          const res = await request(`/api/projects/${encodeURIComponent(idOrSlug)}`);
          if (res && res.data) return res.data;
        } catch (e) {}
      }

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
      if (!isStaticPagesHost()) {
        return await request('/api/contact', { method: 'POST', body: data });
      }

      // Send to Supabase directly if hosted on static pages
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
