/* ═══════════════════════════════════════════════════════════
   PAGES EDITOR — Editor generik untuk seluruh landing_sections
   Field didefinisikan sebagai skema, form-nya dibangkitkan otomatis.
   ═══════════════════════════════════════════════════════════ */

/* type:
     text     — input satu baris
     textarea — input multi baris (dukung <br> dan <em>)
     list     — array string, satu elemen per baris
     pairs    — array {label,value}, format "Label: Value" per baris
     triple   — array {num,label} / {title,desc,link}, format per baris
     counters — array {target,suffix,label,source}, format "angka | akhiran | label | sumber"
*/

const PAGES_SCHEMA = [
  {
    section: 'chrome', title: 'Chrome Global (semua halaman)', fields: [
      { key: 'brand', label: 'Nama Brand di Logo', type: 'text', hint: 'Teks pada logo navbar & footer' },
      { key: 'navLabels', label: 'Label Menu Navigasi', type: 'list',
        hint: 'Satu label per baris. Urutan menentukan urutan menu.' },
      { key: 'scrollTag', label: 'Teks "Scroll" di Hero', type: 'text' },
      { key: 'copyEmailBtn', label: 'Tombol Salin Email', type: 'text' },
      { key: 'formName', label: 'Label Kolom Nama', type: 'text' },
      { key: 'formEmail', label: 'Label Kolom Email', type: 'text' },
      { key: 'formProject', label: 'Label Kolom Topik', type: 'text' },
      { key: 'formMessage', label: 'Label Kolom Pesan', type: 'text' },
      { key: 'formPlaceholderName', label: 'Placeholder Nama', type: 'text' },
      { key: 'formPlaceholderEmail', label: 'Placeholder Email', type: 'text' },
      { key: 'formPlaceholderProject', label: 'Placeholder Topik', type: 'text' },
      { key: 'formPlaceholderMessage', label: 'Placeholder Pesan', type: 'text' },
      { key: 'formSubmit', label: 'Teks Tombol Kirim', type: 'text' },
      { key: 'formSending', label: 'Teks Saat Mengirim', type: 'text' },
      { key: 'formErrEmpty', label: 'Pesan Kolom Kosong', type: 'text' },
      { key: 'formErrEmail', label: 'Pesan Email Tidak Valid', type: 'text' },
      { key: 'formOk', label: 'Pesan Berhasil Kirim', type: 'text' },
      { key: 'formFail', label: 'Pesan Gagal Kirim', type: 'text' },
      { key: 'emptyProjects', label: 'Teks Kosong — Proyek', type: 'text' },
      { key: 'emptySkills', label: 'Teks Kosong — Keahlian', type: 'text' },
      { key: 'emptyTimeline', label: 'Teks Kosong — Perjalanan', type: 'text' },
      { key: 'emptyCerts', label: 'Teks Kosong — Sertifikasi', type: 'text' },
    ],
  },
  {
    section: 'hero', title: 'Hero (Kartu Samping Foto)', fields: [
      { key: 'eyebrow', label: 'Teks Kecil di Atas Nama', type: 'text', hint: 'Contoh: INFORMATICS STUDENT' },
      { key: 'focusText', label: 'Teks Panel "01 FOCUS"', type: 'textarea' },
      { key: 'coreTech', label: 'Chip Teknologi ("02 CORE TECH")', type: 'list', hint: 'Satu teknologi per baris' },
      { key: 'glanceLabels', label: 'Label 3 Panel Kanan', type: 'list', hint: 'FOCUS / CORE TECH / KARYA UNGGULAN' },
      { key: 'featuredProjects', label: 'Proyek Sorotan ("03 KARYA UNGGULAN")', type: 'triple',
        keys: ['title', 'desc', 'link'], hint: 'Format: Judul | keterangan | link' },
      { key: 'portraitAlt', label: 'Teks Alternatif Foto Formal', type: 'text' },
      { key: 'anonAvatar', label: 'Foto Layer Anonymous', type: 'text' },
      { key: 'anonAlt', label: 'Teks Alternatif Foto Anonymous', type: 'text' },
    ],
  },
  {
    section: 'aboutpage', title: 'Halaman Tentang (about.html)', fields: [
      { key: 'kicker', label: 'Kicker di Atas Judul', type: 'text' },
      { key: 'statement', label: 'Judul Besar', type: 'textarea', hint: 'Boleh <br> dan <em>' },
      { key: 'metaRows', label: 'Daftar Meta (Nama/Akun/Lokasi/Fokus/Status)', type: 'pairs',
        hint: 'Format: Label: Nilai — satu baris per baris' },
      { key: 'body', label: 'Paragraf Narasi', type: 'list', hint: 'Satu paragraf per baris' },
      { key: 'manifesto', label: 'Kutipan Manifesto', type: 'textarea' },
      { key: 'counters', label: 'Angka Statistik', type: 'counters',
        hint: 'Format: angka | akhiran | label | sumber (manual / projects / certificates)' },
      { key: 'chapters', label: 'Nomor & Label Section', type: 'triple', keys: ['num', 'label'],
        hint: 'Format: 01 | Tentang' },
      { key: 'toolbox.title', label: 'Judul Section Toolbox', type: 'textarea' },
      { key: 'toolbox.label', label: 'Label Kecil Toolbox', type: 'text' },
      { key: 'toolbox.intro', label: 'Paragraf Toolbox', type: 'textarea' },
      { key: 'journey.label', label: 'Label Kecil Pengalaman', type: 'text' },
      { key: 'journey.title', label: 'Judul Section Pengalaman', type: 'textarea' },
      { key: 'education.label', label: 'Label Kecil Pendidikan', type: 'text' },
      { key: 'education.title', label: 'Judul Section Pendidikan', type: 'textarea' },
      { key: 'credentials.label', label: 'Label Kecil Sertifikasi', type: 'text' },
      { key: 'credentials.title', label: 'Judul Section Sertifikasi', type: 'textarea' },
      { key: 'credentials.intro', label: 'Paragraf Sertifikasi', type: 'textarea' },
      { key: 'contact.headline', label: 'Headline Kontak (satu kata per baris)', type: 'textarea' },
      { key: 'contact.tagline', label: 'Tagline Kontak', type: 'textarea' },
      { key: 'contact.channelTitle', label: 'Judul Blok Kanal Komunikasi', type: 'text' },
      { key: 'contact.responseTitle', label: 'Judul Blok Waktu Respon', type: 'text' },
      { key: 'contact.responseBody', label: 'Isi Blok Waktu Respon', type: 'textarea' },
      { key: 'contact.hoursTitle', label: 'Judul Blok Jam Kerja', type: 'text' },
      { key: 'contact.hoursBody', label: 'Isi Blok Jam Kerja', type: 'textarea' },
      { key: 'contact.hoursNote', label: 'Catatan Jam Kerja', type: 'text' },
      { key: 'contact.availStatus', label: 'Status Ketersediaan', type: 'text' },
      { key: 'contact.availNext', label: 'Slot Terdekat', type: 'text' },
    ],
  },
  {
    section: 'projects', title: 'Halaman Karya (projects.html)', fields: [
      { key: 'pageLabel', label: 'Label Kecil Halaman', type: 'text' },
      { key: 'pageHeadline', label: 'Judul Halaman', type: 'textarea' },
      { key: 'pageSub', label: 'Subjudul Halaman', type: 'textarea' },
      { key: 'pageMetaPeriod', label: 'Periode di Meta', type: 'text' },
      { key: 'pageMetaEcosystem', label: 'Label Ecosystem di Meta', type: 'text' },
      { key: 'filterLabels', label: 'Label Tombol Filter', type: 'list' },
      { key: 'ctaLabel', label: 'Label Awal CTA', type: 'text' },
      { key: 'ctaHeadline', label: 'Judul CTA', type: 'textarea' },
      { key: 'ctaBtnText', label: 'Teks Tombol CTA', type: 'text' },
      { key: 'ctaBtnLink', label: 'Link Tombol CTA', type: 'text' },
      { key: 'emptyText', label: 'Teks Kosong — Daftar Proyek', type: 'text' },
    ],
  },
  {
    section: 'detail', title: 'Halaman Detail Proyek', fields: [
      { key: 'backLink', label: 'Teks Kembali ke Karya', type: 'text' },
      { key: 'breadcrumbLabel', label: 'Label Breadcrumb', type: 'text' },
      { key: 'summaryLabel', label: 'Label Ringkasan', type: 'text' },
      { key: 'stackLabel', label: 'Label Stack Teknologi', type: 'text' },
      { key: 'challengesTitle', label: 'Judul Tantangan', type: 'textarea' },
      { key: 'challengesLabel', label: 'Label Tantangan', type: 'text' },
      { key: 'solutionTitle', label: 'Judul Solusi', type: 'textarea' },
      { key: 'solutionLabel', label: 'Label Solusi', type: 'text' },
      { key: 'resultsTitle', label: 'Judul Hasil', type: 'textarea' },
      { key: 'resultsLabel', label: 'Label Hasil', type: 'text' },
      { key: 'galleryTitle', label: 'Judul Galeri', type: 'textarea' },
      { key: 'galleryLabel', label: 'Label Galeri', type: 'text' },
      { key: 'nextLabel', label: 'Label Proyek Selanjutnya', type: 'text' },
      { key: 'tocLabels', label: 'Label Daftar Isi', type: 'list' },
      { key: 'notFoundTitle', label: 'Judul Proyek Tidak Ditemukan', type: 'text' },
      { key: 'notFoundBody', label: 'Pesan Tidak Ditemukan', type: 'textarea' },
    ],
  },
];

/* ── Helpers ───────────────────────────────────────────── */
function pagesGet(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function pagesSet(obj, path, val) {
  const keys = path.split('.');
  const last = keys.pop();
  let cur = obj;
  keys.forEach(k => { if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {}; cur = cur[k]; });
  cur[last] = val;
}

function pagesToText(value, type) {
  if (value == null) return '';
  switch (type) {
    case 'list':
      return Array.isArray(value) ? value.join('\n') : String(value);
    case 'pairs':
      return Array.isArray(value) ? value.map(r => `${r.label}: ${r.value}`).join('\n') : '';
    case 'counters':
      return Array.isArray(value)
        ? value.map(c => [c.target, c.suffix, c.label, c.source || 'manual'].join(' | ')).join('\n')
        : '';
    case 'triple':
      return Array.isArray(value)
        ? value.map(o => Object.values(o).join(' | ')).join('\n')
        : '';
    default:
      return String(value);
  }
}

function pagesFromText(text, type) {
  const lines = String(text).split('\n').map(l => l.trim()).filter(Boolean);
  switch (type) {
    case 'list':
      return lines;
    case 'pairs':
      return lines.map(l => {
        const i = l.indexOf(':');
        return i < 0
          ? { label: l, value: '' }
          : { label: l.slice(0, i).trim(), value: l.slice(i + 1).trim() };
      });
    case 'counters':
      return lines.map(l => {
        const p = l.split('|').map(x => x.trim());
        return {
          target: Number(p[0]) || 0,
          suffix: p[1] || '',
          label: p[2] || '',
          source: p[3] || 'manual',
        };
      });
    case 'triple':
      return lines.map(l => l.split('|').map(x => x.trim()));
    default:
      return text;
  }
}

/* ── Render ────────────────────────────────────────────── */
function renderPagesEditor(sections) {
  const host = document.getElementById('pagesEditor');
  if (!host) return;
  host.innerHTML = '';

  PAGES_SCHEMA.forEach(group => {
    const data = sections[group.section] || {};
    const card = document.createElement('div');
    card.className = 'card';
    card.style.marginBottom = '18px';
    card.innerHTML = `<div class="card-header"><h2 class="card-title">${group.title}</h2></div>`;

    const body = document.createElement('div');
    body.className = 'card-body';

    group.fields.forEach(f => {
      const wrap = document.createElement('div');
      wrap.className = 'form-field';
      const id = `pg-${group.section}-${f.key}`.replace(/[^\w-]/g, '_');
      const val = pagesGet(data, f.key);

      let inputHtml;
      if (f.type === 'text') {
        inputHtml = `<input type="text" id="${id}" value="${escapeHtmlAttr(pagesToText(val, f.type))}" />`;
      } else {
        const rows = f.type === 'text' ? 1 : (f.type === 'textarea' ? 3 : 5);
        inputHtml = `<textarea id="${id}" rows="${rows}" placeholder="${escapeHtmlAttr(f.hint || '')}">${escapeHtml(pagesToText(val, f.type))}</textarea>`;
      }

      wrap.innerHTML = `
        <label for="${id}">${escapeHtml(f.label)}</label>
        ${inputHtml}
        ${f.hint ? `<span class="field-hint">${escapeHtml(f.hint)}</span>` : ''}
      `;
      body.appendChild(wrap);
    });

    card.appendChild(body);
    host.appendChild(card);
  });
}

function escapeHtmlAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ── Load & Save ───────────────────────────────────────── */
async function loadPagesEditor() {
  try {
    const res = await apiGet('/landing');
    const sections = res.data || {};
    renderPagesEditor(sections);
  } catch (err) {
    showToast('Gagal memuat konten halaman: ' + err.message, 'error');
  }
}

async function savePagesEditor() {
  const btn = document.getElementById('savePagesBtn');
  const original = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Menyimpan…';
  try {
    // PUT /landing/:section MENGGANTI seluruh JSON section, jadi payload
    // digabung dengan data yang ada supaya field di luar skema (mis.
    // btn1Text, enabled) tidak ikut terhapus.
    const current = (await apiGet('/landing')).data || {};

    for (const group of PAGES_SCHEMA) {
      const payload = JSON.parse(JSON.stringify(current[group.section] || {}));

      for (const f of group.fields) {
        const id = `pg-${group.section}-${f.key}`.replace(/[^\w-]/g, '_');
        const el = document.getElementById(id);
        if (!el) continue;
        if (f.type === 'text') {
          pagesSet(payload, f.key, el.value.trim());
        } else if (f.type === 'textarea') {
          pagesSet(payload, f.key, el.value);
        } else if (f.type === 'triple') {
          const rows = pagesFromText(el.value, 'triple');
          const keys = f.keys || [];
          pagesSet(payload, f.key, rows.map(r => {
            const o = {};
            keys.forEach((k, i) => { o[k] = r[i] == null ? '' : r[i]; });
            return o;
          }));
        } else {
          pagesSet(payload, f.key, pagesFromText(el.value, f.type));
        }
      }
      await apiPut(`/landing/${group.section}`, payload);
    }
    showToast('Semua konten halaman berhasil disimpan!');
  } catch (err) {
    showToast('Gagal menyimpan: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = original;
  }
}