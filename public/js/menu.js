// public/js/menu.js

// 🔹 Centralized menu definitions
const menus = {
  User: [
    { name: "Enrollment", link: "pages/enrollment.html", icon: "📝" }
  ],
  Student: [
    { name: "Grades", link: "pages/grades.html", icon: "📊" },
    { name: "Attendance", link: "pages/attendance.html", icon: "🕒" },
    { name: "Vote", link: "pages/vote.html", icon: "🗳️" },
    { name: "Announcements", link: "pages/announcements.html", icon: "📢" },
  ],
  Moderator: [
    { name: "Record Book", link: "pages/recordbook.html", icon: "📚" },
    { name: "Announcements", link: "pages/announcements.html", icon: "📢" },
  ],
  Registrar: [
    { name: "Enrollee", link: "pages/registrar.html", icon: "🧾" },
    { name: "Enrolled", link: "pages/enrolled.html", icon: "✅" },
    { name: "Archives", link: "pages/archives.html", icon: "📂" },
    { name: "Role Management", link: "pages/role-management.html", icon: "👥" },
    { name: "Announcements", link: "pages/announcements.html", icon: "📢" }, 
  ],
  Admin: [
    { name: "Management", link: "pages/admin.html", icon: "⚙️" },
    { name: "Announcements", link: "pages/announcements.html", icon: "📢" },
  ],
  SuperAdmin: [], 
  SSG: [
    { name: "SSG Management", link: "pages/ssg.html", icon: "🏛️" },
    { name: "Announcements", link: "pages/announcements.html", icon: "📢" },
  ],
};

// 🔹 Build final menu for a user (role + extraRoles + special cases)
function buildMenuForUser(user) {
  const role = user.role;
  let finalMenu = [...menus.User]; // Base User menu always included

  if (role === "SuperAdmin") {
    // SuperAdmin gets everything
    Object.keys(menus).forEach(r => {
      if (r !== "SuperAdmin") finalMenu.push(...menus[r]);
    });
  } else if (menus[role]) {
    finalMenu = [...finalMenu, ...menus[role]];
  }

  // ExtraRoles (if assigned)
  if (user.extraRoles && Array.isArray(user.extraRoles)) {
    user.extraRoles.forEach(r => {
      if (menus[r]) finalMenu.push(...menus[r]);
    });
  }

  // Special case for SSG
  if (user.isSSG || role === "SSG") {
    finalMenu.push(...menus.SSG);
  }

  // Remove duplicates by name
  const seen = new Set();
  return finalMenu.filter(item => {
    if (seen.has(item.name)) return false;
    seen.add(item.name);
    return true;
  });
}

// 🔹 Render Sidebar menu
function renderSidebar(menu) {
  const menuList = document.getElementById("menuList");
  if (!menuList) return;
  menuList.innerHTML = "";

  menu.forEach(item => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = item.link;
    a.innerHTML = `
      <span class="icon">${item.icon || "📄"}</span>
      <span class="label">${item.name}</span>
    `;
    a.classList.add("menu-link");
    li.appendChild(a);
    menuList.appendChild(li);
  });
}

// 🔹 Render Quick Actions
function renderQuickActions(menu) {
  const container = document.getElementById("quickActions");
  if (!container) return;
  container.innerHTML = "";

  menu.forEach(item => {
    const btn = document.createElement("a");
    btn.className = "btn ghost";
    btn.href = item.link;
    btn.textContent = item.name;
    container.appendChild(btn);
  });
}

// 🔹 Initialize menus after login check
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) throw new Error("Not logged in");

    const { user } = await res.json();
    if (!user || !user.role) return;

    const finalMenu = buildMenuForUser(user);

    renderSidebar(finalMenu);
    renderQuickActions(finalMenu);

  } catch (err) {
    console.error("❌ Menu load error:", err);
  }
});
