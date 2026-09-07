// GO CARE DRUG — menu, animations, WhatsApp enquiry form
(function(){
  var ham=document.getElementById('hamburger'),menu=document.getElementById('mobileMenu'),
      close=document.getElementById('mobileClose'),scrim=document.getElementById('scrim');
  function openMenu(o){ if(!menu) return; menu.classList.toggle('open',o); scrim.classList.toggle('show',o); ham&&ham.setAttribute('aria-expanded',o); document.body.style.overflow=o?'hidden':''; }
  ham&&ham.addEventListener('click',function(){openMenu(true)});
  close&&close.addEventListener('click',function(){openMenu(false)});
  scrim&&scrim.addEventListener('click',function(){openMenu(false)});
  menu&&menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){openMenu(false)})});
  // reveal on scroll
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window && els.length){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
    els.forEach(function(el){io.observe(el)});
  } else { els.forEach(function(el){el.classList.add('in')}); }
  // preselect service from ?service=
  try{
    var q=new URLSearchParams(location.search).get('service');
    var sel=document.querySelector('#enquiryForm select[name=service]');
    if(q&&sel){Array.prototype.forEach.call(sel.options,function(o){if(o.text.toLowerCase()===q.toLowerCase().replace(/%20/g,' '))sel.value=o.value||o.text;});}
  }catch(e){}
  // enquiry -> WhatsApp
  var form=document.getElementById('enquiryForm');
  if(form){form.addEventListener('submit',function(ev){
    ev.preventDefault();
    var name=form.elements['name'].value.trim(),phone=form.elements['phone'].value.trim(),
        service=form.elements['service'].value,msg=form.elements['message'].value.trim(),
        err=document.getElementById('formErr');
    var ok=name.length>1&&/^[0-9+ ]{7,15}$/.test(phone)&&service;
    if(err)err.hidden=!!ok;
    if(!ok)return;
    var text='Hello GO CARE DRUG,%0AName: '+encodeURIComponent(name)+'%0APhone: '+encodeURIComponent(phone)+'%0AService: '+encodeURIComponent(service)+'%0AMessage: '+encodeURIComponent(msg||'-');
    window.open('https://wa.me/917759993511?text='+text,'_blank');
  });}
})();
