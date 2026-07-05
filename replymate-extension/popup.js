const API_BASE = "http://localhost:5000/api";

const loginView = document.getElementById("loginView");
const loggedInView = document.getElementById("loggedInView");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const errorMsg = document.getElementById("errorMsg");
const userEmailSpan = document.getElementById("userEmail");

const init = async () => {
  const stored = await chrome.storage.local.get(["token", "userEmail"]);
  if (stored.token) {
    showLoggedInView(stored.userEmail);
  }
};

const showLoggedInView = (email) => {
  loginView.classList.add("hidden");
  loggedInView.classList.remove("hidden");
  userEmailSpan.textContent = email || "";
};

const showError = (message) => {
  errorMsg.textContent = message;
};

const authenticate = async (endpoint) => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError("Enter both email and password");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      showError(data.message || "Something went wrong");
      return;
    }

    await chrome.storage.local.set({
      token: data.data.token,
      userEmail: data.data.user.email,
    });

    showLoggedInView(data.data.user.email);
    errorMsg.textContent = "";
  } catch (error) {
    showError("Could not reach ReplyMate server");
    console.error("Auth error:", error);
  }
};

document.getElementById("loginBtn").addEventListener("click", () => authenticate("login"));
document.getElementById("signupBtn").addEventListener("click", () => authenticate("signup"));

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await chrome.storage.local.remove(["token", "userEmail"]);
  loggedInView.classList.add("hidden");
  loginView.classList.remove("hidden");
  emailInput.value = "";
  passwordInput.value = "";
});

init();