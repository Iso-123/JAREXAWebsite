
import { auth } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// ======================================
// JAREXA AUTHENTICATION SYSTEM
// GITHUB PAGES VERSION
// ======================================

const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const getStartedBtn = document.getElementById("getStartedBtn");

// ======================================
// CREATE LOGIN / SIGNUP MODAL
// ======================================

const modal = document.createElement("div");

modal.className = "auth-modal";
modal.setAttribute("role", "dialog");
modal.setAttribute("aria-modal", "true");
modal.setAttribute("aria-labelledby", "authTitle");

modal.innerHTML = `
  <div class="auth-box">

    <button
      class="close-modal"
      type="button"
      aria-label="Close"
    >&times;</button>

    <h2 id="authTitle">Create Account</h2>

    <p>Welcome to JAREXA</p>

    <form id="authForm">

      <input
        type="email"
        id="email"
        placeholder="Email Address"
        autocomplete="email"
        required
      >

      <div class="password-wrapper">

        <input
          type="password"
          id="password"
          placeholder="Password"
          minlength="8"
          autocomplete="new-password"
          required
        >

        <button
          type="button"
          id="togglePassword"
          class="toggle-password"
          aria-label="Show password"
          aria-pressed="false"
          title="Show password"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
            <circle cx="12" cy="12" r="3"/>
            <path id="eyeSlash" d="M3 3l18 18" hidden/>
          </svg>
        </button>

      </div>

      <button
        type="submit"
        id="authSubmit"
      >
        Sign Up
      </button>

    </form>

    <p id="authMessage" role="status"></p>

  </div>
`;

document.body.appendChild(modal);

// ======================================
// ELEMENTS
// ======================================

const authTitle = document.getElementById("authTitle");
const authSubmit = document.getElementById("authSubmit");
const authForm = document.getElementById("authForm");
const authMessage = document.getElementById("authMessage");

const passwordInput = document.getElementById("password");
const emailInput = document.getElementById("email");

const closeModalBtn = modal.querySelector(".close-modal");
const togglePassword = document.getElementById("togglePassword");
const eyeSlash = document.getElementById("eyeSlash");

// ======================================
// STATE
// ======================================

let authMode = "signup";
let currentUser = null;
let authReady = false;

// ======================================
// SHOW / HIDE PASSWORD
// ======================================

function setPasswordVisible(visible) {
  passwordInput.type =
    visible ? "text" : "password";

  togglePassword.setAttribute(
    "aria-label",
    visible ? "Hide password" : "Show password"
  );

  togglePassword.setAttribute(
    "aria-pressed",
    String(visible)
  );

  togglePassword.title =
    visible ? "Hide password" : "Show password";

  eyeSlash.hidden = !visible;
}

togglePassword.addEventListener("click", () => {
  const isHidden =
    passwordInput.type === "password";

  setPasswordVisible(isHidden);
});

setPasswordVisible(false);

// ======================================
// OPEN AUTH MODAL
// ======================================

function openAuth(mode) {
  authMode = mode;

  authTitle.textContent =
    mode === "login"
      ? "Welcome Back"
      : "Create Account";

  authSubmit.textContent =
    mode === "login"
      ? "Login"
      : "Sign Up";

  passwordInput.autocomplete =
    mode === "login"
      ? "current-password"
      : "new-password";

  authMessage.textContent = "";
  authForm.reset();

  setPasswordVisible(false);

  modal.classList.add("active");

  emailInput.focus();
}

// ======================================
// CLOSE AUTH MODAL
// ======================================

function closeAuth() {
  modal.classList.remove("active");

  authForm.reset();
  authMessage.textContent = "";

  setPasswordVisible(false);
}

closeModalBtn.addEventListener(
  "click",
  closeAuth
);

modal.addEventListener("click", event => {
  if (event.target === modal) {
    closeAuth();
  }
});

document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    modal.classList.contains("active")
  ) {
    closeAuth();
  }
});

// ======================================
// DASHBOARD REDIRECT
// ======================================

function goToDashboard() {
  window.location.href = "./dashboard.html";
}

// ======================================
// LOGIN / MY ACCOUNT
// ======================================

loginBtn.addEventListener("click", event => {
  event.preventDefault();

  if (!authReady) return;

  if (currentUser) {
    goToDashboard();
    return;
  }

  openAuth("login");
});

// ======================================
// SIGN UP / LOGOUT
// ======================================

signupBtn.addEventListener("click", async event => {
  event.preventDefault();

  if (!authReady) return;

  if (!currentUser) {
    openAuth("signup");
    return;
  }

  signupBtn.style.pointerEvents = "none";

  try {
    await signOut(auth);
    closeAuth();

  } catch (error) {
    console.error("Logout error:", error);

    alert("Logout failed. Please try again.");

  } finally {
    signupBtn.style.pointerEvents = "";
  }
});

// ======================================
// GET STARTED
// ======================================

getStartedBtn.addEventListener("click", () => {
  if (!authReady) return;

  if (currentUser) {
    goToDashboard();
    return;
  }

  openAuth("signup");
});

// ======================================
// FIREBASE LOGIN / SIGN UP
// ======================================

authForm.addEventListener("submit", async event => {
  event.preventDefault();

  if (!authReady) {
    authMessage.textContent =
      "Please wait for authentication to load.";
    return;
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  authSubmit.disabled = true;
  authSubmit.textContent = "Please wait...";
  authMessage.textContent = "";

  try {
    let result;

    if (authMode === "signup") {
      result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    } else {
      result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    }

    currentUser = result.user;

    authMessage.textContent =
      "Success! Opening your dashboard...";

    authForm.reset();
    setPasswordVisible(false);

    goToDashboard();

  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    const messages = {
      "auth/email-already-in-use":
        "This email is already registered. Please log in.",

      "auth/invalid-email":
        "Please enter a valid email address.",

      "auth/weak-password":
        "Please use a stronger password.",

      "auth/invalid-credential":
        "Incorrect email or password.",

      "auth/operation-not-allowed":
        "Email/Password authentication is not enabled.",

      "auth/unauthorized-domain":
        "This website domain is not authorized in Firebase.",

      "auth/network-request-failed":
        "Network error. Check your connection.",

      "auth/too-many-requests":
        "Too many attempts. Please try again later.",

      "auth/user-disabled":
        "This account has been disabled."
    };

    authMessage.textContent =
      messages[error.code] ||
      "Authentication failed. Please try again.";

  } finally {
    authSubmit.disabled = false;

    authSubmit.textContent =
      authMode === "signup"
        ? "Sign Up"
        : "Login";
  }
});

// ======================================
// CHECK LOGIN STATUS
// ======================================

onAuthStateChanged(auth, user => {
  currentUser = user;
  authReady = true;

  if (user) {
    loginBtn.textContent = "My Account";
    signupBtn.textContent = "Logout";
    getStartedBtn.textContent = "My Profile";

  } else {
    loginBtn.textContent = "Login";
    signupBtn.textContent = "Sign Up";
    getStartedBtn.textContent = "Get Started";
  }
});