
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
const socials = $("publicSocials");

const favouriteSong = $("favouriteSong");
const songTitle = $("songTitle");
const songArtist = $("songArtist");
const songLink = $("songLink");

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
// SOCIAL BUTTONS
// =====================================

function addSocialButton(label, value, hosts) {
  const url = safeURL(value, hosts);

  if (!url) return;

  const button = document.createElement("a");

  button.href = url;
  button.target = "_blank";
  button.rel = "noopener noreferrer";
  button.textContent = label;

  socials.appendChild(button);
}

function renderSocials(profile) {
  socials.replaceChildren();

  addSocialButton(
    "Instagram",
    profile.instagram,
    ["instagram.com"]
  );

  addSocialButton(
    "Facebook",
    profile.facebook,
    ["facebook.com", "fb.com", "fb.me"]
  );

  addSocialButton(
    "Roblox",
    profile.roblox,
    ["roblox.com"]
  );

  addSocialButton(
    "Discord Server",
    profile.discord,
    ["discord.gg", "discord.com"]
  );
}

// =====================================
// FAVOURITE SONG + CUSTOM ALBUM COVER
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

  // Keep the existing music icon as fallback.
  const songIcon = favouriteSong.querySelector(".song-icon");
  const songInfo = favouriteSong.querySelector(".song-info");

  // Remove a previously generated cover if present.
  const previousCover = $("jarexaAlbumCover");

  if (previousCover) {
    previousCover.remove();
  }

  if (songIcon) {
    songIcon.hidden = false;
  }

  if (coverURL && songInfo) {
    const cover = document.createElement("img");

    cover.id = "jarexaAlbumCover";
    cover.alt = "Album cover";
    cover.width = 60;
    cover.height = 60;
    cover.hidden = true;

    // Match the existing blue music icon design.
    cover.style.width = "60px";
    cover.style.height = "60px";
    cover.style.flexShrink = "0";
    cover.style.objectFit = "cover";
    cover.style.borderRadius = "15px";
    cover.style.boxShadow =
      "0 0 20px rgba(49, 85, 255, 0.3)";

    cover.onload = () => {
      cover.hidden = false;

      if (songIcon) {
        songIcon.hidden = true;
      }
    };

    cover.onerror = () => {
      cover.hidden = true;

      if (songIcon) {
        songIcon.hidden = false;
      }
    };

    if (songIcon) {
      songIcon.insertAdjacentElement("beforebegin", cover);
    } else {
      songInfo.prepend(cover);
    }

    cover.src = coverURL;
  }

  // Preserve the original music link.
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

  const color =
    typeof profile.color === "string" &&
    /^#[0-9a-fA-F]{6}$/.test(profile.color)
      ? profile.color
      : "#9333ea";

  profileCard.style.setProperty("--accent", color);

  username.textContent = name;

  bio.textContent =
    typeof profile.bio === "string"
      ? profile.bio
      : "";

  const avatarURL = safeImageURL(profile.avatar);

  avatar.src = avatarURL || DEFAULT_AVATAR;
  avatar.hidden = false;

  avatar.onerror = () => {
    avatar.onerror = null;
    avatar.src = DEFAULT_AVATAR;
  };

  const backgroundURL =
    safeImageURL(profile.background);

  if (backgroundURL) {
    profileCard.style.backgroundImage =
      `linear-gradient(
        rgba(10, 5, 20, 0.35),
        rgba(10, 5, 20, 0.7)
      ), url("${backgroundURL}")`;

    profileCard.style.backgroundSize = "cover";
    profileCard.style.backgroundPosition = "center";
    profileCard.style.backgroundRepeat = "no-repeat";

  } else {
    profileCard.style.backgroundImage = "none";
  }

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