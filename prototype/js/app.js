/* =========================================================
   ShubhMilan — shared UI components (nav/footer)
   ========================================================= */

function renderNav(active){
  const s=Store.load();
  const loggedIn=!!s.user;
  const loginLinks=loggedIn
    ? `<a href="dashboard.html" ${active==='dashboard'?'style="color:#ffd740"':''}>Dashboard</a>
       <a href="inbox.html" ${active==='inbox'?'style="color:#ffd740"':''}>Inbox</a>
       <a href="my-profile.html" ${active==='my'?'style="color:#ffd740"':''}>My Profile</a>
       <a href="#" onclick="logout();return false;" class="btn btn-outline btn-sm">Logout</a>`
    : `<a href="login.html" class="btn btn-outline btn-sm">Login</a>
       <a href="register.html" class="btn btn-accent btn-sm">Register Free</a>`;

  return `
  <div class="topbar">
    <div class="brand">
      <div class="logo">श</div>
      <div>ShubhMilan <span class="badge-free">100% FREE</span></div>
    </div>
    <nav>
      <a href="index.html" ${active==='home'?'style="color:#ffd740"':''}>Home</a>
      <a href="browse.html" ${active==='browse'?'style="color:#ffd740"':''}>Browse</a>
      <a href="admin.html" ${active==='admin'?'style="color:#ffd740"':''}>Admin</a>
      <a href="superadmin.html" ${active==='super'?'style="color:#ffd740"':''}>Super Admin</a>
    </nav>
    <div class="actions">${loginLinks}</div>
  </div>`;
}

function renderFooter(){
  return `
  <footer class="site-footer">
    <div class="container">
      <div>
        <h4>ShubhMilan Matrimony</h4>
        <p style="margin:0;font-size:13px;">A 100% free matrimonial platform bringing families together — safely, sincerely and without any fees.</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <a href="browse.html">Browse Profiles</a>
        <a href="register.html">Register Free</a>
        <a href="login.html">Member Login</a>
        <a href="#">Success Stories</a>
      </div>
      <div>
        <h4>Communities</h4>
        <a href="#">Hindu Matrimony</a>
        <a href="#">Sikh Matrimony</a>
        <a href="#">Jain Matrimony</a>
        <a href="#">NRI Matrimony</a>
      </div>
      <div>
        <h4>Help</h4>
        <a href="#">About Us</a>
        <a href="#">Contact</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Use</a>
      </div>
    </div>
    <div class="copy">© 2026 ShubhMilan Matrimony · Made with ❤ in India · All profiles free for everyone</div>
  </footer>`;
}

function logout(){
  const s=Store.load();s.user=null;Store.save(s);
  alert("You have been logged out.");
  location.href="index.html";
}

function requireLogin(redirect="login.html"){
  const s=Store.load();
  if(!s.user){location.href=redirect;return false;}
  return true;
}

function toast(msg){
  const el=document.createElement('div');
  el.textContent=msg;
  el.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1f2233;color:#fff;padding:12px 20px;border-radius:24px;font-size:14px;z-index:500;box-shadow:0 6px 20px rgba(0,0,0,.25);';
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),2200);
}
