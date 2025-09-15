//public/js/welcome.js

(function(){
  'use strict';

  const api = {
    me: '/api/auth/me',
    logout: '/api/auth/logout',
    announcements: '/api/announcements',
    superUsers: '/api/superadmin/users',
    impersonate: '/api/superadmin/impersonate'
  };

  function qs(sel){return document.querySelector(sel)}
  function qsa(sel){return Array.from(document.querySelectorAll(sel))}

  async function fetchJson(url, opts = {}){
    const cfg = Object.assign({credentials:'include',headers:{'Accept':'application/json'}}, opts);
    return fetch(url, cfg);
  }

  function niceDate(dStr){
    try{
      const d = new Date(dStr);
      return d.toLocaleString('en-PH',{timeZone:'Asia/Manila',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
    }catch(e){return dStr}
  }

  function showModal(contentHtml){
    const root = qs('#modalRoot');
    root.innerHTML = '';
    root.style.display = 'block';
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `<div class="modal">${contentHtml}</div>`;
    backdrop.addEventListener('click', (ev)=>{ if(ev.target===backdrop){ root.style.display='none'; root.innerHTML=''; } });
    root.appendChild(backdrop);
  }

  function closeModal(){ const r = qs('#modalRoot'); r.style.display='none'; r.innerHTML=''; }

  async function loadAnnouncements(){
    const container = qs('#schoolAnnouncements');
    container.innerHTML = '<div class="muted small">Loading announcements…</div>';
    try{
      const res = await fetchJson(api.announcements);
      if(!res.ok){ container.innerHTML = '<div class="muted small">No announcements found.</div>'; return; }
      const json = await res.json();
      // Accept different shapes: { announcements: [...] } or an array
      let items = [];
      if(Array.isArray(json)) items = json;
      else if(Array.isArray(json.announcements)) items = json.announcements;
      else if(Array.isArray(json.data)) items = json.data;
      else if(json.announcements) items = Object.values(json.announcements);

      if(!items || items.length===0){ container.innerHTML = '<div class="muted small">No announcements.</div>'; return; }

      container.innerHTML = '';
      items.slice(0,8).forEach(a => {
        const title = a.title || a.subject || 'Announcement';
        const body = a.body || a.message || a.content || '';
        const date = a.createdAt || a.date || a.created || '';
        const el = document.createElement('div');
        el.className = 'announcement';
        el.innerHTML = `
          <div class="meta">${niceDate(date)}</div>
          <div style="font-weight:600">${escapeHtml(title)}</div>
          <div class="small muted">${truncate(escapeHtml(body), 220)}</div>
        `;
        container.appendChild(el);
      });
    }catch(err){ console.error('Announcements load error', err); container.innerHTML = '<div class="muted small">Failed to load announcements.</div>'; }
  }

  function escapeHtml(str){ if(!str) return ''; return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[s])); }
  function truncate(s,n){ if(!s) return ''; return s.length>n? s.slice(0,n-1)+'…':s; }

  function updateClock(){ const now = new Date(); const optionsTime = {hour12:false,timeZone:'Asia/Manila'}; const optionsDate = {weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'Asia/Manila'}; qs('#clock').textContent = now.toLocaleTimeString('en-PH',optionsTime); qs('#todayDate').textContent = 'Today is ' + now.toLocaleDateString('en-PH',optionsDate); }

  async function tryImpersonate(selectedUser){
    // Try multiple payload shapes in case backend expects different field names
    const attempts = [ {userId:selectedUser._id || selectedUser.id}, {userId:selectedUser.id || selectedUser._id}, {email:selectedUser.email}, {email:selectedUser.user}, {id:selectedUser._id}, {id:selectedUser.id} ];
    for(const attempt of attempts){
      try{
        const res = await fetch(api.impersonate, {method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(attempt)});
        if(res.ok) return {ok:true};
        // on 401/403/400, continue to try next
        const txt = await res.text();
        console.warn('Impersonate attempt failed with',attempt,res.status,txt);
      }catch(e){ console.warn('Impersonate error',e); }
    }
    return {ok:false};
  }

  async function openImpersonationModal(currentUser){
    try{
      const res = await fetchJson(api.superUsers);
      if(!res.ok){ const txt = await res.text(); showModal(`<h3>Unable to load users</h3><p class="small muted">${escapeHtml(txt||res.statusText||'server error')}</p><div class="actions"><button class="btn" onclick="document.querySelector('#modalRoot').style.display='none'">Close</button></div>`); return; }
      const j = await res.json();
      const users = j.users || j.data || j || [];
      let opts = '';
      users.forEach(u => {
        const id = u._id || u.id || u.userId || u._id;
        const label = (u.email || u.emailAddress || u.username || (u.name && (u.name.first || u.name.last)) || id) ;
        // don't show current session user as a target
        if(id && (id === (currentUser._id||currentUser.id||currentUser.userId))) return;
        opts += `<option value="${escapeHtml(id)}">${escapeHtml(label)}</option>`;
      });

      const content = `
        <h3>Impersonate user</h3>
        <p class="small muted">Select a user to assume their session. This will change your current session to the selected user.</p>
        <div style="margin-top:10px">
          <div class="form-row">
            <select id="impersonateSelect" class="select">${opts}</select>
          </div>
          <div class="actions">
            <button id="impersonateCancel" class="btn ghost">Cancel</button>
            <button id="impersonateGo" class="btn">Impersonate</button>
          </div>
        </div>
      `;

      showModal(content);
      document.getElementById('impersonateCancel').addEventListener('click', closeModal);
      document.getElementById('impersonateGo').addEventListener('click', async ()=>{
        const sel = document.getElementById('impersonateSelect');
        const selectedId = sel.value;
        if(!selectedId){ alert('Please choose a user'); return; }
        // try to match full user object
        const selectedUser = users.find(u => (u._id===selectedId||u.id===selectedId||u.userId===selectedId));
        const res = await tryImpersonate(selectedUser || { id:selectedId, _id:selectedId });
        if(res.ok){
          // successful - reload so session and menu refresh
          closeModal();
          setTimeout(()=>{ location.reload(); }, 300);
        }else{
          alert('Impersonation failed. Check server logs or try another user.');
        }
      });

    }catch(err){ console.error('Impersonation modal error',err); showModal('<h3>Error</h3><p class="small muted">Failed to open impersonation UI.</p>'); }
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    try{
      const res = await fetchJson(api.me);
      if(!res.ok){ location.href = '/html/login.html' .replace('/html/','/html/') ; return; }
      const j = await res.json();
      const user = j.user || j;
      // Save user for later
      window.__EDUSEC__ = { user };

      // Fill UI
      qs('#userName').textContent = user.name || user.email || user.username || 'User';

      // Role display: include extraRoles if present
      let roleText = user.role || 'User';
      if(user.extraRoles && Array.isArray(user.extraRoles) && user.extraRoles.length) roleText += ' (+' + user.extraRoles.join(',') + ')';
      qs('#userRole').textContent = roleText;

      // Quick links handlers
      qs('#openAnnouncements').addEventListener('click', ()=>{ location.href = '/html/announcements.html'; });
      qs('#openRecordBook').addEventListener('click', ()=>{ location.href = '/html/recordbook.html'; });
      qs('#openRegistrar').addEventListener('click', ()=>{ location.href = '/html/registrar.html'; });

      // SuperAdmin impersonation controls
      if ((user.role && user.role === 'SuperAdmin') || user.isSuperAdmin) {
        const area = qs('#impersonationArea');
        const btn = document.createElement('button');
        btn.className = 'btn ghost';
        btn.textContent = 'Impersonate User';
        btn.title = 'Open SuperAdmin impersonation panel';
        btn.addEventListener('click', ()=> openImpersonationModal(user));
        area.appendChild(btn);
      }

      // Show "Back to SuperAdmin" if session is impersonated
      if (user.originalSuperAdmin) {
        qs('#backToSuperBtn').style.display = 'inline-block';
        qs('#backToSuperBtn').addEventListener('click', async ()=>{
          try {
            await fetch(api.impersonate + '/stop', { method:'POST', credentials:'include' });
          } catch(e) {}
          location.reload();
        });

      // Load announcements and clock
      loadAnnouncements();
      updateClock(); setInterval(updateClock,1000);

    }catch(err){ console.error('Welcome load error',err); location.href = '/html/login.html'; }

    qs('#logoutBtn').addEventListener('click', async ()=>{
      try{ await fetchJson(api.logout, {method:'POST'}); }catch(e){}
      location.href = '/html/login.html';
    });
  });

})();
