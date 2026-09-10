// GO CARE DRUG CMS — SQLite (node:sqlite) schema + seed. No native deps.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'gocare.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS admins(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'Admin',
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS services(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏥',
  short_desc TEXT NOT NULL DEFAULT '',
  detail_desc TEXT NOT NULL DEFAULT '',
  benefits TEXT NOT NULL DEFAULT '[]',
  features TEXT NOT NULL DEFAULT '[]',
  image TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  display_order INTEGER NOT NULL DEFAULT 0,
  page_file TEXT,
  deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS media(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  mimetype TEXT NOT NULL DEFAULT '',
  size INTEGER NOT NULL DEFAULT 0,
  usage_tags TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS pages(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  seo_title TEXT NOT NULL DEFAULT '',
  seo_desc TEXT NOT NULL DEFAULT '',
  keywords TEXT NOT NULL DEFAULT '',
  og_title TEXT NOT NULL DEFAULT '',
  og_desc TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings(
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS social_links(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'link',
  status TEXT NOT NULL DEFAULT 'active',
  display_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS activity_logs(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER,
  admin_email TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  item TEXT NOT NULL DEFAULT '',
  detail TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions(
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);
`);

const now = () => new Date().toISOString();
const get = (k) => { const r = db.prepare('SELECT value FROM settings WHERE key=?').get(k); return r ? r.value : null; };
const set = (k, v) => db.prepare('INSERT INTO settings(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(k, v);

function log(admin, action, item = '', detail = '') {
  db.prepare('INSERT INTO activity_logs(admin_id,admin_email,action,item,detail,created_at) VALUES(?,?,?,?,?,?)')
    .run(admin ? admin.id : null, admin ? admin.email : 'system', action, item, detail, now());
}

function seed() {
  // ---- admin (env or generated; NEVER in frontend code) ----
  let admin = db.prepare('SELECT * FROM admins LIMIT 1').get();
  if (!admin) {
    const email = (process.env.ADMIN_EMAIL || 'admin@gocaredrug.in').toLowerCase();
    let password = process.env.ADMIN_PASSWORD;
    let generated = false;
    if (!password) { password = 'GoCare-' + crypto.randomBytes(4).toString('hex'); generated = true; }
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO admins(name,email,password_hash,created_at) VALUES(?,?,?,?)')
      .run('Administrator', email, hash, now());
    admin = db.prepare('SELECT * FROM admins WHERE email=?').get(email);
    console.log('\n==================================================');
    console.log('  GO CARE DRUG Admin account created');
    console.log('  URL:      http://localhost:' + (process.env.PORT || 8000) + '/admin/');
    console.log('  Email:    ' + email);
    console.log('  Password: ' + password + (generated ? '  (generated — change it in Admin Profile)' : ''));
    console.log('==================================================\n');
    log(admin, 'Admin account created', email, 'Initial seed');
  }

  // ---- services (7 preloaded; Medicine stays removed) ----
  const hasSvc = db.prepare('SELECT COUNT(*) c FROM services').get().c;
  if (!hasSvc) {
    const S = [
      ['nursing', 'Nursing Services', '🩺', 'Home nursing support, patient assistance and routine care at home.',
       'Supportive home nursing assistance focused on day-to-day patient comfort, routine care and responsible healthcare coordination.',
       ['Home nursing support', 'Patient assistance for daily needs', 'Routine care support', 'General healthcare assistance', 'Care-focused, family-friendly service'],
       [], 'assets/nursing-welcome.jpg', 'nursing.html'],
      ['medical', 'Doctors Appointment', '👨‍⚕️', 'Doctors appointment support and general healthcare assistance from home.',
       "Doctors appointment support and general healthcare assistance from home.",
       ['Doctor appointment coordination', 'General healthcare assistance', 'Guidance on next steps for care', 'Follow-up visit coordination', 'Home-visit support as required'],
       [], 'assets/medical.jpg', 'medical.html'],
      ['pathologist', 'Pathologist Services', '🔬', 'Home sample collection support with safe and hygienic handling.',
       'Hygienic home sample-collection support for pathology and lab-related needs, handled carefully and delivered through proper lab channels.',
       ['Home sample collection assistance', 'Safe & hygienic collection process', 'Careful sample handling', 'Report delivery coordination', 'Affordable, transparent process'],
       [], 'assets/pathology.jpg', 'pathologist.html'],
      ['compounder', 'Compounder Services', '💉', 'Injections, IV drip support, wound dressing and medicine management assistance.',
       "Responsible compounder assistance for routine medical support at home, strictly as per your doctor's advice.",
       ['Injection support as per doctor advice', 'IV drip & cannulation assistance', 'Wound dressing support', 'Medicine management reminders', 'Basic vitals & patient-care assistance'],
       [], 'assets/compounder.jpg', 'compounder.html'],
      ['physiotherapy', 'Physiotherapy Services', '🦵', 'At-home physiotherapy support for mobility, strength and recovery.',
       'At-home physiotherapy support for pain relief, mobility, strength and post-surgery rehabilitation routines.',
       ['Expert physiotherapy at home', 'Personalised session planning', 'Pain-relief & mobility exercises', 'Post-surgery & elderly support', 'Flexible hourly / daily / weekly sessions'],
       [], 'assets/physiotherapy.jpg', 'physiotherapy.html'],
      ['nurse', 'Nurse Services', '🤝', 'Dedicated nurse support for elderly care and day-to-day patient needs.',
       'Dedicated nurse support for families who need an extra pair of trained hands — elderly care, bedside assistance and day-to-day patient comfort.',
       ['Dedicated nurse for home visits', 'Elderly & bedridden patient support', 'Daily routine & hygiene assistance', 'Companionship with professional conduct', 'Coordination with family members'],
       [], 'assets/nursing-welcome.jpg', 'nurse.html'],
      ['ambulance', 'Ambulance Services', '🚑', 'Emergency assistance and patient transfer support with quick contact.',
       'Quick-contact ambulance coordination for emergency assistance and safe patient transfers — local and long-distance.',
       ['Emergency assistance coordination', 'Rapid response on call', 'Trained medical support staff', 'Stretcher, oxygen & life-support equipment', 'Local & long-distance transfers'],
       [], 'assets/ambulance.jpg', 'ambulance.html'],
    ];
    const ins = db.prepare(`INSERT INTO services(slug,name,icon,short_desc,detail_desc,benefits,features,image,status,display_order,page_file,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    S.forEach((s, i) => ins.run(s[0], s[1], s[2], s[3], s[4], JSON.stringify(s[5]), JSON.stringify(s[6]), s[7], 'active', i + 1, s[8], now(), now()));
    log(admin, 'Services seeded', '7 services', 'Initial seed');
  }

  // ---- pages (SEO) ----
  const hasPages = db.prepare('SELECT COUNT(*) c FROM pages').get().c;
  if (!hasPages) {
    const P = [
      ['index', 'Professional Home Healthcare Services', 'GO CARE DRUG offers home nursing, doctors appointment, pathology, physiotherapy and ambulance support. Call 7759993511.'],
      ['about', 'About Us', 'Learn about GO CARE DRUG — dependable home medical and healthcare support built on care, health and trust.'],
      ['services', 'All Services', 'Browse all 7 GO CARE DRUG home healthcare services: nursing, doctors appointment, pathology, compounder, physiotherapy, nurse and ambulance.'],
      ['contact', 'Contact Us', 'Contact GO CARE DRUG — call or WhatsApp 7759993511, visit BHOOTHNATH SANIDEV MANDIR, or send an enquiry.'],
      ['nursing', 'Nursing Services', 'Nursing Services at home by GO CARE DRUG. Call 7759993511 or send a WhatsApp enquiry.'],
      ['medical', 'Doctors Appointment', 'Doctors Appointment at home by GO CARE DRUG. Call 7759993511 or send a WhatsApp enquiry.'],
      ['pathologist', 'Pathologist Services', 'Pathologist Services at home by GO CARE DRUG. Call 7759993511 or send a WhatsApp enquiry.'],
      ['compounder', 'Compounder Services', 'Compounder Services at home by GO CARE DRUG. Call 7759993511 or send a WhatsApp enquiry.'],
      ['physiotherapy', 'Physiotherapy Services', 'Physiotherapy Services at home by GO CARE DRUG. Call 7759993511 or send a WhatsApp enquiry.'],
      ['nurse', 'Nurse Services', 'Nurse Services at home by GO CARE DRUG. Call 7759993511 or send a WhatsApp enquiry.'],
      ['ambulance', 'Ambulance Services', 'Ambulance Services at home by GO CARE DRUG. Call 7759993511 or send a WhatsApp enquiry.'],
    ];
    const ins = db.prepare('INSERT INTO pages(slug,title,seo_title,seo_desc,keywords,og_title,og_desc,status,updated_at) VALUES(?,?,?,?,?,?,?,?,?)');
    P.forEach(p => ins.run(p[0], p[1], p[1] + ' | GO CARE DRUG', p[2], '', p[1] + ' | GO CARE DRUG', p[2], 'active', now()));
  }

  // ---- settings (only fill missing keys; never overwrite admin edits) ----
  const DEF = {
    business_name: 'GO CARE DRUG', website_title: 'GO CARE DRUG',
    phone: '7759993511', whatsapp: '917759993511', email: '',
    address: 'BHOOTHNATH SANIDEV MANDIR', gstin: '10EBMPK5700GZ1Z',
    business_hours: '', logo: 'assets/logo.jpg', favicon: 'assets/nursing-welcome.jpg',
    footer_desc: 'Dependable home medical and healthcare support designed around comfort, convenience and professional care.',
    footer_copyright: '© GO CARE DRUG. All Rights Reserved.',
    hero_kicker: 'TRUSTED HOME HEALTHCARE SERVICES',
    hero_title: 'Professional Healthcare Services,<br><span>Delivered With Care</span>',
    hero_sub: 'GO CARE DRUG provides dependable home medical and healthcare support designed around comfort, convenience and professional care.',
    hero_primary_text: 'Book a Service', hero_primary_link: 'services.html',
    hero_secondary_text: 'Call 7759993511', hero_image: 'assets/nursing-welcome.jpg',
    services_heading: 'Complete Healthcare Support At Your Doorstep',
    services_sub: 'Tap any service to open its dedicated page.',
    home_about_heading: "One trusted team for your family's everyday care",
    home_about_text: 'From sample collection to attendant support, every request is handled with hygiene, punctuality and compassion.',
    home_about_image: 'assets/compounder.jpg',
    about_kicker: 'ABOUT GO CARE DRUG', about_heading: 'Care, Health & Trust',
    about_sub: 'A healthcare service provider focused on convenient, dependable medical support at home.',
    about_intro: 'GO CARE DRUG is a home medical and healthcare service provider focused on delivering convenient and dependable medical support to patients and families.',
    about_mission: 'To bring organised, compassionate healthcare assistance to every doorstep.',
    about_vision: 'A future where quality home healthcare is convenient and dependable for every family.',
    about_why: 'One trusted team, easy booking on call or WhatsApp, and support planned around the patient\u2019s daily routine.',
    about_image: 'assets/nursing-welcome.jpg',
    contact_heading: 'Contact GO CARE DRUG', contact_sub: 'Call, WhatsApp or visit us — we respond quickly.',
  };
  for (const [k, v] of Object.entries(DEF)) if (get(k) === null) set(k, v);

  // ---- social ----
  if (!db.prepare('SELECT COUNT(*) c FROM social_links').get().c) {
    const ins = db.prepare('INSERT INTO social_links(platform,url,icon,status,display_order) VALUES(?,?,?,?,?)');
    ins.run('Facebook', 'https://www.facebook.com/share/19FcHJ1rnq/', 'facebook', 'active', 1);
    ins.run('Instagram', 'https://www.instagram.com/gocaredrug01?stkn=cGdyaTJnaGIwdmpq', 'instagram', 'active', 2);
    ins.run('YouTube', 'https://www.youtube.com/@GOCAREDRUG', 'youtube', 'active', 3);
  }

  // ---- media records for existing assets ----
  if (!db.prepare('SELECT COUNT(*) c FROM media').get().c) {
    const A = [
      ['logo.jpg', 'assets/logo.jpg', 'Logo', 'logo'],
      ['nursing-welcome.jpg', 'assets/nursing-welcome.jpg', 'Hero, Nursing, Nurse', 'homepage,nursing,nurse'],
      ['medical.jpg', 'assets/medical.jpg', 'Doctors Appointment', 'medical'],
      ['pathology.jpg', 'assets/pathology.jpg', 'Pathologist Services', 'pathologist'],
      ['compounder.jpg', 'assets/compounder.jpg', 'Compounder Services', 'compounder'],
      ['physiotherapy.jpg', 'assets/physiotherapy.jpg', 'Physiotherapy Services', 'physiotherapy'],
      ['ambulance.jpg', 'assets/ambulance.jpg', 'Ambulance Services', 'ambulance'],
    ];
    const ins = db.prepare('INSERT INTO media(filename,filepath,mimetype,size,usage_tags,display_order,created_at) VALUES(?,?,?,?,?,?,?)');
    const fsize = (p) => { try { return fs.statSync(path.join(__dirname, p)).size; } catch { return 0; } };
    A.forEach((a, i) => ins.run(a[0], a[1], 'image/jpeg', fsize(a[1]), a[3], i + 1, now()));
  }
}

module.exports = { db, get, set, log, now, seed };
