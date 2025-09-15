// public/js/register.js
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    // ✅ Encrypt password with Caesar cipher (same shift as backend)
    const encryptedPassword = caesarEncrypt(password, 7);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ensures session cookie is set
        body: JSON.stringify({ email, password: encryptedPassword }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Registration failed");
      }

      alert("✅ Registration successful! Please log in.");
      window.location.href = "login.html";
    } catch (err) {
      console.error("Registration error:", err);
      alert("❌ " + err.message);
    }
  });
});
