//public/js/menu.js

document.addEventListener("DOMContentLoaded", async () => {
  const menuList = document.getElementById("menuList");
  if (!menuList) return;

  try {
    // 🔹 Fetch logged-in user from session
    const res = await fetch("/api/auth/me", { credentials: "include" });
    if (!res.ok) throw new Error("Not logged in");

    const { user } = await res.json();
    if (!user || !user.role) return;

    const role = user.role;

    // Menu definitions with icons
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

    // Start with base User menu
    let finalMenu = [...menus.User];

    // Merge role menus
    if (role === "SuperAdmin") {
      // SuperAdmin gets ALL menus (except duplicates)
      Object.keys(menus).forEach(r => {
        if (r !== "SuperAdmin") finalMenu.push(...menus[r]);
      });
    } else if (menus[role]) {
      finalMenu = [...finalMenu, ...menus[role]];
    }

    // ExtraRoles support
    if (user.extraRoles && Array.isArray(user.extraRoles)) {
      user.extraRoles.forEach(r => {
        if (menus[r]) finalMenu.push(...menus[r]);
      });
    }

    // Special case: SSG
    if (user.isSSG || role === "SSG") {
      finalMenu.push(...menus.SSG);
    }

    // Remove duplicates (by name)
    const seen = new Set();
    finalMenu = finalMenu.filter(item => {
      if (seen.has(item.name)) return false;
      seen.add(item.name);
      return true;
    });

    // Inject into sidebar
    finalMenu.forEach(item => {
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

  } catch (err) {
    console.error("❌ Menu load error:", err);
  }
});
