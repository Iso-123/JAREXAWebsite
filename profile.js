
import { db } from "./firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// =====================================
// JAREXA PUBLIC PROFILE
// =====================================

const $ = id => document.getElementById(id);

const profileCard = $("publicProfile");
const profileStatus = $("profileStatus");

const avatar = $("publicAvatar");
const username = $("publicUsername");
const bio = $("publicBio");
const locationText = $("publicLocation");
const socials = $("publicSocials");

const favouriteSong = $("favouriteSong");
const songTitle = $("songTitle");
const songArtist = $("songArtist");
const songLink = $("songLink");
const albumCover = $("jarexaAlbumCover");
const fallbackIcon = $("songFallbackIcon");

const viewsContainer = $("profileViews");
const viewsCount = $("profileViewsCount");

const DEFAULT_AVATAR =
  "https://placehold.co/120x120/181825/ffffff?text=J";

const VIEWS_API =
  "https://jarexa-views-api.joshmaro265.workers.dev/views";

// =====================================
// STATUS
// =====================================

function showStatus(message) {
  profileStatus.textContent = message;
  profileStatus.hidden = false;
}

// =====================================
// SAFE URL VALIDATION
// =====================================

function safeURL(value, allowedHosts) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password
    ) {
      return null;
    }

    const hostname = url.hostname.toLowerCase();

    const validHost = allowedHosts.some(host =>
      hostname === host ||
      hostname.endsWith("." + host)
    );

    return validHost ? url.href : null;

  } catch {
    return null;
  }
}

function safeImageURL(value) {
  return safeURL(value, [
    "res.cloudinary.com",
    "placehold.co"
  ]);
}

// =====================================
// SOCIAL ICONS
// =====================================

const socialIcons = {
  discord: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 5.3a18 18 0 0 0-4.4-1.4l-.5 1a16 16 0 0 0-5.2 0l-.5-1a18 18 0 0 0-4.4 1.4C1.7 9.5 1 13.6 1.4 17.6a18 18 0 0 0 5.4 2.7l1.2-2a11 11 0 0 1-1.8-.9l.4-.3a13 13 0 0 0 11 0l.4.3a11 11 0 0 1-1.8.9l1.2 2a18 18 0 0 0 5.4-2.7c.5-4.7-.8-8.8-3.3-12.3ZM8.8 14.7c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.4 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z"/></svg>`,

  roblox: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.2 1.5 22.5 5.2 18.8 22.5 1.5 18.8 5.2 1.5Zm4.2 6.2-1.4 6.5 6.5 1.4 1.4-6.5-6.5-1.4Z"/></svg>`,

  instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.5-3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"/></svg>`,

  tiktok: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 7.2a6.8 6.8 0 0 1-4.2-1.4v8.1a6 6 0 1 1-6-6 6 6 0 0 1 1.1.1v3.4a2.7 2.7 0 1 0 1.8 2.5V2h3.1a6.2 6.2 0 0 0 4.2 4.1v3.2Z"/></svg>`,

  facebook: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8.9h3l.5-3.5h-3.5V7.4c0-1 .3-1.7 1.8-1.7h1.9V2.6a25 25 0 0 0-2.8-.1c-2.8 0-4.7 1.7-4.7 4.8v2.3H6.5v3.5h3.2V22h3.8Z"/></svg>`
};

function addSocialButton(label, value, hosts, icon) {
  const url = safeURL(value, hosts);

  if (!url) return;

  const button = document.createElement("a");

  button.href = url;
  button.target = "_blank";
  button.rel = "noopener noreferrer";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = icon;

  socials.appendChild(button);
}

function renderSocials(profile) {
  socials.replaceChildren();

  addSocialButton(
    "Discord",
    profile.discord,
    ["discord.gg", "discord.com"],
    socialIcons.discord
  );

  addSocialButton(
    "Roblox",
    profile.roblox,
    ["roblox.com"],
    socialIcons.roblox
  );

  addSocialButton(
    "Instagram",
    profile.instagram,
    ["instagram.com"],
    socialIcons.instagram
  );

  addSocialButton(
    "TikTok",
    profile.tiktok,
    ["tiktok.com"],
    socialIcons.tiktok
  );

  addSocialButton(
    "Facebook",
    profile.facebook,
    ["facebook.com", "fb.com", "fb.me"],
    socialIcons.facebook
  );
}

// =====================================
// FAVOURITE SONG + ALBUM COVER
// =====================================

function renderFavouriteSong(profile) {
  const title =
    typeof profile.songTitle === "string"
      ? profile.songTitle.trim()
      : "";

  const artist =
    typeof profile.songArtist === "string"
      ? profile.songArtist.trim()
      : "";

  const url = safeURL(profile.songURL, [
    "youtube.com",
    "youtu.be",
    "open.spotify.com"
  ]);

  const coverURL = safeImageURL(profile.songCover);

  if (!title && !artist && !url && !coverURL) {
    favouriteSong.hidden = true;
    return;
  }

  favouriteSong.hidden = false;

  songTitle.textContent = title || "Favourite Song";
  songArtist.textContent = artist;

  if (coverURL) {
    albumCover.src = coverURL;
    albumCover.hidden = false;
    fallbackIcon.hidden = true;

    albumCover.onerror = () => {
      albumCover.onerror = null;
      albumCover.hidden = true;
      fallbackIcon.hidden = false;
    };

  } else {
    albumCover.removeAttribute("src");
    albumCover.hidden = true;
    fallbackIcon.hidden = false;
  }

  if (url) {
    songLink.href = url;
    songLink.hidden = false;
  } else {
    songLink.hidden = true;
    songLink.removeAttribute("href");
  }
}

// =====================================
// PROFILE VIEWS
// =====================================

function showViews(count) {
  if (
    !Number.isSafeInteger(count) ||
    count < 0
  ) {
    return;
  }

  if (viewsCount) {
    viewsCount.textContent =
      count.toLocaleString("en-US");
  }

  if (viewsContainer) {
    viewsContainer.hidden = false;
  }
}

async function loadProfileViews(uid) {
  try {
    const response = await fetch(VIEWS_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uid })
    });

    if (!response.ok) {
      throw new Error(
        `Views API returned ${response.status}`
      );
    }

    const data = await response.json();

    showViews(data.views);

  } catch (error) {
    console.error("Profile views error:", error);

    if (viewsCount) {
      viewsCount.textContent = "—";
    }
  }
}

// =====================================
// BACKGROUND CUSTOMIZATION
// =====================================

function applyBackground(profile) {
  const backgroundURL = safeImageURL(profile.background);

  const savedOverlay = Number(profile.backgroundOverlay);

  const overlayValue = Number.isFinite(savedOverlay)
    ? Math.min(100, Math.max(0, savedOverlay))
    : 8;

  const overlayOpacity = overlayValue / 100;

  document.documentElement.style.setProperty(
    "--background-overlay",
    overlayOpacity.toString()
  );

  if (backgroundURL) {
    document.body.style.backgroundImage =
      `linear-gradient(
        rgba(0, 0, 0, var(--background-overlay)),
        rgba(0, 0, 0, var(--background-overlay))
      ), url("${backgroundURL}")`;
  } else {
    document.body.style.backgroundImage = "none";
  }
}

// =====================================
// RENDER PROFILE
// =====================================

function renderProfile(profile) {
  const name =
    typeof profile.username === "string"
      ? profile.username.trim()
      : "";

  if (!name) {
    throw new Error("Invalid profile data.");
  }

  username.textContent = name;

  bio.textContent =
    typeof profile.bio === "string"
      ? profile.bio
      : "";

  const location =
    typeof profile.location === "string"
      ? profile.location.trim()
      : "";

  if (locationText) {
    locationText.textContent =
      location ? `📍 ${location}` : "";

    locationText.hidden = !location;
  }

  const avatarURL = safeImageURL(profile.avatar);

  avatar.src = avatarURL || DEFAULT_AVATAR;
  avatar.hidden = false;

  avatar.onerror = () => {
    avatar.onerror = null;
    avatar.src = DEFAULT_AVATAR;
  };

  applyBackground(profile);

  renderSocials(profile);
  renderFavouriteSong(profile);

  profileStatus.hidden = true;

  document.title = `${name} — JAREXA`;
}

// =====================================
// RESOLVE PROFILE UID
// =====================================

function resolveProfileUID() {
  const params = new URLSearchParams(
    window.location.search
  );

  const uid = params.get("uid")?.trim();

  if (
    !uid ||
    !/^[a-zA-Z0-9]{1,128}$/.test(uid)
  ) {
    throw new Error("Invalid profile link.");
  }

  return uid;
}

// =====================================
// LOAD PUBLIC PROFILE
// =====================================

async function loadPublicProfile() {
  showStatus("Loading profile...");

  try {
    const uid = resolveProfileUID();

    const profileRef = doc(
      db,
      "publicProfiles",
      uid
    );

    const snapshot = await getDoc(profileRef);

    if (!snapshot.exists()) {
      showStatus(
        "This public profile does not exist yet."
      );
      return;
    }

    renderProfile(snapshot.data());

    await loadProfileViews(uid);

  } catch (error) {
    console.error(
      "JAREXA public profile error:",
      error
    );

    if (error.code === "permission-denied") {
      showStatus(
        "Unable to access this profile. Check Firebase permissions."
      );
      return;
    }

    if (error.message === "Invalid profile link.") {
      showStatus("Invalid profile link.");
      return;
    }

    if (error.message === "Invalid profile data.") {
      showStatus("Invalid profile data.");
      return;
    }

    showStatus(
      "Could not load this profile. Please try again later."
    );
  }
}

// =====================================
// START
// =====================================

loadPublicProfile();