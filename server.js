// GO CARE DRUG — Express backend: public site + CMS API + admin panel.
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db, get, set, log, now, seed } = require('./db');

const PORT = process.env.PORT || 8000;
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));

app.use(session({
  name: 'gocare_admin',
  secret: process.env.SESSION_SECRET || 'gocare-' + require('crypto').randomBytes(16).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 24 * 60 * 60 * 1000 }
}));

// ---- never expose server internals ----
const BLOCKED = [/^\/server\.js/, /^\/db\.js/, /^\/build_site\.py/, /\.py$/, /^\/package.*\.json/, /^\/node_modules\//, /^\/data\//, /^\/\.git\//, /\.db(\b|$)/];
app.use((req, res, next) => {
  if (BLOCKED.some(rx => rx.test(req.path))) return res.status(404).send('Not found');
  next();
});

// ---- uploads ----
const UP_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UP_DIR)) fs.mkdirSync(UP_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: UP_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e6) + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) &&
      ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only JPG, PNG or WEBP images allowed (max 5MB).'), ok);
  }
});
app.use('/uploads', express.static(UP_DIR));

// ================= AUTH =================
function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  if ((req.baseUrl + req.path).startsWith('/api/')) return res.status(401).json({ error: 'Please log in.' });
  return res.redirect('/admin/login.html');
}

app.post('/api/auth/login', (req, res) => {
  const { email, password, remember } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const admin = db.prepare('SELECT * FROM admins WHERE email=?').get(String(email).toLowerCase().trim());
  if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  req.session.adminId = admin.id;
  req.session.adminEmail = admin.email;
  req.session.adminName = admin.name;
  if (remember) req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  log(admin, 'Admin logged in', admin.email, '');
  res.json({ ok: true, admin: { id: admin.id, name: admin.name, email: admin.email } });
});

app.post('/api/auth/logout', (req, res) => {
  const a = currentAdmin(req);
  req.session.destroy(() => res.json({ ok: true }));
  if (a) log(a, 'Admin logged out', a.email, '');
});

app.get('/api/auth/me', (req, res) => {
  const a = currentAdmin(req);
  if (!a) return res.status(401).json({ error: 'Not logged in.' });
  res.json({ admin: { id: a.id, name: a.name, email: a.email } });
});

// 200-status session check (avoids console noise on public/login pages)
app.get('/api/auth/status', (req, res) => {
  const a = currentAdmin(req);
  res.json({ loggedIn: !!a, admin: a ? { id: a.id, name: a.name, email: a.email } : null });
});

app.post('/api/auth/forgot', (req, res) => {
  log(null, 'Password reset requested', String((req.body || {}).email || ''), 'UI request');
  res.json({ ok: true, message: 'If this email exists, reset instructions have been sent.' });
});

function currentAdmin(req) {
  if (!req.session || !req.session.adminId) return null;
  return db.prepare('SELECT * FROM admins WHERE id=?').get(req.session.adminId) || null;
}

// ================= ADMIN API =================
const api = express.Router();
api.use(requireAdmin);
app.use('/api/admin', api);

const J = (v, fb) => { try { return JSON.parse(v); } catch { return fb; } };

// ---- overview ----
api.get('/overview', (req, res) => {
  const q = (sql, ...p) => db.prepare(sql).get(...p);
  res.json({
    totalServices: q('SELECT COUNT(*) c FROM services WHERE deleted=0').c,
    activeServices: q("SELECT COUNT(*) c FROM services WHERE deleted=0 AND status='active'").c,
    totalImages: q('SELECT COUNT(*) c FROM media').c,
    totalPages: q('SELECT COUNT(*) c FROM pages').c,
    recent: db.prepare('SELECT * FROM activity_logs ORDER BY id DESC LIMIT 8').all()
  });
});

// ---- services ----
const svcCols = 'id,slug,name,icon,short_desc,detail_desc,benefits,features,image,status,display_order,page_file,deleted,created_at,updated_at';
api.get('/services', (req, res) => {
  const { q = '', status = '', trashed = '' } = req.query;
  let sql = 'SELECT * FROM services WHERE 1=1', p = [];
  sql += trashed === '1' ? ' AND deleted=1' : ' AND deleted=0';
  if (status) { sql += ' AND status=?'; p.push(status); }
  if (q) { sql += ' AND (name LIKE ? OR slug LIKE ?)'; p.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY display_order ASC, id ASC';
  res.json(db.prepare(sql).all(...p).map(r => ({ ...r, benefits: J(r.benefits, []), features: J(r.features, []) })));
});

function slugify(name, id) {
  let s = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'service';
  let slug = s, i = 2;
  while (db.prepare('SELECT id FROM services WHERE slug=? AND id!=?').get(slug, id || -1)) slug = `${s}-${i++}`;
  return slug;
}

api.post('/services', (req, res) => {
  const a = currentAdmin(req);
  const b = req.body || {};
  if (!b.name || !String(b.name).trim()) return res.status(400).json({ error: 'Service name is required.' });
  if (String(b.name).toLowerCase().includes('medicine')) return res.status(400).json({ error: 'This service is not allowed.' });
  const slug = slugify(b.name);
  const maxO = db.prepare('SELECT COALESCE(MAX(display_order),0) m FROM services').get().m;
  const r = db.prepare(`INSERT INTO services(slug,name,icon,short_desc,detail_desc,benefits,features,image,status,display_order,page_file,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(slug, b.name.trim(), b.icon || '🏥', b.short_desc || '', b.detail_desc || '',
    JSON.stringify(b.benefits || []), JSON.stringify(b.features || []), b.image || '', b.status === 'inactive' ? 'inactive' : 'active',
    maxO + 1, b.page_file || null, now(), now());
  log(a, 'Service added', b.name, slug);
  res.json({ ok: true, id: Number(r.lastInsertRowid) });
});

api.put('/services/:id', (req, res) => {
  const a = currentAdmin(req);
  const cur = db.prepare('SELECT * FROM services WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Service not found.' });
  const b = req.body || {};
  const name = (b.name || cur.name).trim();
  if (name.toLowerCase().includes('medicine')) return res.status(400).json({ error: 'This service is not allowed.' });
  db.prepare(`UPDATE services SET name=?,icon=?,short_desc=?,detail_desc=?,benefits=?,features=?,image=?,status=?,page_file=?,updated_at=? WHERE id=?`)
    .run(name, b.icon || cur.icon, b.short_desc ?? cur.short_desc, b.detail_desc ?? cur.detail_desc,
      JSON.stringify(b.benefits ?? J(cur.benefits, [])), JSON.stringify(b.features ?? J(cur.features, [])),
      b.image ?? cur.image, b.status === 'inactive' ? 'inactive' : 'active', b.page_file ?? cur.page_file, now(), cur.id);
  log(a, 'Service edited', name, 'id ' + cur.id);
  res.json({ ok: true });
});

api.post('/services/:id/toggle', (req, res) => {
  const a = currentAdmin(req);
  const cur = db.prepare('SELECT * FROM services WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Service not found.' });
  const ns = cur.status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE services SET status=?,updated_at=? WHERE id=?').run(ns, now(), cur.id);
  log(a, ns === 'active' ? 'Service activated' : 'Service deactivated', cur.name, '');
  res.json({ ok: true, status: ns });
});

api.post('/services/:id/duplicate', (req, res) => {
  const a = currentAdmin(req);
  const cur = db.prepare('SELECT * FROM services WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Service not found.' });
  const maxO = db.prepare('SELECT COALESCE(MAX(display_order),0) m FROM services').get().m;
  const name = cur.name + ' (Copy)';
  const r = db.prepare(`INSERT INTO services(slug,name,icon,short_desc,detail_desc,benefits,features,image,status,display_order,page_file,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(slugify(name), name, cur.icon, cur.short_desc, cur.detail_desc,
    cur.benefits, cur.features, cur.image, 'inactive', maxO + 1, null, now(), now());
  log(a, 'Service duplicated', name, 'from ' + cur.name);
  res.json({ ok: true, id: Number(r.lastInsertRowid) });
});

api.post('/services/reorder', (req, res) => {
  const a = currentAdmin(req);
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid order.' });
  const st = db.prepare('UPDATE services SET display_order=? WHERE id=?');
  ids.forEach((id, i) => st.run(i + 1, id));
  log(a, 'Services reordered', ids.length + ' items', '');
  res.json({ ok: true });
});

api.delete('/services/:id', (req, res) => {
  const a = currentAdmin(req);
  const cur = db.prepare('SELECT * FROM services WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Service not found.' });
  db.prepare('UPDATE services SET deleted=1,updated_at=? WHERE id=?').run(now(), cur.id);
  log(a, 'Service deleted', cur.name, 'archived (soft-delete)');
  res.json({ ok: true });
});

api.post('/services/:id/restore', (req, res) => {
  const a = currentAdmin(req);
  db.prepare('UPDATE services SET deleted=0,updated_at=? WHERE id=?').run(now(), req.params.id);
  log(a, 'Service restored', 'id ' + req.params.id, '');
  res.json({ ok: true });
});

api.delete('/services/:id/permanent', (req, res) => {
  const a = currentAdmin(req);
  const cur = db.prepare('SELECT * FROM services WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Service not found.' });
  db.prepare('DELETE FROM services WHERE id=?').run(cur.id);
  log(a, 'Service permanently deleted', cur.name, '');
  res.json({ ok: true });
});

// ---- media ----
function mediaUsage(filepath) {
  const used = [];
  db.prepare('SELECT name FROM services WHERE image=? AND deleted=0').all(filepath)
    .forEach(r => used.push('Service: ' + r.name));
  for (const row of db.prepare('SELECT key,value FROM settings').all()) {
    if (row.value === filepath) used.push('Setting: ' + row.key);
  }
  return used;
}

api.get('/media', (req, res) => {
  const { q = '', usage = '' } = req.query;
  let rows = db.prepare('SELECT * FROM media ORDER BY display_order ASC, id DESC').all();
  if (q) rows = rows.filter(r => r.filename.toLowerCase().includes(q.toLowerCase()));
  if (usage) rows = rows.filter(r => (r.usage_tags || '').split(',').includes(usage));
  res.json(rows.map(r => ({ ...r, usedIn: mediaUsage(r.filepath) })));
});

api.post('/media/upload', upload.array('images', 10), (req, res) => {
  const a = currentAdmin(req);
  const out = [];
  for (const f of req.files || []) {
    const fp = 'uploads/' + f.filename;
    const maxO = db.prepare('SELECT COALESCE(MAX(display_order),0) m FROM media').get().m;
    const r = db.prepare('INSERT INTO media(filename,filepath,mimetype,size,usage_tags,display_order,created_at) VALUES(?,?,?,?,?,?,?)')
      .run(f.originalname, fp, f.mimetype, f.size, req.body.usage_tags || '', maxO + 1, now());
    out.push({ id: Number(r.lastInsertRowid), filepath: fp });
  }
  log(a, out.length > 1 ? 'Images uploaded' : 'Image uploaded', out.map(o => o.filepath).join(', '), '');
  res.json({ ok: true, files: out });
});

api.put('/media/:id', (req, res) => {
  const a = currentAdmin(req);
  db.prepare('UPDATE media SET usage_tags=? WHERE id=?').run(String(req.body.usage_tags || ''), req.params.id);
  log(a, 'Image updated', 'id ' + req.params.id, '');
  res.json({ ok: true });
});

api.post('/media/:id/replace', upload.single('image'), (req, res) => {
  const a = currentAdmin(req);
  const cur = db.prepare('SELECT * FROM media WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Image not found.' });
  const fp = 'uploads/' + req.file.filename;
  if (cur.filepath.startsWith('uploads/')) { try { fs.unlinkSync(path.join(__dirname, cur.filepath)); } catch { } }
  db.prepare('UPDATE media SET filename=?,filepath=?,mimetype=?,size=? WHERE id=?')
    .run(req.file.originalname, fp, req.file.mimetype, req.file.size, cur.id);
  // keep references working: point services/settings at the new file
  db.prepare('UPDATE services SET image=? WHERE image=?').run(fp, cur.filepath);
  for (const row of db.prepare('SELECT key FROM settings WHERE value=?').all(cur.filepath)) set(row.key, fp);
  log(a, 'Image replaced', cur.filename, fp);
  res.json({ ok: true, filepath: fp });
});

api.get('/media/:id/usage', (req, res) => {
  const cur = db.prepare('SELECT * FROM media WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Image not found.' });
  res.json({ usedIn: mediaUsage(cur.filepath) });
});

api.post('/media/reorder', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid order.' });
  const st = db.prepare('UPDATE media SET display_order=? WHERE id=?');
  ids.forEach((id, i) => st.run(i + 1, id));
  log(currentAdmin(req), 'Media reordered', ids.length + ' items', '');
  res.json({ ok: true });
});

api.delete('/media/:id', (req, res) => {  const a = currentAdmin(req);
  const cur = db.prepare('SELECT * FROM media WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Image not found.' });
  const used = mediaUsage(cur.filepath);
  if (used.length && req.query.force !== '1') return res.status(409).json({ error: 'Image is in use.', usedIn: used });
  if (cur.filepath.startsWith('uploads/')) { try { fs.unlinkSync(path.join(__dirname, cur.filepath)); } catch { } }
  db.prepare('DELETE FROM media WHERE id=?').run(cur.id);
  log(a, 'Image deleted', cur.filename, used.join('; '));
  res.json({ ok: true });
});

// ---- pages + seo ----
api.get('/pages', (req, res) => {
  res.json(db.prepare('SELECT * FROM pages ORDER BY slug').all());
});
api.put('/pages/:slug', (req, res) => {
  const a = currentAdmin(req);
  const b = req.body || {};
  const cur = db.prepare('SELECT * FROM pages WHERE slug=?').get(req.params.slug);
  if (!cur) return res.status(404).json({ error: 'Page not found.' });
  db.prepare('UPDATE pages SET title=?,seo_title=?,seo_desc=?,keywords=?,og_title=?,og_desc=?,status=?,updated_at=? WHERE slug=?')
    .run(b.title ?? cur.title, b.seo_title ?? cur.seo_title, b.seo_desc ?? cur.seo_desc, b.keywords ?? cur.keywords,
      b.og_title ?? cur.og_title, b.og_desc ?? cur.og_desc, b.status || cur.status, now(), cur.slug);
  log(a, 'Page updated', cur.slug, b.seo_title ? 'SEO saved' : '');
  res.json({ ok: true });
});

// ---- settings (whitelisted keys) ----
const SETTING_KEYS = ['business_name', 'website_title', 'phone', 'whatsapp', 'email', 'address', 'gstin',
  'business_hours', 'logo', 'favicon', 'footer_desc', 'footer_copyright',
  'hero_kicker', 'hero_title', 'hero_sub', 'hero_primary_text', 'hero_primary_link', 'hero_secondary_text', 'hero_image',
  'services_heading', 'services_sub', 'home_about_heading', 'home_about_text', 'home_about_image',
  'about_kicker', 'about_heading', 'about_sub', 'about_intro', 'about_mission', 'about_vision', 'about_why', 'about_image',
  'contact_heading', 'contact_sub'];
api.get('/settings', (req, res) => {
  const o = {}; SETTING_KEYS.forEach(k => o[k] = get(k) ?? '');
  res.json(o);
});
api.put('/settings', (req, res) => {
  const a = currentAdmin(req);
  const b = req.body || {};
  const changed = [];
  for (const k of SETTING_KEYS) {
    if (b[k] !== undefined && String(b[k]) !== (get(k) ?? '')) { set(k, String(b[k])); changed.push(k); }
  }
  if (changed.length) log(a, 'Website settings updated', changed.join(', '), '');
  res.json({ ok: true, changed });
});

// ---- social ----
const SOCIAL_ICONS = ['facebook', 'instagram', 'youtube', 'x', 'linkedin', 'whatsapp', 'link'];
api.get('/social', (req, res) => {
  res.json({ links: db.prepare('SELECT * FROM social_links ORDER BY display_order').all(), icons: SOCIAL_ICONS });
});
api.post('/social', (req, res) => {
  const a = currentAdmin(req);
  const b = req.body || {};
  if (!b.platform || !b.url) return res.status(400).json({ error: 'Platform and URL are required.' });
  try { new URL(b.url); } catch { return res.status(400).json({ error: 'Invalid URL.' }); }
  const maxO = db.prepare('SELECT COALESCE(MAX(display_order),0) m FROM social_links').get().m;
  const r = db.prepare('INSERT INTO social_links(platform,url,icon,status,display_order) VALUES(?,?,?,?,?)')
    .run(b.platform, b.url, SOCIAL_ICONS.includes(b.icon) ? b.icon : 'link', b.status === 'inactive' ? 'inactive' : 'active', maxO + 1);
  log(a, 'Social link added', b.platform, b.url);
  res.json({ ok: true, id: Number(r.lastInsertRowid) });
});
api.put('/social/:id', (req, res) => {
  const a = currentAdmin(req);
  const b = req.body || {};
  if (b.url) { try { new URL(b.url); } catch { return res.status(400).json({ error: 'Invalid URL.' }); } }
  const cur = db.prepare('SELECT * FROM social_links WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found.' });
  db.prepare('UPDATE social_links SET platform=?,url=?,icon=?,status=? WHERE id=?')
    .run(b.platform || cur.platform, b.url || cur.url, SOCIAL_ICONS.includes(b.icon) ? b.icon : cur.icon,
      b.status === 'inactive' ? 'inactive' : 'active', cur.id);
  log(a, 'Social link edited', b.platform || cur.platform, '');
  res.json({ ok: true });
});
api.post('/social/:id/toggle', (req, res) => {
  const a = currentAdmin(req);
  const cur = db.prepare('SELECT * FROM social_links WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found.' });
  const ns = cur.status === 'active' ? 'inactive' : 'active';
  db.prepare('UPDATE social_links SET status=? WHERE id=?').run(ns, cur.id);
  log(a, ns === 'active' ? 'Social link activated' : 'Social link deactivated', cur.platform, '');
  res.json({ ok: true, status: ns });
});
api.post('/social/reorder', (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids)) return res.status(400).json({ error: 'Invalid order.' });
  const st = db.prepare('UPDATE social_links SET display_order=? WHERE id=?');
  ids.forEach((id, i) => st.run(i + 1, id));
  res.json({ ok: true });
});
api.delete('/social/:id', (req, res) => {
  const a = currentAdmin(req);
  const cur = db.prepare('SELECT * FROM social_links WHERE id=?').get(req.params.id);
  if (!cur) return res.status(404).json({ error: 'Not found.' });
  db.prepare('DELETE FROM social_links WHERE id=?').run(cur.id);
  log(a, 'Social link removed', cur.platform, '');
  res.json({ ok: true });
});

// ---- profile ----
api.get('/profile', (req, res) => {
  const a = currentAdmin(req);
  res.json({ admin: { id: a.id, name: a.name, email: a.email } });
});
api.put('/profile', (req, res) => {
  const a = currentAdmin(req);
  const { name, email } = req.body || {};
  if (email && email !== a.email && db.prepare('SELECT id FROM admins WHERE email=?').get(email))
    return res.status(400).json({ error: 'Email already in use.' });
  db.prepare('UPDATE admins SET name=?,email=? WHERE id=?').run(name || a.name, (email || a.email).toLowerCase(), a.id);
  log(a, 'Admin profile updated', email || a.email, '');
  res.json({ ok: true });
});
api.put('/profile/password', (req, res) => {
  const a = currentAdmin(req);
  const { current, next } = req.body || {};
  if (!bcrypt.compareSync(current || '', a.password_hash)) return res.status(400).json({ error: 'Current password is wrong.' });
  if (!next || next.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  db.prepare('UPDATE admins SET password_hash=? WHERE id=?').run(bcrypt.hashSync(next, 10), a.id);
  log(a, 'Admin password changed', a.email, '');
  res.json({ ok: true });
});

// ---- logs ----
api.get('/logs', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
  res.json(db.prepare('SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?').all(limit));
});

// ================= PUBLIC API =================
app.get('/api/public/site', (req, res) => {
  const keys = ['business_name', 'website_title', 'phone', 'whatsapp', 'email', 'address', 'gstin',
    'business_hours', 'logo', 'footer_desc', 'footer_copyright',
    'hero_kicker', 'hero_title', 'hero_sub', 'hero_primary_text', 'hero_primary_link', 'hero_secondary_text', 'hero_image',
    'services_heading', 'services_sub', 'home_about_heading', 'home_about_text', 'home_about_image',
    'about_kicker', 'about_heading', 'about_sub', 'about_intro', 'about_mission', 'about_vision', 'about_why', 'about_image',
    'contact_heading', 'contact_sub'];
  const settings = {}; keys.forEach(k => settings[k] = get(k) ?? '');
  const services = db.prepare("SELECT slug,name,icon,short_desc,detail_desc,benefits,features,image,display_order,page_file FROM services WHERE deleted=0 AND status='active' ORDER BY display_order").all()
    .map(r => ({ ...r, benefits: J(r.benefits, []), features: J(r.features, []) }));
  const social = db.prepare("SELECT platform,url,icon FROM social_links WHERE status='active' ORDER BY display_order").all();
  const pages = {};
  db.prepare("SELECT slug,seo_title,seo_desc,og_title,og_desc FROM pages WHERE status='active'").all()
    .forEach(p => pages[p.slug] = p);
  res.json({ settings, services, social, pages });
});

// ================= ADMIN PAGES =================
app.get('/admin/', (req, res) => {
  if (!req.session || !req.session.adminId) return res.redirect('/admin/login.html');
  res.sendFile(path.join(__dirname, 'admin', 'app.html'));
});
app.get('/admin/app.html', (req, res) => {
  if (!req.session || !req.session.adminId) return res.redirect('/admin/login.html');
  res.sendFile(path.join(__dirname, 'admin', 'app.html'));
});
app.get('/admin', (req, res) => res.redirect('/admin/'));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// ================= PUBLIC SITE =================
app.use(express.static(__dirname, { extensions: ['html'], index: 'index.html' }));

app.use((err, req, res, next) => {
  if (err && err.message) return res.status(400).json({ error: err.message });
  next(err);
});

seed();
app.listen(PORT, () => console.log(`GO CARE DRUG site + CMS running at http://localhost:${PORT}  (admin: /admin/)`));
