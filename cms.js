// GO CARE DRUG — public CMS connector. Progressive enhancement:
// static content stays as-is; when the CMS API is reachable, dynamic
// regions (services, homepage, contact info, social, footer, SEO) update live.
(function () {
  const DEF = {
    phone: '7759993511', whatsapp: '917759993511',
    address: 'BHOOTHNATH SANIDEV MANDIR', gstin: '10EBMPK5700GZ1Z'
  };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];

  const ICONS = {
    facebook: { bg: '#1877F2', svg: '<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' },
    instagram: { bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', svg: '<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>' },
    youtube: { bg: '#FF0000', svg: '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>' },
    x: { bg: '#111', svg: '<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>' },
    linkedin: { bg: '#0A66C2', svg: '<svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>' },
    whatsapp: { bg: '#1faa55', svg: '<svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>' },
    link: { bg: '#0b2f6b', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>' }
  };

  function svcLink(s) { return s.page_file ? '/' + s.page_file : '/service-detail.html?slug=' + encodeURIComponent(s.slug); }

  // Decode HTML entities (handles legacy double/triple-encoded CMS data).
  // Plain "&" without a valid entity is left untouched.
  const __dec = document.createElement('textarea');
  function decodeEntities(str) {
    if (typeof str !== 'string' || !/&(#\d+|#[xX][0-9a-fA-F]+|[a-zA-Z]+);/.test(str)) return str;
    let prev = '', cur = str, n = 0;
    while (cur !== prev && n < 6) { prev = cur; __dec.innerHTML = cur; cur = __dec.value; n++; }
    return cur;
  }
  function asHTML(str) { return decodeEntities(str); }

  function renderGrid(box, services) {
    box.innerHTML = services.map(s => `
      <article class="card reveal in"><div class="card-media"><img loading="lazy" src="/${s.image || 'assets/logo.jpg'}" alt="${s.name.replace(/"/g, '')} — GO CARE DRUG"></div>
      <div class="card-body"><div class="card-icon">${s.icon || '🏥'}</div><h3>${s.name}</h3><p>${s.short_desc || ''}</p>
      <a class="btn btn-outline" href="${svcLink(s)}">Learn More →</a></div></article>`).join('');
  }

  function swapText(oldV, newV) {
    if (!oldV || !newV || oldV === newV) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => { if (n.nodeValue.includes(oldV)) n.nodeValue = n.nodeValue.split(oldV).join(newV); });
  }

  async function init() {
    let data;
    try {
      const r = await fetch('/api/public/site', { headers: { 'Accept': 'application/json' } });
      if (!r.ok) return;
      data = await r.json();
    } catch { return; }
    const st = data.settings || {};

    // ---- services grids ----
    $$('[data-services-grid]').forEach(box => { if (data.services && data.services.length) renderGrid(box, data.services); });

    // ---- static service detail pages (match by page_file) ----
    const file = (location.pathname.split('/').pop() || 'index.html');
    const svc = (data.services || []).find(s => s.page_file === file);
    const fields = $$('[data-service-field]');
    if (svc && fields.length) {
      fields.forEach(el => {
        const f = el.dataset.serviceField;
        if (f === 'name') el.textContent = svc.name + (el.dataset.suffix || '');
        else if (f === 'intro') el.innerHTML = asHTML(svc.detail_desc);
        else if (f === 'cta') { el.textContent = 'Request ' + svc.name; el.href = '/contact.html?service=' + encodeURIComponent(svc.name); }
        else if (f === 'image') { el.src = '/' + (svc.image || 'assets/logo.jpg'); el.alt = svc.name + ' — GO CARE DRUG'; }
        else if (f === 'benefits' && Array.isArray(svc.benefits)) el.innerHTML = svc.benefits.map(b => `<li>${b}</li>`).join('');
      });
    }

    // ---- dynamic service-detail.html ----
    if (file === 'service-detail.html') {
      const slug = new URLSearchParams(location.search).get('slug');
      const d = (data.services || []).find(s => s.slug === slug);
      const box = $('#detailBox');
      if (box) {
        if (!d) box.innerHTML = '<div class="empty">Service not found or no longer available. <a href="/services.html">View all services</a></div>';
        else {
          document.title = d.name + ' | GO CARE DRUG';
          box.innerHTML = `
          <section class="section"><div class="wrap split">
            <div class="poster"><img src="/${d.image || 'assets/logo.jpg'}" alt="${d.name} — GO CARE DRUG"></div>
            <div><p class="eyebrow">GO CARE DRUG · HOME SERVICE</p><h2 style="margin-top:0">${d.name} — At Home</h2>
            <p>${asHTML(d.detail_desc || d.short_desc || '')}</p>
            ${(d.benefits && d.benefits.length) ? `<ul class="ticks">${d.benefits.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
            ${(d.features && d.features.length) ? `<ul class="ticks">${d.features.map(b => `<li>${b}</li>`).join('')}</ul>` : ''}
            <div class="cta-btns"><a class="btn btn-primary" href="/contact.html?service=${encodeURIComponent(d.name)}">Request ${d.name}</a>
            <a class="btn btn-dark" href="tel:+91${st.phone || DEF.phone}">Call: ${st.phone || DEF.phone}</a></div></div>
          </div></section>`;
        }
      }
    }
    // ---- generic [data-cms] fields ----
    $$('[data-cms]').forEach(el => {
      const k = el.dataset.cms;
      if (!(k in st) || st[k] === '') return;
      const val = asHTML(st[k]);
      if (k === 'logo' && el.tagName === 'IMG') { el.src = '/' + st[k]; return; }
      if (k === 'favicon') return;
      if (k.endsWith('_link') && el.tagName === 'A') { el.href = st[k]; return; }
      if (k.endsWith('_image') && el.tagName === 'IMG') { el.src = '/' + st[k]; return; }
      if (/title|heading|kicker|sub|text|desc|copyright|name|hours|address|gstin|email/.test(k)) {
        if (/<[a-z][\s\S]*>/i.test(val)) el.innerHTML = val; else el.textContent = val;
      }
    });

    // ---- [data-cms-link] anchors (button URLs etc.) ----
    $$('[data-cms-link]').forEach(el => {
      const k = el.dataset.cmsLink;
      if (k && st[k]) el.href = st[k];
    });

    // ---- contact info everywhere (exact-string swap, zero markup changes) ----
    swapText(DEF.phone, st.phone || DEF.phone);
    swapText(DEF.address, st.address || DEF.address);
    swapText(DEF.gstin, st.gstin || DEF.gstin);
    $$('a[href^="tel:"]').forEach(a => { a.href = 'tel:+91' + (st.phone || DEF.phone); });
    $$('a[href*="wa.me/"]').forEach(a => { a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + (st.whatsapp || DEF.whatsapp)); });
    const fav = $('link[rel="icon"]');
    if (fav && st.favicon) fav.href = '/' + st.favicon;

    // ---- footer social (match existing buttons, hide inactive, add new) ----
    const row = $('.social-row');
    if (row && Array.isArray(data.social)) {
      const known = { facebook: 'soc-fb', instagram: 'soc-ig', youtube: 'soc-yt' };
      const seen = new Set();
      data.social.forEach(s => {
        const key = (s.platform || '').toLowerCase();
        const cls = known[key] || null;
        let a = cls ? row.querySelector('.' + cls) : [...row.querySelectorAll('a')].find(x => x.href === s.url);
        if (!a) {
          const ic = ICONS[s.icon] || ICONS.link;
          a = document.createElement('a');
          a.className = 'soc-btn';
          a.style.background = ic.bg;
          a.innerHTML = ic.svg;
          const style = document.createElement('style');
          style.textContent = '.social-row .soc-btn svg{width:22px;height:22px;fill:#fff;display:block}';
          if (!$('#socDynStyle')) { style.id = 'socDynStyle'; document.head.appendChild(style); }
          row.appendChild(a);
        }
        a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
        a.setAttribute('aria-label', 'GO CARE DRUG on ' + s.platform);
        seen.add(a);
      });
      // hide originals that CMS deactivated (only those that existed statically)
      Object.values(known).forEach(c => {
        const a = row.querySelector('.' + c);
        if (a && !seen.has(a)) a.style.display = 'none';
      });
    }

    // ---- SEO per page ----
    const slug = file === '' || file === 'index.html' ? 'index' : file.replace('.html', '');
    const pg = (data.pages || {})[slug];
    if (pg) {
      if (pg.seo_title) document.title = pg.seo_title;
      const md = document.querySelector('meta[name="description"]');
      if (md && pg.seo_desc) md.content = pg.seo_desc;
      const ogt = document.querySelector('meta[property="og:title"]');
      if (ogt && (pg.og_title || pg.seo_title)) ogt.content = pg.og_title || pg.seo_title;
      const ogd = document.querySelector('meta[property="og:description"]');
      if (ogd && (pg.og_desc || pg.seo_desc)) ogd.content = pg.og_desc || pg.seo_desc;
    }

    // ---- optional contact extras (only if admin sets them) ----
    if ((slug === 'contact') && (st.email || st.business_hours)) {
      const grid = $('.grid.grid-3');
      if (grid && !$('#cmsExtra') && (st.email || st.business_hours)) {
        const d = document.createElement('div');
        d.id = 'cmsExtra'; d.className = 'note'; d.style.marginTop = '18px';
        d.innerHTML = `${st.email ? '✉️ Email: <b>' + st.email + '</b>' : ''}${st.email && st.business_hours ? ' &nbsp;·&nbsp; ' : ''}${st.business_hours ? '🕒 Hours: <b>' + st.business_hours + '</b>' : ''}`;
        grid.after(d);
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
