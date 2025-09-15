// public/js/welcome.js
// Welcome page behavior: fetch /api/auth/me and render role-aware UI

document.addEventListener("DOMContentLoaded", initWelcome);

async function apiFetch(url, options = {}) {
  options.headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  options.credentials = "include";
  const res = await fetch(url, options);
  return res;
}

async function initWelcome() {
  try {
    // fetch session
    const res = await apiFetch("/api/auth/me");
    if (res.status === 401) {
      // not logged in
      window.location.href = "/html/login.html";
      return;
    }
    if (!res.ok) {
      throw new Error("Failed to get user info");
    }

    const user = await res.json(); // { id, email, role, extraRoles }
    renderHeader(user);
    renderNav(user);
    renderGreeting(user);
    await renderAnnouncements();
    await renderEvents();

    // Enrollment card behavior depends on role
    if (["User"].includes(normalizeRole(user.role))) {
      // show apply / status
      await renderEnrollmentForUser(user);
    } else if (normalizeRole(user.role) === "Student") {
      await renderEnrollmentForStudent(user);
    } else if (["Registrar", "Admin", "SuperAdmin"].includes(normalizeRole(user.role))) {
      await renderAdminCard(user);
    }
  } catch (err) {
    console.error("Welcome init error:", err);
    document.getElementById("mainContent").innerHTML = "<div class='card'><div class='card-body'>Failed to load dashboard.</div></div>";
  }
}

function normalizeRole(r) {
  if (!r) return "User";
  const map = {
    user: "User",
    student: "Student",
    registrar: "Registrar",
    admin: "Admin",
    superadmin: "SuperAdmin",
    ssg: "SSG",
    moderator: "Moderator"
  };
  const key = String(r).toLowerCase();
  return map[key] || r;
}

function renderHeader(user) {
  const ua = document.getElementById("userArea");
  ua.innerHTML = `
    <div class="user-info">
      <div style="font-weight:600">${escapeHtml(user.email)}</div>
      <div style="font-size:0.85rem;color:#475569">${escapeHtml(normalizeRole(user.role))}${(user.extraRoles && user.extraRoles.length) ? " • " + user.extraRoles.join(", ") : ""}</div>
    </div>
  `;
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await apiFetch("/api/auth/logout", { method: "POST" });
      } finally {
        window.location.href = "/html/login.html";
      }
    });
  }
}

function renderNav(user) {
  const nav = document.getElementById("navLinks");
  const role = normalizeRole(user.role);
  let links = [
    { label: "Home", href: "/welcome.html" },
    { label: "Profile", href: "/html/profile.html" },
    { label: "Announcements", href: "/html/announcements.html" },
  ];
  if (role === "User") {
    links.push({ label: "Apply Enrollment", href: "/html/enrollment.html" });
  }
  if (role === "Student") {
    links.push({ label: "My Classes", href: "/html/classes.html" });
  }
  if (["Registrar", "Admin", "SuperAdmin"].includes(role)) {
    links.push({ label: "Registrar Dashboard", href: "/html/registrar-dashboard.html"});
  }
  if (user.extraRoles && user.extraRoles.includes("SSG")) {
    links.push({ label: "SSG Panel", href: "/html/ssg.html" });
  }

  nav.innerHTML = links.map(l => `<a class="nav-link" href="${l.href}">${escapeHtml(l.label)}</a>`).join("<br/>");
}

function renderGreeting(user) {
  document.getElementById("greetTitle").textContent = `Welcome, ${user.email.split("@")[0]}`;
  document.getElementById("greetSubtitle").textContent = `Role: ${normalizeRole(user.role)}`;
}

/* ---------- Announcements & Events ---------- */

async function renderAnnouncements() {
  const el = document.getElementById("announcementsBody");
  try {
    const res = await apiFetch("/api/announcements");
    if (!res.ok) throw new Error("Failed to load announcements");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      el.innerHTML = "<div>No announcements.</div>";
      return;
    }
    el.innerHTML = data.slice(0,5).map(a => `
      <div class="announcement">
        <h4>${escapeHtml(a.title || "Announcement")}</h4>
        <p>${escapeHtml((a.content || "").slice(0,180))}</p>
        <small style="color:#64748b">${new Date(a.createdAt || a.date || Date.now()).toLocaleString()}</small>
      </div>
    `).join("");
  } catch (err) {
    console.error("Announcements error:", err);
    el.innerHTML = "<div>Could not load announcements.</div>";
  }
}

async function renderEvents() {
  const el = document.getElementById("eventsBody");
  try {
    const res = await apiFetch("/api/events");
    if (!res.ok) throw new Error("Failed to load events");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      el.innerHTML = "<div>No upcoming events.</div>";
      return;
    }
    el.innerHTML = data.slice(0,3).map(ev => `
      <div style="padding:0.4rem 0">
        <strong>${escapeHtml(ev.title || ev.name)}</strong>
        <div style="color:#64748b">${escapeHtml(ev.date || ev.startDate || "")}</div>
      </div>
    `).join("");
  } catch (err) {
    console.error("Events error:", err);
    el.innerHTML = "<div>Could not load events.</div>";
  }
}

/* ---------- Enrollment (User / Student) ---------- */

async function renderEnrollmentForUser(user) {
  const el = document.getElementById("enrollmentBody");
  try {
    const res = await apiFetch("/api/enrollment/me");
    if (res.status === 404) {
      // No enrollment yet
      el.innerHTML = `
        <p>No enrollment found.</p>
        <a class="btn" href="/html/enrollment.html">Apply for Enrollment</a>
      `;
      return;
    }
    if (!res.ok) throw new Error("Failed to load enrollment");
    const data = await res.json();
    el.innerHTML = `
      <p>Status: <strong>${escapeHtml(data.status)}</strong></p>
      <p>School Year: ${escapeHtml(data.schoolYear || "")}</p>
      <p>Level: ${escapeHtml(data.level || "")} ${data.strand ? "• "+escapeHtml(data.strand) : ""}</p>
    `;
  } catch (err) {
    console.error("Enrollment (user) error:", err);
    el.innerHTML = "<div>Could not load enrollment status.</div>";
  }
}

async function renderEnrollmentForStudent(user) {
  // show student's assigned section and quick-links
  const el = document.getElementById("enrollmentBody");
  try {
    const res = await apiFetch("/api/enrollment/me");
    if (!res.ok) throw new Error("Failed to load enrollment");
    const data = await res.json();
    el.innerHTML = `
      <p>Enrolled: <strong>${escapeHtml(data.level || "")} ${escapeHtml(data.yearLevel || "")}</strong></p>
      <p>Section: <strong>${escapeHtml(data.section || "TBA")}</strong></p>
      <p>LRN: ${escapeHtml(data.lrn || "—")}</p>
      <a class="btn" href="/html/classes.html">View Classes</a>
    `;
  } catch (err) {
    console.error("Enrollment (student) error:", err);
    el.innerHTML = "<div>Could not load enrollment details.</div>";
  }
}

/* ---------- Admin / Registrar ---------- */

async function renderAdminCard(user) {
  document.getElementById("adminCard").classList.remove("hidden");
  const el = document.getElementById("adminBody");
  try {
    const res = await apiFetch("/api/registrar/enrollment/pending");
    if (res.status === 401) {
      el.innerHTML = "<div>Not authorized.</div>";
      return;
    }
    if (!res.ok) throw new Error("Failed to load pending enrollees");
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      el.innerHTML = "<div>No pending enrollments.</div>";
      return;
    }
    el.innerHTML = data.slice(0,6).map(r => `
      <div style="margin-bottom:0.6rem">
        <div><strong>${escapeHtml(r.name || r.fullname || r.user?.email || "Applicant")}</strong> — ${escapeHtml(r.lrn || "")}</div>
        <div style="color:#475569"><small>${escapeHtml(r.schoolYear || "")} • ${escapeHtml(r.level || "")}</small></div>
        <div style="margin-top:6px">
          <button class="btn" data-id="${r._id}" data-action="approve">Approve</button>
          <button class="btn secondary" data-id="${r._id}" data-action="reject">Reject</button>
        </div>
      </div>
    `).join("");
    // attach handlers
    el.querySelectorAll("button[data-action]").forEach(btn => {
      btn.addEventListener("click", async (ev) => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        try {
          const path = action === "approve" ? `/api/registrar/enrollment/${id}/approve` : `/api/registrar/enrollment/${id}/reject`;
          const r = await apiFetch(path, { method: "POST" });
          if (!r.ok) {
            const txt = await r.text().catch(()=>"");
            throw new Error(txt || "Action failed");
          }
          // refresh admin card
          await renderAdminCard(user);
        } catch (err) {
          alert("Action failed: " + err.message);
        }
      });
    });
  } catch (err) {
    console.error("Admin card error:", err);
    el.innerHTML = "<div>Could not load pending enrollments.</div>";
  }
}

/* ---------- small helpers ---------- */

function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"'`]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" })[m]);
}
