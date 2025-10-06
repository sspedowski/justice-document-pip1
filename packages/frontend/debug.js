const form = document.getElementById("loginForm");
form.onsubmit = async (e) => {
  e.preventDefault();
  document.getElementById("msg").textContent = "";
  const username = document.getElementById("user").value.trim();
  const password = document.getElementById("pass").value;
  try {
    if (typeof authFetch === 'undefined') {
      const mod = await import('./src/lib/auth-fetch.js');
      window.authFetch = mod.authFetch;
    }
    const res = await authFetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("msg").textContent = "✅ Login successful!";
      setTimeout(() => (window.location.href = "/"), 1000);
    } else {
      document.getElementById("msg").textContent =
        data.error || "Login failed.";
    }
  } catch (err) {
    document.getElementById("msg").textContent = "Server error.";
  }
};
