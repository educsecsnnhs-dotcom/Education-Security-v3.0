// public/js/login.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    // ✅ Encrypt password with Caesar cipher before sending
    const encryptedPassword = caesarEncrypt(password, 7);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ensures session cookie
        body: JSON.stringify({ email, password: encryptedPassword }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Login failed");
      }

      // ✅ Session stored, redirect
      window.location.href = "js/welcome.html";
    } catch (err) {
      console.error("Login error:", err);
      alert("❌ " + err.message);
    }
  });
});
