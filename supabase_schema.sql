-- =======================================================
-- WalZetass Portfolio — Supabase Schema & Initial Data
-- Run this in Supabase Dashboard -> SQL Editor -> Click "Run"
-- =======================================================

-- 1. PROFILE TABLE
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT DEFAULT '',
  handle TEXT DEFAULT '',
  title TEXT DEFAULT '',
  role TEXT DEFAULT '',
  location TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  longbio TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  github TEXT DEFAULT '',
  linkedin TEXT DEFAULT '',
  twitter TEXT DEFAULT '',
  dribbble TEXT DEFAULT '',
  avatar TEXT DEFAULT '',
  available BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read profile" ON profile;
CREATE POLICY "Public read profile" ON profile FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write profile" ON profile;
CREATE POLICY "Public write profile" ON profile FOR ALL USING (true) WITH CHECK (true);

-- 2. LANDING SECTIONS
CREATE TABLE IF NOT EXISTS landing_sections (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE landing_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read landing" ON landing_sections;
CREATE POLICY "Public read landing" ON landing_sections FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write landing" ON landing_sections;
CREATE POLICY "Public write landing" ON landing_sections FOR ALL USING (true) WITH CHECK (true);

-- 3. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT DEFAULT '',
  title_plain TEXT DEFAULT '',
  slug TEXT DEFAULT '',
  category TEXT DEFAULT '',
  status TEXT DEFAULT 'published',
  year TEXT DEFAULT '',
  tagline TEXT DEFAULT '',
  "desc" TEXT DEFAULT '',
  cover TEXT DEFAULT '',
  stack JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '[]'::jsonb,
  highlights JSONB DEFAULT '[]'::jsonb,
  links JSONB DEFAULT '{}'::jsonb,
  order_index INTEGER DEFAULT 0,
  num TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read projects" ON projects;
CREATE POLICY "Public read projects" ON projects FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write projects" ON projects;
CREATE POLICY "Public write projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- 4. SKILLS
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  level TEXT DEFAULT 'intermediate',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read skills" ON skills;
CREATE POLICY "Public read skills" ON skills FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write skills" ON skills;
CREATE POLICY "Public write skills" ON skills FOR ALL USING (true) WITH CHECK (true);

-- 5. EXPERIENCE
CREATE TABLE IF NOT EXISTS experience (
  id TEXT PRIMARY KEY,
  role TEXT DEFAULT '',
  company TEXT DEFAULT '',
  location TEXT DEFAULT '',
  period TEXT DEFAULT '',
  type TEXT DEFAULT '',
  "desc" TEXT DEFAULT '',
  highlights JSONB DEFAULT '[]'::jsonb,
  "current" BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read experience" ON experience;
CREATE POLICY "Public read experience" ON experience FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write experience" ON experience;
CREATE POLICY "Public write experience" ON experience FOR ALL USING (true) WITH CHECK (true);

-- 6. EDUCATION
CREATE TABLE IF NOT EXISTS education (
  id TEXT PRIMARY KEY,
  degree TEXT DEFAULT '',
  institution TEXT DEFAULT '',
  period TEXT DEFAULT '',
  gpa TEXT DEFAULT '',
  detail TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read education" ON education;
CREATE POLICY "Public read education" ON education FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write education" ON education;
CREATE POLICY "Public write education" ON education FOR ALL USING (true) WITH CHECK (true);

-- 7. CERTIFICATES
CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  title TEXT DEFAULT '',
  issuer TEXT DEFAULT '',
  year TEXT DEFAULT '',
  "desc" TEXT DEFAULT '',
  url TEXT DEFAULT '',
  cover TEXT DEFAULT '',
  credid TEXT DEFAULT '',
  skills JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read certificates" ON certificates;
CREATE POLICY "Public read certificates" ON certificates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write certificates" ON certificates;
CREATE POLICY "Public write certificates" ON certificates FOR ALL USING (true) WITH CHECK (true);

-- 8. CONTROLS
CREATE TABLE IF NOT EXISTS controls (
  id INTEGER PRIMARY KEY DEFAULT 1,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE controls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read controls" ON controls;
CREATE POLICY "Public read controls" ON controls FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write controls" ON controls;
CREATE POLICY "Public write controls" ON controls FOR ALL USING (true) WITH CHECK (true);

-- 9. CONTACT MESSAGES
CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  project TEXT DEFAULT '',
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public insert contact" ON contact_messages;
CREATE POLICY "Public insert contact" ON contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public read contact" ON contact_messages;
CREATE POLICY "Public read contact" ON contact_messages FOR SELECT USING (true);

-- =======================================================
-- INITIAL DATA SEEDING
-- =======================================================

-- PROFILE SEED
INSERT INTO profile (id, name, handle, title, role, location, bio, longbio, email, website, github, linkedin, twitter, dribbble, avatar, available)
VALUES (
  1,
  'M Ihwal Maulana',
  'WalZetass-Kar',
  'Mahasiswa Manajemen Informatika · Developer · AI Enthusiast',
  'Mahasiswa Manajemen Informatika · Developer · AI Enthusiast',
  'Pekanbaru · Indonesia',
  'Saya mahasiswa aktif Manajemen Informatika di Politeknik LP3I Kampus Pekanbaru. Berfokus pada rekayasa perangkat lunak multi-platform, sistem kasir ritel offline-first, dan integrasi kecerdasan buatan berbasis Google Gemini.',
  'Saya M Ihwal Maulana (dikenal di komunitas sebagai WalZetass), mahasiswa aktif program studi Manajemen Informatika di Politeknik LP3I Kampus Pekanbaru. Saya berdedikasi membangun aplikasi yang tidak sekadar memiliki tampilan estetis, melainkan memiliki pondasi arsitektur data yang kokoh, berintegritas tinggi, dan andal digunakan di dunia nyata. Fokus rekayasa saya mencakup pembangunan sistem kasir ritel offline-first (WariPOS), aplikasi mobile Android native (CariKostKita), perpesanan privat intim dua arah (Duo Chat), serta penerapan agen dan model multimodal Google Gemini API.',
  'mihwalmaulana09@gmail.com',
  'https://github.com/WalZetass-kar',
  'https://github.com/WalZetass-kar',
  'https://www.linkedin.com/in/m-ihwal-maulana-15792a353/',
  'https://twitter.com/walzetass',
  'https://github.com/WalZetass-kar',
  '/assets/uploads/1791165479717_ChatGPT_Image_Jul_12__2026__04_59_40_PM.png',
  false
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  handle = EXCLUDED.handle,
  title = EXCLUDED.title,
  role = EXCLUDED.role,
  location = EXCLUDED.location,
  bio = EXCLUDED.bio,
  longbio = EXCLUDED.longbio,
  email = EXCLUDED.email,
  website = EXCLUDED.website,
  github = EXCLUDED.github,
  linkedin = EXCLUDED.linkedin,
  twitter = EXCLUDED.twitter,
  dribbble = EXCLUDED.dribbble,
  avatar = EXCLUDED.avatar,
  available = EXCLUDED.available;

-- LANDING SECTIONS SEED
INSERT INTO landing_sections (key, data) VALUES ('hero', '{"btn1Link":"#projects","btn2Link":"#contact","btn1Text":"Lihat Karya Pilihan","btn2Text":"Hubungi Saya","enabled":true}'::jsonb) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
INSERT INTO landing_sections (key, data) VALUES ('marquee', '{"text":"","enabled":true}'::jsonb) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
INSERT INTO landing_sections (key, data) VALUES ('about', '{"enabled":true,"label":"02 — Tentang","headline":"Rekayasa sistem<br>yang <em>berdaya guna</em>","text1":"Saya <strong>M Ihwal Maulana</strong> (dikenal di komunitas sebagai <em>WalZetass</em>), mahasiswa aktif program studi Manajemen Informatika di Politeknik LP3I Kampus Pekanbaru. Saya berdedikasi membangun aplikasi yang tidak sekadar memiliki tampilan estetis, melainkan memiliki pondasi arsitektur data yang kokoh, berintegritas tinggi, dan andal digunakan di dunia nyata.","text2":"Fokus rekayasa saya mencakup pembangunan sistem kasir ritel offline-first (WariPOS), aplikasi mobile Android native (CariKostKita), perpesanan privat intim dua arah (Duo Chat), serta penerapan agen dan model multimodal Google Gemini API.","stat1Num":"","stat1Label":"","stat2Num":"","stat2Label":"","stat3Num":"","stat3Label":""}'::jsonb) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
INSERT INTO landing_sections (key, data) VALUES ('projects', '{"btnLink":"projects.html","btnText":"Lihat Arsip Lengkap","enabled":true}'::jsonb) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
INSERT INTO landing_sections (key, data) VALUES ('skills', '{"enabled":true,"label":"04 — Keahlian","headline":"Alat &<br><em>Teknologi Nyata</em>","intro":"Kumpulan bahasa pemrograman, kerangka kerja, dan perkakas teknis yang digunakan secara konsisten dalam proyek nyata dan rekayasa multi-platform."}'::jsonb) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
INSERT INTO landing_sections (key, data) VALUES ('experience', '{"enabled":true,"label":"05 — Jejak Perjalanan","headline":"Pendidikan &<br><em>Kontribusi</em>"}'::jsonb) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
INSERT INTO landing_sections (key, data) VALUES ('certs', '{"enabled":true,"label":"06 — Pembelajaran & Kredensial","headline":"Validasi & <em>Sertifikasi Keahlian</em>"}'::jsonb) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;
INSERT INTO landing_sections (key, data) VALUES ('contact', '{"enabled":true,"label":"07 — Kontak & Kolaborasi","headline":"Mari membangun<br>sesuatu yang <em>berdampak</em>","sub":"Terbuka untuk kolaborasi proyek rekayasa sistem, eksplorasi kecerdasan buatan, maupun diskusi teknis. Kirimkan pesan langsung melalui formulir atau email.","email":"mihwalmaulana09@gmail.com"}'::jsonb) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data;

-- SKILLS SEED (23 skills)
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169521', 'HTML & CSS', 'Frontend', 'advanced', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169550', 'JavaScript', 'Frontend', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169561', 'React.js', 'Frontend', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169574', 'Tailwind CSS', 'Frontend', 'advanced', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169584', 'Bootstrap', 'Frontend', 'advanced', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169593', 'Node.js', 'Backend', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169603', 'Express.js', 'Backend', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169614', 'Python', 'Backend', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169624', 'MySQL', 'Database', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169634', 'SQLite', 'Database', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169644', 'Git & GitHub', 'Tools & DevOps', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169656', 'VS Code', 'Tools & DevOps', 'expert', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169668', 'Postman', 'Tools & DevOps', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169679', 'Figma', 'Design', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169689', 'Canva', 'Design', 'advanced', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169699', 'ChatGPT / GPT-4', 'Prompt Engineering', 'advanced', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169709', 'Claude AI', 'Prompt Engineering', 'advanced', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169723', 'Prompt Chaining', 'Prompt Engineering', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169733', 'Zero-shot & Few-shot Prompting', 'Prompt Engineering', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169743', 'Midjourney / DALL�E', 'Prompt Engineering', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169756', 'LangChain', 'Prompt Engineering', 'learning', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169767', 'Linux CLI', 'Tools & DevOps', 'intermediate', 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO skills (id, name, category, level, order_index) VALUES ('s1791167169801', 'Docker (Dasar)', 'Tools & DevOps', 'learning', 0) ON CONFLICT (id) DO NOTHING;

-- EDUCATION SEED (2 entries)
INSERT INTO education (id, degree, institution, period, gpa, detail, tags, order_index) VALUES ('ed1791166668989', 'D2 Manajement Informatika', 'Politeknik LP3I Pekanbaru', '2025 - Sekarang', '3,7', '', '[]'::jsonb, 0) ON CONFLICT (id) DO NOTHING;
INSERT INTO education (id, degree, institution, period, gpa, detail, tags, order_index) VALUES ('ed1791166684663', 'IPA', 'SMA N 2 KUBU BABUSSALAM', '2022 - 2025', '90', '', '[]'::jsonb, 1) ON CONFLICT (id) DO NOTHING;

-- CONTROLS SEED
INSERT INTO controls (id, data) VALUES (1, '{"sections":[{"id":"hero","name":"Hero & Pengantar","desc":"Judul, nama, foto potret, dan slogan pengembang kreatif","icon":"✦","visible":true,"locked":true},{"id":"marquee","name":"Ticker Marquee","desc":"Pita teks berjalan kontinu tak terbatas secara tipografis","icon":"◈","visible":true,"locked":false},{"id":"about","name":"Tentang & Metrik","desc":"Pernyataan editorial, angka metrik, dan ikhtisar bio","icon":"01","visible":true,"locked":false},{"id":"projects","name":"Karya Pilihan","desc":"Studi kasus editorial unggulan & daftar proyek","icon":"02","visible":true,"locked":false},{"id":"skills","name":"Keahlian & Teknologi","desc":"Kategori teknologi, tingkat kemahiran, dan tag keahlian","icon":"03","visible":true,"locked":false},{"id":"experience","name":"Linimasa Pengalaman","desc":"Riwayat karier, peran pada klien, dan pencapaian utama","icon":"04","visible":true,"locked":false},{"id":"certificates","name":"Kredensial & Sertifikat","desc":"Sertifikasi terverifikasi dengan tautan kredensial","icon":"05","visible":true,"locked":false},{"id":"contact","name":"Pernyataan Kontak","desc":"Judul MARI MEMBANGUN SESUATU, formulir kontak & tautan sosial","icon":"06","visible":true,"locked":false}],"three":{"activePage":"homepage","pages":{"homepage":{"enabled":true,"parallax":true,"parallaxStrength":40,"hover":true,"opacity":55,"particles":{"enabled":true,"count":600,"size":25,"opacity":35,"drift":20,"color":"#c8b89a"},"lighting":{"ambientColor":"#111110","ambientIntensity":40,"dirColor":"#c8b89a","dirIntensity":60,"shadows":false},"objects":[{"id":"geo1","name":"Icosahedron","type":"Icosahedron","wireframe":true,"visible":true,"rotX":5,"rotY":7,"rotZ":0,"scale":100,"posX":3.5,"posY":-0.5,"posZ":-1},{"id":"geo2","name":"Torus Ring","type":"Torus","wireframe":true,"visible":true,"rotX":3,"rotY":0,"rotZ":4,"scale":100,"posX":-3.8,"posY":1.5,"posZ":-2},{"id":"geo3","name":"Octahedra Floaters (x5)","type":"Octahedron","wireframe":true,"visible":true,"rotX":6,"rotY":6,"rotZ":2,"scale":70,"posX":0,"posY":0,"posZ":0}]},"about":{"enabled":true,"parallax":true,"parallaxStrength":30,"hover":true,"opacity":18,"particles":{"enabled":true,"count":280,"size":18,"opacity":25,"drift":15,"color":"#c8b89a"},"lighting":{"ambientColor":"#111110","ambientIntensity":30,"dirColor":"#c8b89a","dirIntensity":50,"shadows":false},"objects":[{"id":"geo_a1","name":"Large Torus Ring","type":"Torus","wireframe":true,"visible":true,"rotX":6,"rotY":12,"rotZ":0,"scale":120,"posX":0,"posY":0,"posZ":0},{"id":"geo_a2","name":"Center Icosahedron","type":"Icosahedron","wireframe":true,"visible":true,"rotX":4,"rotY":6,"rotZ":2,"scale":80,"posX":3,"posY":-1,"posZ":-1}]},"projects":{"enabled":true,"parallax":true,"parallaxStrength":35,"hover":true,"opacity":25,"particles":{"enabled":true,"count":400,"size":20,"opacity":30,"drift":20,"color":"#c8b89a"},"lighting":{"ambientColor":"#111110","ambientIntensity":40,"dirColor":"#c8b89a","dirIntensity":60,"shadows":false},"objects":[{"id":"geo_p1","name":"Showcase Torus","type":"Torus","wireframe":true,"visible":true,"rotX":3,"rotY":5,"rotZ":0,"scale":100,"posX":-2,"posY":1,"posZ":-1}]},"detail":{"enabled":true,"parallax":false,"parallaxStrength":15,"hover":false,"opacity":20,"particles":{"enabled":true,"count":250,"size":15,"opacity":20,"drift":10,"color":"#c8b89a"},"lighting":{"ambientColor":"#111110","ambientIntensity":30,"dirColor":"#c8b89a","dirIntensity":40,"shadows":false},"objects":[{"id":"geo_d1","name":"Subtle Background Wire","type":"Icosahedron","wireframe":true,"visible":true,"rotX":2,"rotY":2,"rotZ":0,"scale":90,"posX":2,"posY":0,"posZ":-2}]}},"accentColor":"#c8b89a"},"seo":{"activePage":"home","pages":{"home":{"title":"M Ihwal Maulana — Developer & AI Enthusiast","desc":"Portofolio M Ihwal Maulana (WalZetass) — Mahasiswa Manajemen Informatika Politeknik LP3I Pekanbaru, pengembang WariPOS, CariKostKita, Duo Chat, dan Civic Report.","canonical":"https://walzetass-kar.github.io","keywords":"M Ihwal Maulana, WalZetass, WariPOS, CariKostKita, Duo Chat, LP3I Pekanbaru, Manajemen Informatika, Android Developer, POS Electron","ogTitle":"M Ihwal Maulana — Developer & AI Enthusiast","ogDesc":"Mahasiswa Manajemen Informatika Politeknik LP3I Pekanbaru · Developer · AI Enthusiast.","ogImage":"assets/mockups/waripos-icon.png","sitemap":true,"robots":true,"schema":true,"twitterCard":true,"twitterHandle":"@WalZetass-kar"},"about":{"title":"Tentang — M Ihwal Maulana | Mahasiswa & Developer","desc":"Profil, keahlian teknis, riwayat pendidikan Politeknik LP3I Pekanbaru, organisasi BEM, dan repositori open source oleh M Ihwal Maulana.","canonical":"https://walzetass-kar.github.io/about.html","keywords":"tentang, biografi, Politeknik LP3I, BEM LP3I, WariPOS, CariKostKita, WalZetass-Kar","ogTitle":"Tentang M Ihwal Maulana","ogDesc":"Perjalanan akademis Politeknik LP3I, organisasi BEM, dan rekayasa perangkat lunak mandiri.","ogImage":"assets/profil.png","sitemap":true,"robots":true,"schema":true,"twitterCard":true,"twitterHandle":"@WalZetass-kar"},"projects":{"title":"Karya Nyata — M Ihwal Maulana","desc":"Studi kasus sistem mandiri: WariPOS (POS offline-first), CariKostKita (Android Room), Duo Chat (private messenger), dan Civic Report AI.","canonical":"https://walzetass-kar.github.io/projects.html","keywords":"WariPOS, CariKostKita, Duo Chat, Civic Report, portfolio developer, open source","ogTitle":"Karya Nyata — WalZetass","ogDesc":"Koleksi sistem dan aplikasi siap rilis oleh M Ihwal Maulana.","ogImage":"assets/mockups/waripos-icon.png","sitemap":true,"robots":true,"schema":true,"twitterCard":true,"twitterHandle":"@walzetass"}}},"social":{"links":[{"id":"soc_email","platform":"Email","handle":"mihwalmaulana09@gmail.com","url":"mailto:mihwalmaulana09@gmail.com","visible":true},{"id":"soc_gh","platform":"GitHub","handle":"@WalZetass-kar","url":"https://github.com/WalZetass-kar","visible":true},{"id":"soc_li","platform":"LinkedIn","handle":"M Ihwal Maulana","url":"https://linkedin.com/in/walzetass","visible":true},{"id":"soc_x","platform":"Twitter/X","handle":"@walzetass","url":"https://twitter.com/walzetass","visible":true},{"id":"soc_dr","platform":"Proyek","handle":"WalZetass-kar","url":"https://github.com/WalZetass-kar?tab=repositories","visible":true}],"showInFooter":true,"showInContact":true,"showInHero":false,"openNewTab":true,"heroMax":4},"settings":{"accent":"#c8b89a","siteTitle":"WalZetass — M Ihwal Maulana","analytics":""}}'::jsonb) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data;
- -   8 .   A D M I N   A U T H E N T I C A T I O N 
 C R E A T E   T A B L E   I F   N O T   E X I S T S   a d m i n _ a u t h   ( 
     i d   I N T E G E R   P R I M A R Y   K E Y   D E F A U L T   1 , 
     u s e r n a m e   T E X T   N O T   N U L L , 
     p a s s w o r d   T E X T   N O T   N U L L 
 ) ; 
 
 I N S E R T   I N T O   a d m i n _ a u t h   ( i d ,   u s e r n a m e ,   p a s s w o r d )   
 V A L U E S   ( 1 ,   ' w a l z e t a s s ' ,   ' k a r t i k a d e v i ' )   
 O N   C O N F L I C T   ( i d )   D O   U P D A T E   S E T   
     u s e r n a m e   =   E X C L U D E D . u s e r n a m e ,   
     p a s s w o r d   =   E X C L U D E D . p a s s w o r d ; 
 
 A L T E R   T A B L E   a d m i n _ a u t h   E N A B L E   R O W   L E V E L   S E C U R I T Y ; 
 D R O P   P O L I C Y   I F   E X I S T S   " P u b l i c   r e a d   a d m i n _ a u t h "   O N   a d m i n _ a u t h ; 
 C R E A T E   P O L I C Y   " P u b l i c   r e a d   a d m i n _ a u t h "   O N   a d m i n _ a u t h   F O R   S E L E C T   U S I N G   ( t r u e ) ; 
 D R O P   P O L I C Y   I F   E X I S T S   " P u b l i c   u p d a t e   a d m i n _ a u t h "   O N   a d m i n _ a u t h ; 
 C R E A T E   P O L I C Y   " P u b l i c   u p d a t e   a d m i n _ a u t h "   O N   a d m i n _ a u t h   F O R   U P D A T E   U S I N G   ( t r u e ) ;  
 