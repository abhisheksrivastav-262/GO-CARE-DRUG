#!/usr/bin/env python3
"""Build GO CARE DRUG multi-page static site. Only uses local assets/ images."""
import os
BASE = "/Users/abhisheksrivastav/Documents/GO CARE DRUG"
PHONE = "7759993511"
PHONE_TEL = "+917759993511"
PHONE_WA = "917759993511"
ADDRESS = "BHOOTHNATH SANIDEV MANDIR"
WA_LINK = f"https://wa.me/{PHONE_WA}?text="

LOGO_SVG = """<a class="brand" href="index.html" aria-label="GO CARE DRUG home">
<img class="brand-logo" src="assets/logo.jpg" alt="GO CARE DRUG official logo" fetchpriority="high">
<span class="brand-text"><strong>GO CARE DRUG</strong><small>CARE&nbsp;|&nbsp;HEALTH&nbsp;|&nbsp;TRUST</small></span></a>"""

NAV = [
 ("index.html","Home"),("about.html","About"),("services.html","Services"),
 ("nursing.html","Nursing"),("medical.html","Medical"),("pathologist.html","Pathologist"),
 ("physiotherapy.html","Physiotherapy"),("ambulance.html","Ambulance"),
 ("medicine.html","Medicine"),("contact.html","Contact"),
]
MORE_NAV = [("compounder.html","Compounder"),("nurse.html","Nurse")]

def header(active):
    links=[]
    for href,label in NAV:
        cls=" active" if href==active else ""
        links.append(f'<a class="nav-link{cls}" href="{href}">{label}</a>')
    more="".join(f'<a href="{h}">{l}</a>' for h,l in MORE_NAV)
    return f"""<div class="topbar"><div class="wrap topbar-in"><span>Trusted Home Healthcare Services</span><span class="topbar-right"><span>{ADDRESS}</span></span></div></div>
<header class="header" id="siteHeader"><div class="wrap header-in">{LOGO_SVG}
<nav class="nav" aria-label="Primary">{"".join(links)}<div class="nav-more"><button class="nav-more-btn" aria-haspopup="true">More ▾</button><div class="nav-more-menu">{more}</div></div></nav>
<div class="header-cta">
<button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button></div></div></header>
<div class="mobile-menu" id="mobileMenu"><div class="mobile-menu-head">{LOGO_SVG}<button id="mobileClose" aria-label="Close menu">✕</button></div>
<nav aria-label="Mobile">{"".join(f'<a class="{("active" if h==active else "")}" href="{h}">{l}</a>' for h,l in NAV+MORE_NAV)}</nav>
<a class="btn btn-wa big" href="https://wa.me/{PHONE_WA}?text=Hello%20GO%20CARE%20DRUG%2C%20I%20need%20healthcare%20assistance." target="_blank" rel="noopener">WhatsApp Us</a></div>
<div class="scrim" id="scrim"></div>"""

def footer():
    return f"""<footer class="footer"><div class="wrap footer-grid">
<div class="f-brand">{LOGO_SVG}<p>GO CARE DRUG<br><span>CARE | HEALTH | TRUST</span></p><p class="f-desc">Dependable home medical and healthcare support designed around comfort, convenience and professional care.</p>
<div class="f-actions"><a class="btn btn-call" href="tel:{PHONE_TEL}">Call Now</a><a class="btn btn-wa" href="https://wa.me/{PHONE_WA}?text=Hello%20GO%20CARE%20DRUG%2C%20I%20need%20healthcare%20assistance." target="_blank" rel="noopener">WhatsApp</a></div></div>
<div><h4>Quick Links</h4><ul><li><a href="index.html">Home</a></li><li><a href="about.html">About</a></li><li><a href="services.html">Services</a></li><li><a href="contact.html">Contact</a></li></ul></div>
<div><h4>Services</h4><ul><li><a href="nursing.html">Nursing Services</a></li><li><a href="medical.html">Medical Services</a></li><li><a href="pathologist.html">Pathologist Services</a></li><li><a href="compounder.html">Compounder Services</a></li><li><a href="physiotherapy.html">Physiotherapy Services</a></li><li><a href="nurse.html">Nurse Services</a></li><li><a href="ambulance.html">Ambulance Services</a></li><li><a href="medicine.html">Medicine Services</a></li></ul></div>
<div><h4>Contact</h4><ul class="f-contact"><li><a href="tel:{PHONE_TEL}">{PHONE}</a></li><li>{ADDRESS}</li><li><a href="https://wa.me/{PHONE_WA}?text=Hello%20GO%20CARE%20DRUG%2C%20I%20need%20healthcare%20assistance." target="_blank" rel="noopener">WhatsApp: {PHONE}</a></li></ul></div>
</div><div class="f-bottom"><div class="wrap">© GO CARE DRUG. All Rights Reserved.</div></div></footer>
<div class="float-btns"><a class="float-call" href="tel:{PHONE_TEL}" aria-label="Call GO CARE DRUG">📞<span>Call</span></a><a class="float-wa" href="https://wa.me/{PHONE_WA}?text=Hello%20GO%20CARE%20DRUG%2C%20I%20need%20healthcare%20assistance." target="_blank" rel="noopener" aria-label="WhatsApp GO CARE DRUG"><svg viewBox="0 0 32 32" width="26" height="26" fill="#fff"><path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 2 6.5L4 29l7.7-2c1.8 1 3.9 1.5 6 1.5h.3c6.6 0 12-5.4 12-12S22.6 3 16 3zm0 22.2c-1.9 0-3.7-.5-5.3-1.5l-.4-.2-4.5 1.2 1.2-4.4-.3-.4c-1.1-1.7-1.7-3.7-1.7-5.8C5 9.4 9.9 5 16 5s11 4.9 11 11-4.9 9.2-11 9.2zm6-6.9c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1.1-1 1.3-.2.2-.4.3-.7.1-.3-.2-1.4-.5-2.6-1.6-.9-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6L13.3 9c-.2-.4-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1.1 2.7c.1.2 1.9 2.9 4.5 4 .6.3 1.1.4 1.5.6.6.2 1.2.2 1.6.1.5-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.2-.6-.4z"/></svg><span>WhatsApp</span></a></div>"""

def page(filename,title,desc,body,hero_kicker="",hero_title="",hero_sub=""):
    hero=""
    if hero_title:
        hero=f"""<section class="page-hero"><div class="wrap"><p class="eyebrow">{hero_kicker}</p><h1>{hero_title}</h1>{f'<p class="lead">{hero_sub}</p>' if hero_sub else ''}</div></section>"""
    html=f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} | GO CARE DRUG</title><meta name="description" content="{desc}">
<meta property="og:title" content="{title} | GO CARE DRUG"><meta property="og:description" content="{desc}"><meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css"><link rel="icon" href="assets/nursing-welcome.jpg"></head>
<body>{header(filename)}<main>{hero}{body}</main>{footer()}<script src="script.js"></script></body></html>"""
    open(os.path.join(BASE,filename),"w").write(html)

SERVICE_CARDS = [
 ("nursing.html","Nursing Services","Home nursing support, patient assistance and routine care at home.","assets/nursing-welcome.jpg","Nurse welcoming patients to GO CARE DRUG home healthcare","🩺"),
 ("medical.html","Medical Services","General medical assistance and doctor appointment support from home.","assets/medical.jpg","Doctor appointment assistance poster by GO CARE DRUG","👨‍⚕️"),
 ("pathologist.html","Pathologist Services","Home sample collection support with safe and hygienic handling.","assets/pathology.jpg","Pathology home sample collection poster","🔬"),
 ("compounder.html","Compounder Services","Injections, IV drip support, wound dressing and medicine management assistance.","assets/compounder.jpg","Compounder home care poster","💉"),
 ("physiotherapy.html","Physiotherapy Services","At-home physiotherapy support for mobility, strength and recovery.","assets/physiotherapy.jpg","Physiotherapy at home poster","🦵"),
 ("nurse.html","Nurse Services","Dedicated nurse support for elderly care and day-to-day patient needs.","assets/nursing-welcome.jpg","Nurse in blue uniform holding clipboard","🤝"),
 ("ambulance.html","Ambulance Services","Emergency assistance and patient transfer support with quick contact.","assets/ambulance.jpg","Ambulance service vehicle poster","🚑"),
 ("medicine.html","Medicine Services","Medicine ordering support with safe home delivery assistance.","assets/medicine.jpg","Medicine home delivery poster","💊"),
]

def service_grid():
    cards=[]
    for href,t,d,img,alt,icon in SERVICE_CARDS:
        cards.append(f"""<article class="card reveal"><div class="card-media"><img loading="lazy" src="{img}" alt="{alt}"></div>
<div class="card-body"><div class="card-icon">{icon}</div><h3>{t}</h3><p>{d}</p><a class="btn btn-outline" href="{href}">Learn More →</a></div></article>""")
    return '<div class="grid grid-4">'+"".join(cards)+"</div>"

# ---------- HOME ----------
home_body = f"""<section class="hero"><div class="wrap hero-grid">
<div class="hero-copy"><p class="eyebrow">TRUSTED HOME HEALTHCARE SERVICES</p>
<h1>Professional Healthcare Services,<br><span>Delivered With Care</span></h1>
<p class="lead">GO CARE DRUG provides dependable home medical and healthcare support designed around comfort, convenience and professional care.</p>
<div class="hero-ctas"><a class="btn btn-primary" href="services.html">Book a Service</a><a class="btn btn-dark" href="tel:{PHONE_TEL}">Call {PHONE}</a></div>
<div class="trust-row"><span>✓ Professional Care</span><span>✓ Home Healthcare Support</span><span>✓ Convenient Services</span><span>✓ Trusted Assistance</span></div></div>
<div class="hero-media"><img src="assets/nursing-welcome.jpg" alt="Welcome to GO CARE DRUG home healthcare services in Patna" fetchpriority="high"><p class="media-cap">Original GO CARE DRUG care artwork · {ADDRESS}</p></div>
</div></section>
<section class="strip"><div class="wrap strip-grid"><div><strong>Home Medical & Healthcare Services</strong><span>One contact for nursing, medical, pathology, physiotherapy, ambulance & medicines.</span></div><div class="strip-ctas"><a class="btn btn-primary" href="contact.html">Send Enquiry</a><a class="btn btn-wa" href="https://wa.me/{PHONE_WA}?text=Hello%20GO%20CARE%20DRUG%2C%20I%20want%20to%20book%20a%20service." target="_blank" rel="noopener">WhatsApp Us</a></div></div></section>
<section class="section"><div class="wrap"><p class="eyebrow center">OUR SERVICES</p><h2 class="center">Complete Healthcare Support At Your Doorstep</h2><p class="sub center">Tap any service to open its dedicated page.</p>{service_grid()}</div></section>
<section class="section alt"><div class="wrap"><p class="eyebrow">WHY CHOOSE US</p><h2>Why Choose GO CARE DRUG?</h2>
<div class="grid grid-3">
<div class="feat reveal"><div class="f-ico">🏥</div><h3>Professional Healthcare Support</h3><p>Organised, care-focused assistance for everyday medical needs at home.</p></div>
<div class="feat reveal"><div class="f-ico">🏠</div><h3>Convenient Home Services</h3><p>Care delivered at your doorstep — no travel, no waiting rooms.</p></div>
<div class="feat reveal"><div class="f-ico">❤️</div><h3>Patient-Centered Approach</h3><p>Support planned around the patient's comfort and family needs.</p></div>
<div class="feat reveal"><div class="f-ico">🤝</div><h3>Reliable Assistance</h3><p>Clear communication from booking to service completion.</p></div>
<div class="feat reveal"><div class="f-ico">👥</div><h3>Experienced Service Support</h3><p>A coordinated team for nursing, medical, pathology, physio and more.</p></div>
<div class="feat reveal"><div class="f-ico">📞</div><h3>Easy Contact & Booking</h3><p>Call or WhatsApp <a href="tel:{PHONE_TEL}">{PHONE}</a> to request any service.</p></div>
</div>
<div class="split"><div class="split-media"><img loading="lazy" src="assets/all-services.jpg" alt="GO CARE DRUG all services collage including nursing, physiotherapy, ambulance and medicine"></div>
<div><h3>One trusted team for your family's everyday care</h3><p>From sample collection to medicine delivery and attendant support, every request is handled with hygiene, punctuality and compassion.</p><ul class="ticks"><li>Home sample collection assistance</li><li>Nursing, caretaker & compounder support</li><li>Physiotherapy at home</li><li>Ambulance & medicine delivery coordination</li></ul><a class="btn btn-primary" href="about.html">More About Us</a></div></div>
</div></section>
<section class="section"><div class="wrap"><p class="eyebrow center">PROCESS</p><h2 class="center">How Our Healthcare Service Works</h2>
<div class="steps"><div class="step reveal"><span>01</span><h3>Contact Us</h3><p>Call or WhatsApp {PHONE}.</p></div><div class="step reveal"><span>02</span><h3>Tell Us Your Requirement</h3><p>Share the service and patient needs.</p></div><div class="step reveal"><span>03</span><h3>Get Service Assistance</h3><p>We confirm and schedule your visit.</p></div><div class="step reveal"><span>04</span><h3>Receive Professional Support</h3><p>Care delivered at your home.</p></div></div></div></section>
<section class="cta-band"><div class="wrap cta-grid"><div><h2>Need Healthcare Assistance?</h2><p>Get in touch with GO CARE DRUG for reliable healthcare support.</p>
<div class="cta-btns"><a class="btn btn-light" href="tel:{PHONE_TEL}">CALL NOW · {PHONE}</a><a class="btn btn-wa" href="https://wa.me/{PHONE_WA}?text=Hello%20GO%20CARE%20DRUG%2C%20I%20need%20healthcare%20assistance." target="_blank" rel="noopener">WhatsApp Us</a></div></div>
<div class="cta-media"><img loading="lazy" src="assets/ambulance.jpg" alt="GO CARE DRUG ambulance service for emergency assistance"></div></div></section>"""

page("index.html","Professional Home Healthcare Services","GO CARE DRUG offers home nursing, medical, pathology, physiotherapy, ambulance and medicine support. Call "+PHONE+".",home_body)

# ---------- ABOUT ----------
about_body = """<section class="section"><div class="wrap split">
<div><p class="eyebrow">WHO WE ARE</p><h2>Care, Health & Trust</h2>
<p>GO CARE DRUG is a home medical and healthcare service provider focused on delivering convenient and dependable medical support to patients and families.</p>
<p>Our work is simple: bring organised healthcare assistance to your doorstep — with clear communication, respectful care and attention to hygiene and comfort.</p>
<ul class="ticks"><li>Home-first service model</li><li>Single point of contact for 8 services</li><li>Care-focused, family-friendly approach</li></ul></div>
<div class="split-media"><img src="assets/nursing-welcome.jpg" alt="GO CARE DRUG nurse welcoming patients"></div></div></section>
<section class="section alt"><div class="wrap"><div class="grid grid-3">
<div class="feat"><div class="f-ico">🎯</div><h3>Our Approach</h3><p>Listen first, then arrange the right support — nursing, medical, pathology, physiotherapy, ambulance or medicines — as per your requirement.</p></div>
<div class="feat"><div class="f-ico">🛡️</div><h3>Our Commitment</h3><p>Safe handling, on-time visits, transparent coordination and courteous behaviour on every home visit.</p></div>
<div class="feat"><div class="f-ico">⭐</div><h3>Why Patients Choose Us</h3><p>One trusted team, easy booking on call or WhatsApp, and support planned around the patient's daily routine.</p></div>
</div><div class="split reverse"><div class="split-media"><img loading="lazy" src="assets/all-services.jpg" alt="Overview of GO CARE DRUG home healthcare services"></div>
<div><h3>Everything your family needs, at home</h3><p>Our service directory covers nursing care, caretaker support, sample collection, physiotherapy, ambulance coordination and medicine delivery assistance.</p><a class="btn btn-primary" href="services.html">Explore Services</a></div></div></div></section>"""
page("about.html","About Us","Learn about GO CARE DRUG — dependable home medical and healthcare support built on care, health and trust.",about_body,"ABOUT GO CARE DRUG","Care, Health & Trust","A healthcare service provider focused on convenient, dependable medical support at home.")

# ---------- SERVICES ----------
services_body = f"""<section class="section"><div class="wrap"><p class="sub">All 8 services open their own dedicated page with details and enquiry options.</p>{service_grid()}
<div class="split" style="margin-top:44px"><div class="split-media"><img loading="lazy" src="assets/all-services.jpg" alt="GO CARE DRUG complete service poster collection"></div>
<div><h3>Not sure which service you need?</h3><p>Call us and describe your requirement — we will guide you to the right support.</p><div class="cta-btns"><a class="btn btn-primary" href="tel:{PHONE_TEL}">Call {PHONE}</a><a class="btn btn-wa" href="contact.html">Send Enquiry</a></div></div></div></div></section>"""
page("services.html","All Services","Browse all 8 GO CARE DRUG home healthcare services: nursing, medical, pathology, compounder, physiotherapy, nurse, ambulance and medicine.",services_body,"SERVICE DIRECTORY","Everyday Healthcare, At Your Doorstep","")

def service_page(fn,title,kicker,img,alt,intro,bullets,cta_label,extra=""):
    bullets_html="".join(f"<li>{b}</li>" for b in bullets)
    body=f"""<section class="section"><div class="wrap split">
<div class="poster"><img src="{img}" alt="{alt}"></div>
<div><p class="eyebrow">GO CARE DRUG · HOME SERVICE</p><h2 style="margin-top:0">{title} — At Home</h2><p>{intro}</p>
<ul class="ticks">{bullets_html}</ul>
<div class="cta-btns"><a class="btn btn-primary" href="contact.html?service={title}">{cta_label}</a><a class="btn btn-dark" href="tel:{PHONE_TEL}">Call: {PHONE}</a></div>
<p class="note">Prefer WhatsApp? <a href="https://wa.me/{PHONE_WA}?text=Hello%20GO%20CARE%20DRUG%2C%20I%20need%20{title.replace(' ','%20')}." target="_blank" rel="noopener">Chat with us here</a>.</p></div></div></section>
<section class="section alt"><div class="wrap"><h2>How to book {title.lower()}</h2><div class="steps">
<div class="step"><span>01</span><h3>Contact us</h3><p>Call or WhatsApp {PHONE}.</p></div>
<div class="step"><span>02</span><h3>Share details</h3><p>Tell us the patient need and location ({ADDRESS}).</p></div>
<div class="step"><span>03</span><h3>Confirm schedule</h3><p>We arrange and confirm your visit.</p></div>
<div class="step"><span>04</span><h3>Receive care</h3><p>Service delivered at your home.</p></div></div>{extra}</div></section>"""
    page(fn,title,f"{title} at home by GO CARE DRUG. Call {PHONE} or send a WhatsApp enquiry.",body,kicker,title,"")

service_page("nursing.html","Nursing Services","NURSING CARE","assets/nursing-welcome.jpg","Nurse welcoming patients to GO CARE DRUG home nursing care",
 "Supportive home nursing assistance focused on day-to-day patient comfort, routine care and responsible healthcare coordination — without overstated medical promises.",
 ["Home nursing support","Patient assistance for daily needs","Routine care support","General healthcare assistance","Care-focused, family-friendly service"],"Request Nursing Service")

service_page("medical.html","Medical Services","MEDICAL SUPPORT","assets/medical.jpg","Doctor appointment support poster by GO CARE DRUG",
 "General medical assistance including help with doctor appointments and coordination of everyday medical needs. We connect you with the right support without claiming doctor credentials of our own.",
 ["Doctor appointment coordination","General medical assistance","Guidance on next steps for care","Follow-up visit coordination","Home-visit support as required"],"Enquire About Medical Services")

service_page("pathologist.html","Pathologist Services","PATHOLOGY SUPPORT","assets/pathology.jpg","Home blood sample collection by GO CARE DRUG pathology support",
 "Hygienic home sample-collection support for pathology and lab-related needs, handled carefully and delivered through proper lab channels — described in general terms.",
 ["Home sample collection assistance","Safe & hygienic collection process","Careful sample handling","Report delivery coordination","Affordable, transparent process"],"Enquire Now",
 extra='<div class="notice">Note: specific tests and reports are confirmed on call as per your prescription or requirement.</div>')

service_page("compounder.html","Compounder Services","COMPOUNDER SUPPORT","assets/compounder.jpg","Compounder providing wound dressing support at home",
 "Responsible compounder assistance for routine medical support at home — such as dressing support, basic monitoring and medicine scheduling — strictly as per your doctor's advice.",
 ["Injection support as per doctor's advice","IV drip & cannulation assistance","Wound dressing support","Medicine management reminders","Basic vitals & patient-care assistance"],"Contact GO CARE DRUG",
 extra='<div class="notice">We do not claim prescription authority. All medication-related support follows your doctor\u2019s prescription.</div>')

service_page("physiotherapy.html","Physiotherapy Services","PHYSIOTHERAPY","assets/physiotherapy.jpg","Physiotherapist supporting knee mobilisation at home",
 "At-home physiotherapy support for pain relief, mobility, strength and post-surgery rehabilitation routines — planned around your condition and comfort, without exaggerated recovery claims.",
 ["Expert physiotherapy at home","Personalised session planning","Pain-relief & mobility exercises","Post-surgery & elderly support","Flexible hourly / daily / weekly sessions"],"Enquire For Physiotherapy")

service_page("nurse.html","Nurse Services","NURSE SUPPORT","assets/nursing-welcome.jpg","Dedicated nurse support for home patient care",
 "Dedicated nurse support for families who need an extra pair of trained hands — elderly care, bedside assistance and day-to-day patient comfort.",
 ["Dedicated nurse for home visits","Elderly & bedridden patient support","Daily routine & hygiene assistance","Companionship with professional conduct","Coordination with family members"],"Request Nurse Service")

service_page("ambulance.html","Ambulance Services","EMERGENCY SUPPORT","assets/ambulance.jpg","GO CARE DRUG ambulance vehicle for patient transfer",
 "Quick-contact ambulance coordination for emergency assistance and safe patient transfers — local and long-distance — with trained support and essential equipment.",
 ["Emergency assistance coordination","Rapid response on call","Trained medical support staff","Stretcher, oxygen & life-support equipment","Local & long-distance transfers"],
 "Call Ambulance — "+PHONE,
 extra=f'<div class="emg"><a class="btn btn-light big" href="tel:{PHONE_TEL}">CALL {PHONE}</a><a class="btn btn-wa big" href="https://wa.me/{PHONE_WA}?text=EMERGENCY%3A%20I%20need%20an%20ambulance.%20Location%3A%20" target="_blank" rel="noopener">WhatsApp Location</a></div>')

service_page("medicine.html","Medicine Services","MEDICINE SUPPORT","assets/medicine.jpg","Medicine home delivery by GO CARE DRUG",
 "Simple medicine ordering support with careful packing and home delivery. Share your prescription or list on call or WhatsApp and we will coordinate the rest.",
 ["Prescription & OTC order support","Genuine, quality-checked sourcing","Safe home delivery","Elderly & chronic-care refills","Easy payments & order updates"],"Enquire About Medicine Services")

# ---------- CONTACT ----------
contact_body = f"""<section class="section"><div class="wrap">
<div class="grid grid-3">
<div class="feat"><div class="f-ico">📞</div><h3>Call Us</h3><p><a href="tel:{PHONE_TEL}">{PHONE}</a></p><a class="btn btn-dark" href="tel:{PHONE_TEL}">Call Now</a></div>
<div class="feat"><div class="f-ico">💬</div><h3>WhatsApp Us</h3><p>Fast replies with service details.</p><a class="btn btn-wa" href="https://wa.me/{PHONE_WA}?text=Hello%20GO%20CARE%20DRUG%2C%20I%20need%20healthcare%20assistance." target="_blank" rel="noopener">Open Chat</a></div>
<div class="feat"><div class="f-ico">📍</div><h3>Visit Us</h3><p>{ADDRESS}</p><a class="btn btn-outline" href="https://www.google.com/maps/search/?api=1&query={ADDRESS.replace(' ','+')}" target="_blank" rel="noopener">Get Directions</a></div>
</div>
<div class="split" style="margin-top:36px"><div>
<h2>Send an Enquiry</h2><p>Fill the form — it opens WhatsApp with your message pre-filled to {PHONE}.</p>
<form id="enquiryForm" class="form" novalidate>
<label>Full Name*<input name="name" required placeholder="Your full name"></label>
<label>Phone Number*<input name="phone" required inputmode="tel" pattern="[0-9+ ]{{7,15}}" placeholder="Your phone number"></label>
<label>Service Required*<select name="service" required><option value="">Select a service…</option><option>Nursing Services</option><option>Medical Services</option><option>Pathologist Services</option><option>Compounder Services</option><option>Physiotherapy Services</option><option>Nurse Services</option><option>Ambulance Services</option><option>Medicine Services</option></select></label>
<label>Message<textarea name="message" rows="4" placeholder="Describe your requirement"></textarea></label>
<p class="form-err" id="formErr" hidden>Please fill Name, a valid Phone and select a Service.</p>
<button class="btn btn-primary" type="submit">Send Enquiry via WhatsApp</button></form></div>
<div class="split-media"><img loading="lazy" src="assets/all-services.jpg" alt="GO CARE DRUG services overview poster"><p class="media-cap">{ADDRESS} · Call / WhatsApp {PHONE}</p></div></div>
</div></section>"""
page("contact.html","Contact Us","Contact GO CARE DRUG — call or WhatsApp "+PHONE+", visit "+ADDRESS+", or send an enquiry.",contact_body,"GET IN TOUCH","Contact GO CARE DRUG","Call, WhatsApp or visit us — we respond quickly.")
print("pages built OK")
