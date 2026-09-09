// GO CARE DRUG Admin SPA — all CMS sections. No secrets here; API is session-guarded.
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = iso => { try { return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return iso || ''; } };
const fmtSize = b => b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB';

async function api(url, opts = {}) {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (r.status === 401) { location.href = '/admin/login.html'; throw new Error('Session expired. Please log in.'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed.');
  return d;
}
function toast(m, err) {
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : ''); t.textContent = m;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3800);
}
function modal(html) { $('#modalBox').innerHTML = html; $('#modalWrap').classList.add('show'); }
function closeModal() { $('#modalWrap').classList.remove('show'); }
$('#modalWrap').addEventListener('click', e => { if (e.target.id === 'modalWrap') closeModal(); });
function confirmDlg(title, msg, okLabel = 'Delete') {
  return new Promise(res => {
    modal(`<h3>${esc(title)}</h3><p style="color:#5f7089">${esc(msg)}</p>
      <div class="m-actions"><button class="btn btn-o" id="mNo">Cancel</button>
      <button class="btn btn-danger" id="mYes">${esc(okLabel)}</button></div>`);
    $('#mNo').onclick = () => { closeModal(); res(false); };
    $('#mYes').onclick = () => { closeModal(); res(true); };
  });
}
const view = () => $('#view');
const loading = () => view().innerHTML = '<div class="panel loading"><span class="spin"></span><p>Loading…</p></div>';

// ---------- rich text (small built-in editor, no external deps) ----------
function rteHTML(id, val) {
  return `<div class="rte-toolbar" data-rte="${id}">
    <button type="button" data-c="bold"><b>B</b></button><button type="button" data-c="italic"><i>I</i></button>
    <button type="button" data-c="underline"><u>U</u></button><button type="button" data-c="insertUnorderedList">• List</button>
    <button type="button" data-c="insertOrderedList">1. List</button><button type="button" data-c="createLink">🔗 Link</button></div>
    <div class="rte" id="${id}" contenteditable="true">${val || ''}</div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-rte] button');
  if (!b) return;
  const id = b.parentElement.dataset.rte;
  const ed = document.getElementById(id);
  ed.focus();
  if (b.dataset.c === 'createLink') {
    const u = prompt('Link URL (https://…):', 'https://');
    if (u) document.execCommand('createLink', false, u);
  } else document.execCommand(b.dataset.c, false, null);
});
const getRTE = id => document.getElementById(id).innerHTML;

// ---------- image picker (from media library) ----------
function pickImage(cb) {
  modal(`<h3>Select image</h3>
    <div class="searchbar"><input class="in" id="pkQ" placeholder="Search images…">
    <label class="btn btn-o btn-sm" style="cursor:pointer">⬆ Upload<input type="file" id="pkUp" accept=".jpg,.jpeg,.png,.webp" multiple hidden></label></div>
    <div class="pk-grid" id="pkGrid"></div>
    <div class="m-actions"><button class="btn btn-o" onclick="closeModal()">Cancel</button></div>`);
  const draw = async (q = '') => {
    const list = await api('/api/admin/media' + (q ? '?q=' + encodeURIComponent(q) : ''));
    $('#pkGrid').innerHTML = list.map(m => `<div class="media-card"><img loading="lazy" src="/${esc(m.filepath)}" alt="">
      <div class="m-body"><span class="m-name">${esc(m.filename)}</span></div>
      <div class="m-actions"><button class="btn btn-p btn-sm" data-pick="${esc(m.filepath)}">Select</button></div></div>`).join('')
      || '<div class="empty">No images found.</div>';
    $('#pkGrid').querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { closeModal(); cb(b.dataset.pick); });
  };
  $('#pkQ').oninput = e => draw(e.target.value);
  $('#pkUp').onchange = async e => {
    const fd = new FormData();
    [...e.target.files].forEach(f => fd.append('images', f));
    const r = await fetch('/api/admin/media/upload', { method: 'POST', body: fd });
    const d = await r.json();
    if (!r.ok) return toast(d.error || 'Upload failed.', 1);
    toast('Uploaded.'); draw($('#pkQ').value);
  };
  draw('');
}
window.closeModal = closeModal;
function imgField(id, label, val) {
  return `<label class="f full">${label}
    <span style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
      <img id="${id}_pv" src="/${esc(val || 'assets/logo.jpg')}" alt="" style="width:120px;height:80px;object-fit:contain;background:#f1f5f9;border:1px solid var(--line);border-radius:10px">
      <input type="hidden" id="${id}" value="${esc(val || '')}">
      <button type="button" class="btn btn-o btn-sm" id="${id}_btn">Choose image…</button>
      <button type="button" class="btn btn-o btn-sm" id="${id}_clr">Clear</button>
    </span></label>`;
}
function wireImgField(id, onPick) {
  document.getElementById(id + '_btn').onclick = () => pickImage(fp => {
    document.getElementById(id).value = fp;
    document.getElementById(id + '_pv').src = '/' + fp;
    onPick && onPick(fp);
  });
  document.getElementById(id + '_clr').onclick = () => {
    document.getElementById(id).value = '';
    document.getElementById(id + '_pv').src = '/assets/logo.jpg';
  };
}

// ---------- sidebar / router ----------
const NAV = [
  ['dashboard', '📊', 'Dashboard'], ['services', '🩺', 'Services'], ['media', '🖼️', 'Images / Media'],
  ['pages', '📄', 'Pages'], ['homepage', '🏠', 'Homepage'], ['about', 'ℹ️', 'About'],
  ['contact', '📞', 'Contact'], ['social', '🔗', 'Social Links'], ['settings', '⚙️', 'Website Settings'],
  ['logs', '📝', 'Activity Log'], ['profile', '👤', 'Admin Profile'],
];
$('#sideNav').innerHTML = `<a href="/" target="_blank" rel="noopener"><span class="ico">👁</span>View Website</a>` + NAV.map(n => `<a href="#/${n[0]}" data-r="${n[0]}"><span class="ico">${n[1]}</span>${n[2]}</a>`).join('')
  + `<a href="#" id="sideLogout"><span class="ico">🚪</span>Logout</a>`;
$('#sideLogout').onclick = async e => { e.preventDefault(); await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/admin/login.html'; };
$('#logoutBtn').onclick = async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/admin/login.html'; };
$('#hamb').onclick = () => { $('#sidebar').classList.add('open'); $('#scrim').classList.add('show'); };
$('#scrim').onclick = () => { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); };
window.addEventListener('resize', () => {
  if (window.innerWidth > 1020) { $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); }
});

const TITLES = Object.fromEntries(NAV.map(n => [n[0], n[2]]));
async function boot() {
  try {
    const r = await fetch('/api/auth/status');
    const d = await r.json();
    if (!d.loggedIn) { location.href = '/admin/login.html'; return; }
    $('#adminName').textContent = d.admin.name;
    $('#avatarTx').textContent = (d.admin.name || 'A')[0].toUpperCase();
  } catch { location.href = '/admin/login.html'; return; }
  route();
}
window.addEventListener('hashchange', route);
function route() {
  const h = (location.hash || '#/dashboard').replace('#/', '').split('/');
  const name = h[0] || 'dashboard';
  $('#pageTitle').textContent = TITLES[name] || name;
  document.querySelectorAll('#sideNav a').forEach(a => a.classList.toggle('active', a.dataset.r === name));
  $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('show');
  (VIEWS[name] || VIEWS.dashboard)(h.slice(1));
}

// ================= VIEWS =================
const VIEWS = {};

// ---------- dashboard ----------
VIEWS.dashboard = async () => {
  loading();
  const d = await api('/api/admin/overview');
  view().innerHTML = `
  <div class="cards">
    <div class="stat"><span class="s-ico">🩺</span><div><b>${d.totalServices}</b><span>Total Services</span></div></div>
    <div class="stat"><span class="s-ico">✅</span><div><b>${d.activeServices}</b><span>Active Services</span></div></div>
    <div class="stat"><span class="s-ico">🖼️</span><div><b>${d.totalImages}</b><span>Total Images</span></div></div>
    <div class="stat"><span class="s-ico">📄</span><div><b>${d.totalPages}</b><span>Total Pages</span></div></div>
  </div>
  <div class="panel"><div class="panel-head"><h2>Quick actions</h2></div>
    <div class="quick-grid">
      <a class="quick" href="#/services/new"><span class="q-ico">➕</span><b>Quick Add Service</b><span>New service with image & details</span></a>
      <a class="quick" href="#/media"><span class="q-ico">🖼️</span><b>Quick Add Image</b><span>Upload to media library</span></a>
      <a class="quick" href="#/homepage"><span class="q-ico">✏️</span><b>Quick Edit Website Content</b><span>Homepage, about & contact</span></a>
      <a class="quick" href="/" target="_blank" rel="noopener"><span class="q-ico">👁</span><b>View Website</b><span>Open public site</span></a>
    </div></div>
  <div class="panel"><div class="panel-head"><h2>Recent updates</h2><a class="btn btn-o btn-sm" href="#/logs">View all →</a></div>
    ${d.recent.map(logRow).join('') || '<div class="empty">No activity yet.</div>'}</div>`;
};
const logRow = l => `<div class="log-item"><span class="badge ${/delet/i.test(l.action) ? 'b-red' : /add|upload|creat/i.test(l.action) ? 'b-green' : 'b-blue'}">${esc(l.action)}</span>
  <span><b>${esc(l.item || '—')}</b> <span style="color:#5f7089">${esc(l.detail || '')} · ${esc(l.admin_email || '')}</span></span>
  <time>${fmtDate(l.created_at)}</time></div>`;

// ---------- services ----------
let svcFilter = { q: '', status: '', trashed: false };
VIEWS.services = async (args) => {
  if (args[0] === 'new' || args[0] === 'edit') return serviceForm(args[1]);
  loading();
  const p = new URLSearchParams({ q: svcFilter.q, status: svcFilter.status });
  if (svcFilter.trashed) p.set('trashed', '1');
  const list = await api('/api/admin/services?' + p);
  view().innerHTML = `
  <div class="panel"><div class="panel-head"><h2>Services ${svcFilter.trashed ? '(Archived)' : ''}</h2>
    <a class="btn btn-p" href="#/services/new">+ Add Service</a>
    <button class="btn btn-o btn-sm" id="trkBtn">${svcFilter.trashed ? '← Back to active' : '🗑 Archived'}</button></div>
    <div class="searchbar"><input class="in" id="sq" placeholder="Search services…" value="${esc(svcFilter.q)}">
    <select class="in" id="ss"><option value="">All statuses</option>
      <option value="active"${svcFilter.status === 'active' ? ' selected' : ''}>Active</option>
      <option value="inactive"${svcFilter.status === 'inactive' ? ' selected' : ''}>Inactive</option></select></div>
    <p class="sub" style="color:#5f7089;font-size:13px;margin:0 0 10px">↕ Drag cards to reorder — order reflects on the public website instantly.</p>
    <div id="svcList">${list.map(svcCard).join('') || '<div class="empty">No services found.</div>'}</div></div>`;
  $('#trkBtn').onclick = () => { svcFilter.trashed = !svcFilter.trashed; route(); };
  $('#sq').oninput = e => { svcFilter.q = e.target.value; clearTimeout(window._sqt); window._sqt = setTimeout(route, 400); };
  $('#ss').onchange = e => { svcFilter.status = e.target.value; route(); };
  wireSvcList(list);
};
const svcCard = s => `<div class="svc-card" draggable="true" data-id="${s.id}">
  <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
  <img class="svc-thumb" loading="lazy" src="/${esc(s.image || 'assets/logo.jpg')}" alt="${esc(s.name)}">
  <div class="svc-main">
    <div class="svc-top"><b>${esc(s.name)}</b><span class="badge ${s.status === 'active' ? 'b-green' : 'b-gray'}">${s.status}</span></div>
    <div class="svc-slug">/${esc(s.slug)}${s.page_file ? ' → ' + esc(s.page_file) : ' → auto page'}</div>
    <p class="svc-desc">${esc((s.short_desc || '').slice(0, 140))}</p>
    <div class="svc-actions">
    <button class="btn btn-o btn-sm" data-act="preview">Preview</button>
    ${svcFilter.trashed
      ? `<button class="btn btn-p btn-sm" data-act="restore">Restore</button><button class="btn btn-danger btn-sm" data-act="purge">Delete forever</button>`
      : `<a class="btn btn-o btn-sm" href="#/services/edit/${s.id}">Edit</a>
         <button class="btn btn-o btn-sm" data-act="toggle">${s.status === 'active' ? 'Deactivate' : 'Activate'}</button>
         <button class="btn btn-o btn-sm" data-act="dup">Duplicate</button>
         <button class="btn btn-danger btn-sm" data-act="del">Delete</button>`}
  </div></div></div>`;
function wireSvcList(list) {
  const box = $('#svcList');
  box.querySelectorAll('[data-act]').forEach(b => b.onclick = async () => {
    const id = b.closest('.svc-card').dataset.id;
    const act = b.dataset.act;
    try {
      if (act === 'preview') {
        const s = list.find(x => x.id == id);
        window.open(s.page_file ? '/' + s.page_file : '/service-detail.html?slug=' + s.slug, '_blank');
      } else if (act === 'toggle') { await api(`/api/admin/services/${id}/toggle`, { method: 'POST' }); toast('Status updated.'); route(); }
      else if (act === 'dup') { await api(`/api/admin/services/${id}/duplicate`, { method: 'POST' }); toast('Duplicated as inactive.'); route(); }
      else if (act === 'del') {
        if (await confirmDlg('Delete service?', 'Are you sure you want to delete this item? It will be archived and hidden from the website. You can restore it later.')) {
          await api(`/api/admin/services/${id}`, { method: 'DELETE' }); toast('Service archived.'); route();
        }
      } else if (act === 'restore') { await api(`/api/admin/services/${id}/restore`, { method: 'POST' }); toast('Service restored.'); route(); }
      else if (act === 'purge') {
        if (await confirmDlg('Delete forever?', 'Are you sure you want to delete this item? This cannot be undone.', 'Delete forever')) {
          await api(`/api/admin/services/${id}/permanent`, { method: 'DELETE' }); toast('Permanently deleted.'); route();
        }
      }
    } catch (e) { toast(e.message, 1); }
  });
  // drag & drop reorder
  let dragEl = null;
  box.querySelectorAll('.svc-card').forEach(el => {
    el.addEventListener('dragstart', () => { dragEl = el; setTimeout(() => el.classList.add('dragging')); });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', async e => {
      e.preventDefault();
      if (!dragEl || dragEl === el) return;
      const items = [...box.querySelectorAll('.svc-card')];
      const di = items.indexOf(dragEl), ti = items.indexOf(el);
      if (di < ti) el.after(dragEl); else el.before(dragEl);
      const ids = [...box.querySelectorAll('.svc-card')].map(x => +x.dataset.id);
      try { await api('/api/admin/services/reorder', { method: 'POST', body: JSON.stringify({ ids }) }); toast('Order saved.'); }
      catch (ex) { toast(ex.message, 1); }
    });
  });
}
function dynList(id, label, items) {
  return `<label class="f full">${label}<span id="${id}_box" style="display:grid;gap:8px;font-weight:400">
    ${(items || []).map(t => `<span style="display:flex;gap:8px"><input class="in" value="${esc(t)}"><button type="button" class="btn btn-danger btn-sm" data-rm>✕</button></span>`).join('')}
    </span><button type="button" class="btn btn-o btn-sm" id="${id}_add" style="margin-top:8px;justify-self:start">+ Add</button></label>`;
}
function wireDynList(id) {
  const box = document.getElementById(id + '_box');
  box.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => b.parentElement.remove());
  document.getElementById(id + '_add').onclick = () => {
    const s = document.createElement('span');
    s.style.cssText = 'display:flex;gap:8px';
    s.innerHTML = `<input class="in" placeholder="New item…"><button type="button" class="btn btn-danger btn-sm">✕</button>`;
    s.querySelector('button').onclick = () => s.remove();
    box.appendChild(s);
  };
}
const dynVals = id => [...document.querySelectorAll(`#${id}_box input`)].map(i => i.value.trim()).filter(Boolean);
async function serviceForm(id) {
  loading();
  let s = { name: '', icon: '🏥', short_desc: '', detail_desc: '', benefits: [], features: [], image: '', status: 'active', page_file: '' };
  if (id) { const l = await api('/api/admin/services'); s = l.find(x => x.id == id) || s; }
  view().innerHTML = `<div class="panel"><div class="panel-head"><h2>${id ? 'Edit' : 'Add'} Service</h2></div>
  <div class="form-grid">
    <label class="f">Service Name*<input class="in" id="f_name" autocomplete="off" value="${esc(s.name)}" placeholder="e.g. Home Nursing Care"></label>
    <label class="f">Icon (emoji)<input class="in" id="f_icon" value="${esc(s.icon)}"></label>
    <label class="f full">Short Description<textarea class="in" id="f_short" rows="2">${esc(s.short_desc)}</textarea></label>
    <label class="f full">Detailed Description (rich text)</label>
  </div>
  ${rteHTML('f_detail', s.detail_desc || '')}
  <div class="form-grid" style="margin-top:14px">
    ${dynList('f_ben', 'Benefits', s.benefits)}
    ${dynList('f_fea', 'Features', s.features)}
    ${imgField('f_img', 'Service Image', s.image)}
    <label class="f">Status<select class="in" id="f_status"><option value="active"${s.status === 'active' ? ' selected' : ''}>Active</option><option value="inactive"${s.status === 'inactive' ? ' selected' : ''}>Inactive</option></select></label>
    <label class="f">Linked Page File (optional)<input class="in" id="f_page" value="${esc(s.page_file || '')}" placeholder="nursing.html or empty for auto page"></label>
  </div>
  <div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap">
    <button class="btn btn-p" id="svGo">Save</button>
    <button class="btn btn-o" id="svPv">Preview</button>
    <button class="btn btn-o" id="svNo">Cancel</button>
  </div></div>`;
  wireDynList('f_ben'); wireDynList('f_fea'); wireImgField('f_img');
  const collect = () => ({
    name: $('#f_name').value.trim(), icon: $('#f_icon').value.trim() || '🏥',
    short_desc: $('#f_short').value.trim(), detail_desc: getRTE('f_detail'),
    benefits: dynVals('f_ben'), features: dynVals('f_fea'),
    image: $('#f_img').value, status: $('#f_status').value, page_file: $('#f_page').value.trim() || null
  });
  $('#svNo').onclick = () => location.hash = '#/services';
  $('#svPv').onclick = () => {
    const pg = $('#f_page').value.trim();
    window.open(pg ? '/' + pg : '/services.html', '_blank');
    toast('Tip: press Save first to preview your latest edits.');
  };
  $('#svGo').onclick = async () => {
    try {
      if (id) await api('/api/admin/services/' + id, { method: 'PUT', body: JSON.stringify(collect()) });
      else await api('/api/admin/services', { method: 'POST', body: JSON.stringify(collect()) });
      toast('Service saved — live on the website.');
      location.hash = '#/services';
    } catch (e) { toast(e.message, 1); }
  };
}

// ---------- media ----------
let medQ = '', medUsage = '';
VIEWS.media = async () => {
  loading();
  const p = new URLSearchParams({ q: medQ }); if (medUsage) p.set('usage', medUsage);
  const list = await api('/api/admin/media?' + p);
  view().innerHTML = `<div class="panel"><div class="panel-head"><h2>Media Library</h2>
    <label class="btn btn-p" style="cursor:pointer">⬆ Upload Images<input type="file" id="upIn" accept=".jpg,.jpeg,.png,.webp" multiple hidden></label></div>
    <div class="searchbar"><input class="in" id="mq" placeholder="Search by filename…" value="${esc(medQ)}">
    <select class="in" id="mu"><option value="">All usages</option>${['logo', 'homepage', 'nursing', 'nurse', 'medical', 'pathologist', 'compounder', 'physiotherapy', 'ambulance'].map(u => `<option${medUsage === u ? ' selected' : ''}>${u}</option>`).join('')}</select></div>
    <p class="sub" style="color:#5f7089;font-size:13px;margin:0 0 10px">↕ Drag cards to reorder · JPG / PNG / WEBP · max 5MB each.</p>
    <div class="media-grid" id="medGrid">${list.map(m => `
      <div class="media-card" draggable="true" data-id="${m.id}">
        <img loading="lazy" src="/${esc(m.filepath)}" alt="">
        <div class="m-body"><span class="m-name">${esc(m.filename)}</span>
        <span class="m-meta">${fmtSize(m.size)} · ${fmtDate(m.created_at)}</span>
        <span class="m-meta">Used in: ${m.usedIn.length ? esc(m.usedIn.join('; ')) : '—'}</span></div>
        <div class="m-actions"><button class="btn btn-o btn-sm" data-m="open">Manage</button>
        <button class="btn btn-danger btn-sm" data-m="del">Delete</button></div></div>`).join('') || '<div class="empty">No images yet — upload your first one.</div>'}</div></div>`;
  $('#mq').oninput = e => { medQ = e.target.value; clearTimeout(window._mq); window._mq = setTimeout(route, 400); };
  $('#mu').onchange = e => { medUsage = e.target.value; route(); };
  $('#upIn').onchange = async e => {
    const fd = new FormData();
    [...e.target.files].forEach(f => fd.append('images', f));
    const r = await fetch('/api/admin/media/upload', { method: 'POST', body: fd });
    const d = await r.json();
    if (!r.ok) return toast(d.error || 'Upload failed.', 1);
    toast('Image(s) uploaded.'); route();
  };
  const grid = $('#medGrid');
  grid.querySelectorAll('[data-m]').forEach(b => b.onclick = async () => {
    const id = b.closest('.media-card').dataset.id;
    if (b.dataset.m === 'open') return mediaModal(id);
    const u = await api(`/api/admin/media/${id}/usage`);
    const warn = u.usedIn.length ? ` Warning: currently used in — ${u.usedIn.join('; ')}.` : '';
    if (await confirmDlg('Delete image?', `Are you sure you want to delete this item?${warn}`)) {
      try { await api(`/api/admin/media/${id}`, { method: 'DELETE' }); toast('Image deleted.'); route(); }
      catch (e) {
        if (await confirmDlg('Still delete?', `This image is used in: ${(e.usedIn || u.usedIn || []).join('; ')}. Delete anyway?`)) {
          await api(`/api/admin/media/${id}?force=1`, { method: 'DELETE' }); toast('Image force-deleted.'); route();
        }
      }
    }
  });
  let dragEl = null;
  grid.querySelectorAll('.media-card').forEach(el => {
    el.addEventListener('dragstart', () => { dragEl = el; setTimeout(() => el.classList.add('dragging')); });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', async e => {
      e.preventDefault();
      if (!dragEl || dragEl === el) return;
      const items = [...grid.querySelectorAll('.media-card')];
      if (items.indexOf(dragEl) < items.indexOf(el)) el.after(dragEl); else el.before(dragEl);
      const ids = [...grid.querySelectorAll('.media-card')].map(x => +x.dataset.id);
      try { await api('/api/admin/media/reorder', { method: 'POST', body: JSON.stringify({ ids }) }); toast('Order saved.'); }
      catch (ex) { toast(ex.message, 1); }
    });
  });
};
async function mediaModal(id) {
  const list = await api('/api/admin/media');
  const m = list.find(x => x.id == id);
  if (!m) return;
  modal(`<h3>Manage image</h3>
    <img src="/${esc(m.filepath)}" alt="" style="width:100%;max-height:260px;object-fit:contain;background:#f1f5f9;border-radius:12px;border:1px solid var(--line)">
    <div class="form-grid" style="margin-top:12px;grid-template-columns:1fr">
    <label class="f">File name<input class="in" value="${esc(m.filename)}" disabled></label>
    <label class="f">Upload date<input class="in" value="${fmtDate(m.created_at)} · ${fmtSize(m.size)}" disabled></label>
    <label class="f">Used in<input class="in" value="${esc(m.usedIn.join('; ') || 'Not used anywhere')}" disabled></label>
    <label class="f">Usage tags (comma separated)<input class="in" id="mmTags" value="${esc(m.usage_tags || '')}" placeholder="homepage, gallery"></label>
    <label class="f">Replace image<input type="file" id="mmFile" accept=".jpg,.jpeg,.png,.webp"></label></div>
    <div class="m-actions"><button class="btn btn-o" onclick="closeModal()">Close</button>
    <button class="btn btn-p" id="mmSave">Save tags</button></div>`);
  $('#mmSave').onclick = async () => {
    try {
      if ($('#mmFile').files.length) {
        const fd = new FormData(); fd.append('image', $('#mmFile').files[0]);
        const r = await fetch(`/api/admin/media/${id}/replace`, { method: 'POST', body: fd });
        const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Replace failed.');
        toast('Image replaced — website updated.');
      }
      await api(`/api/admin/media/${id}`, { method: 'PUT', body: JSON.stringify({ usage_tags: $('#mmTags').value }) });
      toast('Saved.'); closeModal(); route();
    } catch (e) { toast(e.message, 1); }
  };
}

// ---------- pages + seo ----------
VIEWS.pages = async () => {
  loading();
  const list = await api('/api/admin/pages');
  view().innerHTML = `<div class="panel"><div class="panel-head"><h2>Pages & SEO</h2></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Page</th><th>Slug</th><th>SEO Title</th><th>Status</th><th>Actions</th></tr></thead><tbody>
  ${list.map(p => `<tr><td><b>${esc(p.title)}</b></td><td>/${esc(p.slug)}${p.slug === 'index' ? '' : '.html'}</td>
    <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.seo_title)}</td>
    <td><span class="badge ${p.status === 'active' ? 'b-green' : 'b-gray'}">${esc(p.status)}</span></td>
    <td><div class="row-actions"><button class="btn btn-o btn-sm" data-p="${esc(p.slug)}">Edit SEO</button>
    <a class="btn btn-o btn-sm" href="/${p.slug === 'index' ? '' : esc(p.slug) + '.html'}" target="_blank" rel="noopener">Preview</a></div></td></tr>`).join('')}
  </tbody></table></div></div>`;
  view().querySelectorAll('[data-p]').forEach(b => b.onclick = () => pageForm(b.dataset.p));
};
async function pageForm(slug) {
  const list = await api('/api/admin/pages');
  const p = list.find(x => x.slug === slug);
  modal(`<h3>SEO — ${esc(p.title)}</h3><div class="form-grid" style="grid-template-columns:1fr">
    <label class="f">Page title<input class="in" id="pg_title" value="${esc(p.title)}"></label>
    <label class="f">Page slug<input class="in" value="/${esc(p.slug)}" disabled></label>
    <label class="f">SEO title<input class="in" id="pg_seo" value="${esc(p.seo_title)}"></label>
    <label class="f">Meta description<textarea class="in" id="pg_desc" rows="2">${esc(p.seo_desc)}</textarea></label>
    <label class="f">Keywords<input class="in" id="pg_kw" value="${esc(p.keywords)}"></label>
    <label class="f">OG title<input class="in" id="pg_ogt" value="${esc(p.og_title)}"></label>
    <label class="f">OG description<textarea class="in" id="pg_ogd" rows="2">${esc(p.og_desc)}</textarea></label></div>
    <div class="m-actions"><button class="btn btn-o" onclick="closeModal()">Cancel</button>
    <button class="btn btn-p" id="pgSave">Save</button></div>`);
  $('#pgSave').onclick = async () => {
    try {
      await api('/api/admin/pages/' + slug, { method: 'PUT', body: JSON.stringify({
        title: $('#pg_title').value, seo_title: $('#pg_seo').value, seo_desc: $('#pg_desc').value,
        keywords: $('#pg_kw').value, og_title: $('#pg_ogt').value, og_desc: $('#pg_ogd').value }) });
      toast('SEO saved.'); closeModal(); route();
    } catch (e) { toast(e.message, 1); }
  };
}

// ---------- settings-group forms (homepage / about / contact / settings) ----------
async function settingsForm(o) {
  loading();
  const s = await api('/api/admin/settings');
  const F = (k, label, type = 'text', full = false, ph = '') =>
    `<label class="f${full ? ' full' : ''}">${label}${type === 'textarea'
      ? `<textarea class="in" id="st_${k}" rows="3" placeholder="${ph}">${esc(s[k])}</textarea>`
      : `<input class="in" id="st_${k}" value="${esc(s[k])}" placeholder="${ph}">`}</label>`;
  const sec = (t, inner) => `<div class="panel"><div class="panel-head"><h2>${t}</h2></div><div class="form-grid">${inner}</div></div>`;
  let html = '';
  if (o.group === 'homepage') html =
    sec('Hero Section', F('hero_kicker', 'Eyebrow / Kicker') + F('hero_primary_text', 'Primary Button Text') + F('hero_primary_link', 'Primary Button Link') + F('hero_secondary_text', 'Secondary Button Text') + F('hero_sub', 'Hero Subtitle', 'textarea', true) + `<label class="f full">Hero Heading (HTML allowed)</label>` + `<div class="full" style="grid-column:1/-1">${rteHTML('st_hero_title', s.hero_title || '')}</div>` + imgField('st_hero_image', 'Hero Image', s.hero_image)) +
    sec('Services Section', F('services_heading', 'Section Heading', 'text', true) + F('services_sub', 'Section Description', 'textarea', true)) +
    sec('Home About Section', F('home_about_heading', 'Heading', 'text', true) + F('home_about_text', 'Description', 'textarea', true) + imgField('st_home_about_image', 'Section Image', s.home_about_image));
  if (o.group === 'about') html =
    sec('About Page', F('about_kicker', 'Kicker') + F('about_heading', 'Heading', 'text', true) + F('about_sub', 'Subtitle', 'textarea', true) + imgField('st_about_image', 'About Image', s.about_image)) +
    `<div class="panel"><div class="panel-head"><h2>Company Information (rich text)</h2></div>
      <label class="f">Introduction</label>${rteHTML('st_about_intro', s.about_intro || '')}
      <div class="form-grid" style="margin-top:14px"><label class="f">Mission</label></div>${rteHTML('st_about_mission', s.about_mission || '')}
      <div style="height:14px"></div><label class="f">Vision</label>${rteHTML('st_about_vision', s.about_vision || '')}
      <div style="height:14px"></div><label class="f">Why Choose Us</label>${rteHTML('st_about_why', s.about_why || '')}</div>`;
  if (o.group === 'contact') html = sec('Contact Information',
    F('business_name', 'Business Name') + F('phone', 'Phone Number') + F('whatsapp', 'WhatsApp Number (with country code)') +
    F('email', 'Email') + F('address', 'Address', 'text', true) + F('gstin', 'GSTIN') + F('business_hours', 'Business Hours') +
    F('contact_heading', 'Contact Page Heading', 'text', true) + F('contact_sub', 'Contact Page Description', 'textarea', true));
  if (o.group === 'settings') html =
    sec('General', F('business_name', 'Business Name') + F('website_title', 'Website Title') + F('phone', 'Primary Phone') + F('whatsapp', 'WhatsApp Number') + F('email', 'Email') + F('address', 'Address', 'text', true) + F('gstin', 'GSTIN') + F('business_hours', 'Business Hours')) +
    sec('Branding', imgField('st_logo', 'Logo', s.logo) + imgField('st_favicon', 'Favicon', s.favicon)) +
    sec('Footer', F('footer_desc', 'Footer Description', 'textarea', true) + F('footer_copyright', 'Copyright Text', 'text', true));
  view().innerHTML = html + `<div style="display:flex;gap:10px;flex-wrap:wrap">
    <button class="btn btn-p" id="cfSave">Save</button>
    <button class="btn btn-o" id="cfPv">Preview</button>
    <button class="btn btn-o" id="cfNo">Cancel</button></div>`;
  ['st_hero_image', 'st_home_about_image', 'st_about_image', 'st_logo', 'st_favicon'].forEach(id => {
    if (document.getElementById(id)) wireImgField(id);
  });
  const read = () => {
    const o2 = {};
    document.querySelectorAll('[id^="st_"]').forEach(el => {
      if (el.classList.contains('rte')) return;
      if (el.tagName === 'IMG' || el.tagName === 'BUTTON') return;
      o2[el.id.replace('st_', '')] = el.value;
    });
    ['hero_title', 'about_intro', 'about_mission', 'about_vision', 'about_why'].forEach(k => {
      const el = document.getElementById('st_' + k);
      if (el && el.classList.contains('rte')) o2[k] = getRTE('st_' + k);
    });
    return o2;
  };
  $('#cfNo').onclick = () => route();
  $('#cfPv').onclick = () => {
    window.open(o.preview || '/', '_blank');
    toast('Tip: press Save first to preview your latest edits.');
  };
  $('#cfSave').onclick = async () => {
    try { const d = await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify(read()) }); toast(d.changed.length ? `Saved (${d.changed.length} fields) — live on website.` : 'No changes.'); }
    catch (e) { toast(e.message, 1); }
  };
}
VIEWS.homepage = () => settingsForm({ group: 'homepage', preview: '/' });
VIEWS.about = () => settingsForm({ group: 'about', preview: '/about.html' });
VIEWS.contact = () => settingsForm({ group: 'contact', preview: '/contact.html' });
VIEWS.settings = () => settingsForm({ group: 'settings', preview: '/' });

// ---------- social ----------
VIEWS.social = async () => {
  loading();
  const { links, icons } = await api('/api/admin/social');
  const ICONS = {
    facebook: '<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>'
  };
  const socStyle = document.getElementById('socAdminStyle') || (() => {
    const st = document.createElement('style');
    st.id = 'socAdminStyle';
    st.textContent = '.a-soc{display:flex;gap:10px;align-items:center}.a-soc i{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex:none}.a-soc i svg{width:20px;height:20px;fill:#fff}.a-soc small{color:#5f7089}';
    document.head.appendChild(st); return st;
  })();
  const bg = { facebook: '#1877F2', instagram: 'linear-gradient(45deg,#f09433,#dc2743,#bc1888)', youtube: '#FF0000', x: '#111', linkedin: '#0A66C2', whatsapp: '#1faa55', link: '#0b2f6b' };
  view().innerHTML = `<div class="panel"><div class="panel-head"><h2>Social Links</h2><button class="btn btn-p" id="socAdd">+ Add Platform</button></div>
  <div id="socList">${links.map(l => `<div class="list-item" draggable="true" data-id="${l.id}">
    <span class="drag-handle">⋮⋮</span>
    <span class="a-soc"><i style="background:${bg[l.icon] || bg.link}">${ICONS[l.icon] || ICONS.link}</i>
    <span><b>${esc(l.platform)}</b><br><small>${esc(l.url)}</small></span></span>
    <span style="flex:1"></span><span class="badge ${l.status === 'active' ? 'b-green' : 'b-gray'}">${l.status}</span>
    <div class="row-actions"><button class="btn btn-o btn-sm" data-s="edit">Edit</button>
    <button class="btn btn-o btn-sm" data-s="toggle">${l.status === 'active' ? 'Deactivate' : 'Activate'}</button>
    <button class="btn btn-danger btn-sm" data-s="del">Remove</button></div></div>`).join('') || '<div class="empty">No social links.</div>'}</div></div>`;
  const form = (l = {}) => {
    modal(`<h3>${l.id ? 'Edit' : 'Add'} Social Platform</h3><div class="form-grid" style="grid-template-columns:1fr">
    <label class="f">Platform*<input class="in" id="sc_pf" value="${esc(l.platform || '')}" placeholder="Facebook"></label>
    <label class="f">URL*<input class="in" id="sc_url" value="${esc(l.url || '')}" placeholder="https://…"></label>
    <label class="f">Icon<select class="in" id="sc_ic">${icons.map(i => `<option${l.icon === i ? ' selected' : ''}>${i}</option>`).join('')}</select></label></div>
    <div class="m-actions"><button class="btn btn-o" onclick="closeModal()">Cancel</button><button class="btn btn-p" id="scSave">Save</button></div>`);
    $('#scSave').onclick = async () => {
      try {
        const body = JSON.stringify({ platform: $('#sc_pf').value, url: $('#sc_url').value, icon: $('#sc_ic').value });
        if (l.id) await api('/api/admin/social/' + l.id, { method: 'PUT', body });
        else await api('/api/admin/social', { method: 'POST', body });
        toast('Social link saved — live in footer.'); closeModal(); route();
      } catch (e) { toast(e.message, 1); }
    };
  };
  $('#socAdd').onclick = () => form();
  view().querySelectorAll('[data-s]').forEach(b => b.onclick = async () => {
    const id = b.closest('.list-item').dataset.id;
    const l = links.find(x => x.id == id);
    try {
      if (b.dataset.s === 'edit') form(l);
      else if (b.dataset.s === 'toggle') { await api(`/api/admin/social/${id}/toggle`, { method: 'POST' }); toast('Updated.'); route(); }
      else if (await confirmDlg('Remove platform?', `Are you sure you want to delete this item? (${l.platform})`)) {
        await api(`/api/admin/social/${id}`, { method: 'DELETE' }); toast('Removed.'); route();
      }
    } catch (e) { toast(e.message, 1); }
  });
  let dragEl = null;
  view().querySelectorAll('#socList .list-item').forEach(el => {
    el.addEventListener('dragstart', () => { dragEl = el; setTimeout(() => el.classList.add('dragging')); });
    el.addEventListener('dragend', () => el.classList.remove('dragging'));
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', async e => {
      e.preventDefault();
      if (!dragEl || dragEl === el) return;
      const items = [...document.querySelectorAll('#socList .list-item')];
      if (items.indexOf(dragEl) < items.indexOf(el)) el.after(dragEl); else el.before(dragEl);
      const ids = [...document.querySelectorAll('#socList .list-item')].map(x => +x.dataset.id);
      try { await api('/api/admin/social/reorder', { method: 'POST', body: JSON.stringify({ ids }) }); toast('Order saved.'); }
      catch (ex) { toast(ex.message, 1); }
    });
  });
};

// ---------- profile ----------
VIEWS.profile = async () => {
  loading();
  const { admin } = await api('/api/admin/profile');
  view().innerHTML = `<div class="grid2">
  <div class="panel"><div class="panel-head"><h2>Admin Profile</h2></div><div class="form-grid" style="grid-template-columns:1fr">
    <label class="f">Name<input class="in" id="pf_name" value="${esc(admin.name)}"></label>
    <label class="f">Email<input class="in" id="pf_email" value="${esc(admin.email)}"></label>
    <div><button class="btn btn-p" id="pfSave">Save Profile</button></div></div></div>
  <div class="panel"><div class="panel-head"><h2>Change Password</h2></div><div class="form-grid" style="grid-template-columns:1fr">
    <label class="f">Current Password<input class="in" id="pw_cur" type="password"></label>
    <label class="f">New Password (min 6 chars)<input class="in" id="pw_new" type="password"></label>
    <div><button class="btn btn-d" id="pwSave">Update Password</button></div></div></div></div>`;
  $('#pfSave').onclick = async () => {
    try { await api('/api/admin/profile', { method: 'PUT', body: JSON.stringify({ name: $('#pf_name').value, email: $('#pf_email').value }) }); toast('Profile updated.'); boot(); }
    catch (e) { toast(e.message, 1); }
  };
  $('#pwSave').onclick = async () => {
    try { await api('/api/admin/profile/password', { method: 'PUT', body: JSON.stringify({ current: $('#pw_cur').value, next: $('#pw_new').value }) }); toast('Password changed.'); $('#pw_cur').value = $('#pw_new').value = ''; }
    catch (e) { toast(e.message, 1); }
  };
};

// ---------- logs ----------
VIEWS.logs = async () => {
  loading();
  const list = await api('/api/admin/logs?limit=100');
  view().innerHTML = `<div class="panel"><div class="panel-head"><h2>Activity Log</h2><span class="badge b-blue">${list.length} entries</span></div>
  ${list.map(logRow).join('') || '<div class="empty">No activity yet.</div>'}</div>`;
};

boot();
