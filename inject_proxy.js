const fs = require('fs');
let adminJs = fs.readFileSync('admin/admin.js', 'utf8');

const supabaseProxyCode = `
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
    if(!res.ok) throw new Error(json.message || json.error || \`Supabase HTTP \${res.status}\`);
    return json;
  };

  if (endpoint === '/auth/verify') return { success: true, valid: true };
  if (endpoint === '/auth/logout') return { success: true };
  if (endpoint === '/auth/login' && method === 'POST') {
    const res = await req(\`admin_auth?username=eq.\${encodeURIComponent(body.username)}\`, { method: 'GET' });
    if (res.length > 0 && res[0].password === body.password) return { success: true, token: 'supabase-token' };
    throw new Error('Kredensial tidak valid');
  }

  // Profile
  if (endpoint === '/profile' && method === 'GET') {
    const res = await req('profile?id=eq.1', { method: 'GET' });
    return { success: true, data: res[0] || {} };
  }
  if (endpoint === '/profile' && method === 'PUT') {
    const res = await req('profile?id=eq.1', { method: 'PATCH', body: JSON.stringify(body) });
    return { success: true, data: res[0] };
  }

  // Landing
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

  // Generic Tables (projects, skills, experience, education, certificates)
  const tables = ['projects', 'skills', 'experience', 'education', 'certificates'];
  for (const table of tables) {
    // Exact match for GET all and POST
    if (endpoint === '/' + table || endpoint.startsWith('/' + table + '?')) {
      if (method === 'GET') {
        const res = await req(table, { method: 'GET' });
        return { success: true, data: res };
      }
      if (method === 'POST') {
        if (!body.id) body.id = Date.now().toString(); // Generate simple ID if missing
        const res = await req(table, { method: 'POST', body: JSON.stringify(body) });
        return { success: true, data: res[0] };
      }
    }
    // Match /table/id for PUT, DELETE
    if (endpoint.startsWith('/' + table + '/')) {
      const parts = endpoint.split('/');
      const id = parts[2];
      if (method === 'PUT' && id) {
        const res = await req(\`\${table}?id=eq.\${encodeURIComponent(id)}\`, { method: 'PATCH', body: JSON.stringify(body) });
        return { success: true, data: res[0] };
      }
      if (method === 'DELETE' && id) {
        await req(\`\${table}?id=eq.\${encodeURIComponent(id)}\`, { method: 'DELETE' });
        return { success: true };
      }
    }
  }

  if (endpoint === '/contact' && method === 'GET') {
    const res = await req('contact_messages', { method: 'GET' });
    return { success: true, data: res };
  }

  if (endpoint === '/upload' && method === 'POST') {
    // For GitHub pages, we can't easily upload to local assets. 
    // Return base64 as the URL directly so it saves to DB.
    return { success: true, url: body.data, filename: body.filename };
  }

  throw new Error('Supabase Proxy: Endpoint not mapped ' + method + ' ' + endpoint);
}
`;

const regex = /async function apiFetch\(endpoint,\s*options\s*=\s*\{\}\)\s*\{([\s\S]*?)return json;\s*\}/;

const originalApiFetch = `async function apiFetch(endpoint, options = {}) {
  const isServerless = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  if (isServerless) return await supabaseProxy(endpoint, options);

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': \`Bearer \${authToken}\` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(API + endpoint, { ...options, headers });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || \`HTTP \${res.status}\`);
  return json;
}`;

adminJs = adminJs.replace(regex, supabaseProxyCode + "\n\n" + originalApiFetch);
fs.writeFileSync('admin/admin.js', adminJs);
console.log('admin.js updated with Supabase Proxy');
