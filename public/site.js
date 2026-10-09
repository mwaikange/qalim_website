(() => {
  const config=window.QALIM||{};
  const safeUrl=value=>{try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}};
  const play=safeUrl(config.playUrl);if(play)document.querySelectorAll('[data-play]').forEach(a=>a.href=play);
  document.querySelectorAll('[data-year]').forEach(e=>e.textContent=new Date().getFullYear());
  document.querySelectorAll('[data-store]').forEach(a=>{const url=safeUrl(config.downloads?.[a.dataset.store]);if(!url)return;a.href=url;a.removeAttribute('aria-disabled');a.querySelector('[data-store-status]').textContent=a.dataset.store==='apk'?'Get the APK':'Get the app';a.rel='noopener noreferrer';});
  const form=document.querySelector('#request-form');
  const aliases={'/privacy-policy':'privacy','/child-safety':'safety','/request-account-removal':'remove'};
  const target=aliases[location.pathname.replace(/\/$/,'')];if(target&&!location.hash){document.getElementById(target)?.scrollIntoView();}
  if(!form)return;
  const kinds={deletion:'Account removal',privacy:'Privacy request',safety:'Safety report'},status=document.querySelector('#form-status'),submit=document.querySelector('#submit-request'),fallback=document.querySelector('#mail-fallback'),consent=form.elements.consent;
  function mailLink(){const kind=form.elements.kind.value;const details=[`Request: ${kinds[kind]}`,`Registered email: ${form.elements.email.value}`,`Player name: ${form.elements.username.value||'(not provided)'}`,`Message: ${form.elements.message.value||'(not provided)'}`,kind==='deletion'?`Deletion acknowledged: ${consent.checked?'yes':'not yet'}`:''];fallback.href=`mailto:support@mwaikange.com?subject=${encodeURIComponent(`QALIM tickTack: ${kinds[kind]}`)}&body=${encodeURIComponent(details.filter(Boolean).join('\n\n'))}`;}
  function setKind(kind){if(!kinds[kind])return;form.elements.kind.value=kind;document.querySelectorAll('[data-kind]').forEach(b=>{const active=b.dataset.kind===kind;b.setAttribute('aria-pressed',String(active));b.classList.toggle('dark',active);});document.querySelector('#deletion-consent').hidden=kind!=='deletion';consent.required=kind==='deletion';form.elements.message.required=kind!=='deletion';document.querySelector('#message-label').textContent=kind==='deletion'?'Reason for leaving (optional)':kind==='safety'?'Describe your concern *':'Your privacy question *';submit.firstChild.textContent=kind==='deletion'?'Submit removal request ':'Send request ';status.textContent='';mailLink();}
  document.querySelectorAll('[data-kind]').forEach(b=>b.addEventListener('click',()=>setKind(b.dataset.kind)));
  document.querySelectorAll('[data-request-kind]').forEach(a=>a.addEventListener('click',()=>setKind(a.dataset.requestKind)));
  form.addEventListener('input',mailLink);fallback.addEventListener('click',mailLink);
  form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity())return;submit.disabled=true;status.dataset.state='pending';status.textContent='Sending your request…';const fields=Object.fromEntries(new FormData(form));fields.consent=consent.checked;try{const response=await fetch('/api/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fields)});const data=await response.json();if(!response.ok)throw Error(data.message||'Your request could not be sent. Please try again or use your email app.');status.dataset.state='success';status.textContent='Request sent. We’ll reply to the email you provided. Account deletion still requires ownership verification.';}catch(error){status.dataset.state='error';status.textContent=error.message||'Your request could not be sent. Please use your email app instead.';}finally{submit.disabled=false;mailLink();}});
  setKind('deletion');
})();
