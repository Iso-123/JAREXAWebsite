import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
  doc,
  getDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// ======================================
// JAREXA DASHBOARD - GITHUB PAGES
// ======================================

const UPLOAD_API =
  "https://vex-upload-api.joshmaro265.workers.dev/upload";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const DEFAULT_AVATAR =
  "https://placehold.co/120x120/181825/ffffff?text=J";

const $ = id => document.getElementById(id);

// ======================================
// ELEMENTS
// ======================================

const accountEmail = $("accountEmail");
const logoutBtn = $("dashboardLogout");
const profileForm = $("profileForm");
const saveMessage = $("saveMessage");

const usernameInput = $("profileUsername");
const bioInput = $("profileBio");

const avatarInput = $("profileAvatar");
const backgroundInput = $("profileBackground");
const songCoverInput = $("profileSongCover");
const songCoverPreview = $("albumCoverPreview");
const songCoverPreviewContainer = $("albumCoverPreviewContainer");

const robloxInput = $("profileRoblox");
const facebookInput = $("profileFacebook");
const instagramInput = $("profileInstagram");
const discordInput = $("profileDiscord");
const tiktokInput = $("profileTikTok");
const locationInput = $("profileLocation");

const songTitleInput = $("profileSongTitle");
const songArtistInput = $("profileSongArtist");
const songURLInput = $("profileSongURL");

const colorInput = $("profileColor");

// Background darkness controls
const backgroundOverlayInput = $("profileBackgroundOverlay");
const backgroundOverlayValue = $("backgroundOverlayValue");

const previewUsername = $("previewUsername");
const previewBio = $("previewBio");
const previewAvatar = $("previewAvatar");
const profilePreview = $("profilePreview");

const publicProfileLink = $("publicProfileLink");
const generateLinkBtn = $("generateProfileLink");
const copyLinkBtn = $("copyProfileLink");
const linkMessage = $("linkMessage");

// ======================================
// STATE
// ======================================

let currentUser = null;
let profileLoaded = false;
let profilePublished = false;
let hasUnsavedChanges = false;

let savedAvatar = "";
let savedBackground = "";
let savedSongCover = "";
let savedBackgroundOverlay = 45;

let temporaryAvatarURL = null;
let temporaryBackgroundURL = null;
let temporarySongCoverURL = null;

// ======================================
// PROFILE LINK
// ======================================

function getProfileURL(uid) {
  const url = new URL(
    "./profile.html",
    window.location.href
  );

  url.searchParams.set("uid", uid);

  return url.href;
}

function resetProfileLink() {
  publicProfileLink.value = "";
  copyLinkBtn.disabled = true;
  linkMessage.textContent = "";
}

function updateProfileLink() {
  if (!currentUser || !profileLoaded || !profilePublished) {
    resetProfileLink();
    return;
  }

  publicProfileLink.value = getProfileURL(currentUser.uid);
  copyLinkBtn.disabled = false;
}

function markUnsaved() {
  hasUnsavedChanges = true;
  updateProfileLink();

  if (profilePublished) {
    linkMessage.textContent =
      "Your link still works. Save Profile to publish your latest changes.";
  }
}

generateLinkBtn.addEventListener("click", () => {
  if (!currentUser || !profileLoaded) {
    linkMessage.textContent =
      "Please wait for your account to load.";
    return;
  }

  if (!profilePublished) {
    linkMessage.textContent =
      "Save and publish your profile first.";
    return;
  }

  updateProfileLink();

  linkMessage.textContent = hasUnsavedChanges
    ? "Your existing profile link is ready. Unsaved edits are not public yet."
    : "Your shareable profile link is ready!";
});

// ======================================
// COPY PROFILE LINK
// ======================================

copyLinkBtn.addEventListener("click", async () => {
  const link = publicProfileLink.value;

  if (!link) {
    linkMessage.textContent =
      "Generate your link first.";
    return;
  }

  try {
    await navigator.clipboard.writeText(link);

    linkMessage.textContent =
      "Profile link copied!";

  } catch (error) {
    console.error(error);

    publicProfileLink.focus();
    publicProfileLink.select();

    linkMessage.textContent =
      "Copy the selected link manually.";
  }
});

// ======================================
// FORM HELPERS
// ======================================

function setFormDisabled(disabled) {
  profileForm
    .querySelectorAll("input, textarea, button")
    .forEach(element => {
      element.disabled = disabled;
    });
}

function clearTemporaryPreviews() {
  if (temporaryAvatarURL) {
    URL.revokeObjectURL(temporaryAvatarURL);
    temporaryAvatarURL = null;
  }

  if (temporaryBackgroundURL) {
    URL.revokeObjectURL(temporaryBackgroundURL);
    temporaryBackgroundURL = null;
  }

  if (temporarySongCoverURL) {
    URL.revokeObjectURL(temporarySongCoverURL);
    temporarySongCoverURL = null;
  }

  avatarInput.value = "";
  backgroundInput.value = "";

  if (songCoverInput) {
    songCoverInput.value = "";
  }
}

// ======================================
// LIVE PROFILE PREVIEW
// ======================================

function updateSongCoverPreview() {
  if (!songCoverPreview || !songCoverPreviewContainer) return;

  const url = temporarySongCoverURL || savedSongCover;

  if (url) {
    songCoverPreview.src = url;
    songCoverPreviewContainer.hidden = false;
  } else {
    songCoverPreview.removeAttribute("src");
    songCoverPreviewContainer.hidden = true;
  }
}

function updatePreview() {
  updateSongCoverPreview();

  const username = usernameInput.value.trim();
  const bio = bioInput.value.trim();
  const color = colorInput.value;

  previewUsername.textContent =
    username || "Your Username";

  previewBio.textContent =
    bio || "Your bio will appear here.";

  previewUsername.style.color = color;
  previewAvatar.style.borderColor = color;
  profilePreview.style.borderColor = color;

  previewAvatar.src =
    temporaryAvatarURL ||
    savedAvatar ||
    DEFAULT_AVATAR;

  const background =
    temporaryBackgroundURL || savedBackground;

  const overlayValue = Number(backgroundOverlayInput.value);
  const safeOverlay = Number.isFinite(overlayValue)
    ? Math.min(100, Math.max(0, overlayValue))
    : 45;

  backgroundOverlayValue.textContent =
    `${safeOverlay}%`;

  const overlay = safeOverlay / 100;

  if (background) {
    profilePreview.style.backgroundImage =
      `linear-gradient(
        rgba(10, 5, 20, ${overlay}),
        rgba(10, 5, 20, ${overlay})
      ), url("${background}")`;

    profilePreview.style.backgroundSize = "cover";
    profilePreview.style.backgroundPosition = "center";
    profilePreview.style.backgroundRepeat = "no-repeat";

  } else {
    profilePreview.style.backgroundImage = "";
  }
}

previewAvatar.addEventListener("error", () => {
  if (previewAvatar.src !== DEFAULT_AVATAR) {
    previewAvatar.src = DEFAULT_AVATAR;
  }
});

// ======================================
// IMAGE VALIDATION
// ======================================

function validateImage(file) {
  if (!file) {
    return "Please choose an image.";
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Only JPG, PNG and WebP images are allowed.";
  }

  if (
    file.size === 0 ||
    file.size > MAX_IMAGE_SIZE
  ) {
    return "Image must be under 5 MB.";
  }

  return null;
}

function handleImageSelection(input, kind) {
  input.addEventListener("change", () => {
    const file = input.files[0];

    if (kind === "avatar" && temporaryAvatarURL) {
      URL.revokeObjectURL(temporaryAvatarURL);
      temporaryAvatarURL = null;
    }

    if (
      kind === "background" &&
      temporaryBackgroundURL
    ) {
      URL.revokeObjectURL(temporaryBackgroundURL);
      temporaryBackgroundURL = null;
    }

    if (!file) {
      updatePreview();
      return;
    }

    const error = validateImage(file);

    if (error) {
      input.value = "";
      saveMessage.textContent = error;
      updatePreview();
      return;
    }

    const objectURL = URL.createObjectURL(file);

    if (kind === "avatar") {
      temporaryAvatarURL = objectURL;
    } else {
      temporaryBackgroundURL = objectURL;
    }

    markUnsaved();
    updatePreview();

    saveMessage.textContent =
      "Image preview ready. Click Save Profile.";
  });
}

handleImageSelection(avatarInput, "avatar");
handleImageSelection(backgroundInput, "background");

// ======================================
// CUSTOM ALBUM COVER PREVIEW
// ======================================

if (songCoverInput) {
  songCoverInput.addEventListener("change", () => {
    if (temporarySongCoverURL) {
      URL.revokeObjectURL(temporarySongCoverURL);
      temporarySongCoverURL = null;
    }

    const file = songCoverInput.files[0];

    if (!file) {
      updateSongCoverPreview();
      return;
    }

    const error = validateImage(file);

    if (error) {
      songCoverInput.value = "";
      saveMessage.textContent = error;
      updateSongCoverPreview();
      return;
    }

    temporarySongCoverURL = URL.createObjectURL(file);

    markUnsaved();
    updateSongCoverPreview();

    saveMessage.textContent =
      "Album cover preview ready. Click Save Profile.";
  });
}

// ======================================
// INPUT EVENTS
// ======================================

profileForm
  .querySelectorAll(
    'input:not([type="file"]), textarea'
  )
  .forEach(input => {
    input.addEventListener("input", () => {
      markUnsaved();
      updatePreview();
    });

    input.addEventListener("change", () => {
      markUnsaved();
      updatePreview();
    });
  });

// ======================================
// IMAGE UPLOAD
// ======================================

async function uploadImage(file, user, kind) {
  const token = await user.getIdToken();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("kind", kind);

  const response = await fetch(UPLOAD_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Invalid response from image upload server."
    );
  }

  if (!response.ok) {
    throw new Error(
      result.error || "Image upload failed."
    );
  }

  if (
    typeof result.imageUrl !== "string" ||
    !result.imageUrl.startsWith("https://") ||
    result.kind !== kind
  ) {
    throw new Error("Invalid upload response.");
  }

  return result.imageUrl;
}

// ======================================
// URL VALIDATION
// ======================================

function validateOptionalURL(value, label) {
  if (!value) return "";

  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      throw new Error("Invalid URL");
    }

    return url.href;

  } catch {
    throw new Error(
      `${label} must be a valid HTTPS link.`
    );
  }
}

function validateSongURL(value) {
  if (!value) return "";

  const url = new URL(
    validateOptionalURL(value, "Favourite Song")
  );

  const allowedHosts = [
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
    "open.spotify.com"
  ];

  if (!allowedHosts.includes(
    url.hostname.toLowerCase()
  )) {
    throw new Error(
      "Song link must be from YouTube, YouTube Music, or Spotify."
    );
  }

  return url.href;
}

// ======================================
// LOAD PROFILE FROM FIREBASE
// ======================================

setFormDisabled(true);
resetProfileLink();
updatePreview();

onAuthStateChanged(auth, async user => {
  currentUser = user;
  profileLoaded = false;
  profilePublished = false;
  hasUnsavedChanges = false;

  setFormDisabled(true);
  resetProfileLink();

  if (!user) {
    window.location.replace("./index.html");
    return;
  }

  accountEmail.textContent =
    user.email || "My Account";

  saveMessage.textContent =
    "Loading your JAREXA profile...";

  try {
    const privateRef = doc(
      db,
      "profiles",
      user.uid
    );

    const publicRef = doc(
      db,
      "publicProfiles",
      user.uid
    );

    const [
      privateSnapshot,
      publicSnapshot
    ] = await Promise.all([
      getDoc(privateRef),
      getDoc(publicRef)
    ]);

    if (auth.currentUser?.uid !== user.uid) {
      return;
    }

    // Reset inputs
    usernameInput.value = "";
    bioInput.value = "";

    robloxInput.value = "";
    facebookInput.value = "";
    instagramInput.value = "";
    discordInput.value = "";
    tiktokInput.value = "";
    locationInput.value = "";

    songTitleInput.value = "";
    songArtistInput.value = "";
    songURLInput.value = "";

    colorInput.value = "#9333ea";

    savedAvatar = "";
    savedBackground = "";
    savedSongCover = "";

    savedBackgroundOverlay = 45;
    backgroundOverlayInput.value = "45";

    // Load existing saved profile
    if (privateSnapshot.exists()) {
      const profile = privateSnapshot.data();

      usernameInput.value =
        profile.username || "";

      bioInput.value =
        profile.bio || "";

      robloxInput.value =
        profile.roblox || "";

      facebookInput.value =
        profile.facebook || "";

      instagramInput.value =
        profile.instagram || "";

      discordInput.value =
        profile.discord || "";

      tiktokInput.value =
        profile.tiktok || "";

      locationInput.value =
        profile.location || "";

      songTitleInput.value =
        profile.songTitle || "";

      songArtistInput.value =
        profile.songArtist || "";

      songURLInput.value =
        profile.songURL || "";

      colorInput.value =
        /^#[0-9a-fA-F]{6}$/.test(profile.color || "")
          ? profile.color
          : "#9333ea";

      savedAvatar = profile.avatar || "";
      savedBackground = profile.background || "";
      savedSongCover = profile.songCover || "";

      savedBackgroundOverlay =
        Number.isFinite(profile.backgroundOverlay)
          ? Math.min(100, Math.max(0, profile.backgroundOverlay))
          : 45;

      backgroundOverlayInput.value =
        String(savedBackgroundOverlay);
    }

    profilePublished = publicSnapshot.exists();

    clearTemporaryPreviews();
    updatePreview();

    profileLoaded = true;
    setFormDisabled(false);

    updateProfileLink();
    loadDashboardViewers(user.uid);

    saveMessage.textContent =
      privateSnapshot.exists()
        ? "Profile loaded!"
        : "Welcome! Create your profile.";

  } catch (error) {
    console.error("Profile load error:", error);

    saveMessage.textContent =
      "Could not load profile. Check Firestore permissions.";
  }
});

// ======================================
// SAVE AND PUBLISH PROFILE
// ======================================

profileForm.addEventListener("submit", async event => {
  event.preventDefault();

  const user = currentUser;

  if (
    !user ||
    !profileLoaded ||
    auth.currentUser?.uid !== user.uid
  ) {
    saveMessage.textContent =
      "Please wait until your profile loads.";
    return;
  }

  const username = usernameInput.value.trim();
  const bio = bioInput.value.trim();

  if (!username || username.length > 30) {
    saveMessage.textContent =
      "Username must be 1 to 30 characters.";
    return;
  }

  if (bio.length > 160) {
    saveMessage.textContent =
      "Bio must be 160 characters or less.";
    return;
  }

  const avatarFile = avatarInput.files[0];
  const backgroundFile = backgroundInput.files[0];
  const songCoverFile = songCoverInput?.files[0];

  if (avatarFile) {
    const error = validateImage(avatarFile);

    if (error) {
      saveMessage.textContent = error;
      return;
    }
  }

  if (backgroundFile) {
    const error = validateImage(backgroundFile);

    if (error) {
      saveMessage.textContent = error;
      return;
    }
  }

  if (songCoverFile) {
    const error = validateImage(songCoverFile);

    if (error) {
      saveMessage.textContent = error;
      return;
    }
  }

  let links;
  let songURL;

  try {
    links = {
      roblox: validateOptionalURL(
        robloxInput.value.trim(),
        "Roblox"
      ),

      facebook: validateOptionalURL(
        facebookInput.value.trim(),
        "Facebook"
      ),

      instagram: validateOptionalURL(
        instagramInput.value.trim(),
        "Instagram"
      ),

      discord: validateOptionalURL(
        discordInput.value.trim(),
        "Discord"
      ),

      tiktok: validateOptionalURL(
        tiktokInput.value.trim(),
        "TikTok"
      )
    };

    songURL = validateSongURL(
      songURLInput.value.trim()
    );

  } catch (error) {
    saveMessage.textContent = error.message;
    return;
  }

  setFormDisabled(true);
  generateLinkBtn.disabled = true;

  updateProfileLink();

  try {
    let avatarURL = savedAvatar;
    let backgroundURL = savedBackground;
    let songCoverURL = savedSongCover;

    // Upload avatar
    if (avatarFile) {
      saveMessage.textContent =
        "Uploading profile picture...";

      avatarURL = await uploadImage(
        avatarFile,
        user,
        "avatar"
      );
    }

    // Upload background
    if (backgroundFile) {
      saveMessage.textContent =
        "Uploading background picture...";

      backgroundURL = await uploadImage(
        backgroundFile,
        user,
        "background"
      );
    }

    // Upload album cover
    if (songCoverFile) {
      saveMessage.textContent =
        "Uploading album cover...";

      songCoverURL = await uploadImage(
        songCoverFile,
        user,
        "songCover"
      );
    }

    if (auth.currentUser?.uid !== user.uid) {
      throw new Error(
        "Session changed. Please log in again."
      );
    }

    const overlayNumber = Number(backgroundOverlayInput.value);

    const safeOverlay = Number.isFinite(overlayNumber)
      ? Math.min(100, Math.max(0, overlayNumber))
      : 45;

    const profileData = {
      username,
      bio,

      avatar: avatarURL,
      background: backgroundURL,
      songCover: songCoverURL,

      backgroundOverlay: safeOverlay,

      roblox: links.roblox,
      facebook: links.facebook,
      instagram: links.instagram,
      discord: links.discord,
      tiktok: links.tiktok,
      location: locationInput.value.trim(),

      color: colorInput.value,

      songTitle: songTitleInput.value.trim(),
      songArtist: songArtistInput.value.trim(),
      songURL
    };

    saveMessage.textContent =
      "Saving and publishing your profile...";

    const batch = writeBatch(db);

    batch.set(
      doc(db, "profiles", user.uid),
      profileData
    );

    batch.set(
      doc(db, "publicProfiles", user.uid),
      { ...profileData }
    );

    await batch.commit();

    savedAvatar = avatarURL;
    savedBackground = backgroundURL;
    savedSongCover = songCoverURL;
    savedBackgroundOverlay = safeOverlay;

    profilePublished = true;
    hasUnsavedChanges = false;

    clearTemporaryPreviews();
    updatePreview();

    saveMessage.textContent =
      "Profile saved and published successfully!";

    updateProfileLink();

  } catch (error) {
    console.error("Profile save error:", error);

    updateProfileLink();

    saveMessage.textContent =
      error.code === "permission-denied"
        ? "Firestore permission denied. Check your security rules."
        : error.message || "Failed to save profile.";

  } finally {
    generateLinkBtn.disabled = false;

    if (
      auth.currentUser?.uid === user.uid &&
      profileLoaded
    ) {
      setFormDisabled(false);
    }
  }
});

// ======================================
// LOGOUT
// ======================================

logoutBtn.addEventListener("click", async () => {
  logoutBtn.disabled = true;
  logoutBtn.textContent = "Logging out...";

  try {
    await signOut(auth);

    window.location.replace("./index.html");

  } catch (error) {
    console.error("Logout error:", error);

    alert("Logout failed. Please try again.");

    logoutBtn.disabled = false;
    logoutBtn.textContent = "Logout";
  }
});

// ======================================
// CLEANUP
// ======================================

window.addEventListener("pagehide", () => {
  if (temporaryAvatarURL) {
    URL.revokeObjectURL(temporaryAvatarURL);
  }

  if (temporaryBackgroundURL) {
    URL.revokeObjectURL(temporaryBackgroundURL);
  }

  if (temporarySongCoverURL) {
    URL.revokeObjectURL(temporarySongCoverURL);
  }
});

// ======================================
// JAREXA PROFILE VIEWERS PANEL
// ======================================

const VIEWS_API =
  "https://jarexa-views-api.joshmaro265.workers.dev/views";

function createViewersPanel() {
  let panel = document.getElementById("jarexaViewersPanel");

  if (panel) return panel;

  const style = document.createElement("style");

  style.textContent = `
    #jarexaViewersPanel {
      margin: 24px 0;
      padding: 24px;
      border-radius: 18px;
      background: #15111f;
      border: 1px solid #49315f;
      color: #f5edff;
      box-shadow: 0 8px 30px rgba(0,0,0,.15);
    }

    #jarexaViewersPanel h2 {
      margin: 0 0 8px;
      font-size: 22px;
    }

    #jarexaViewersPanel .viewers-description {
      color: #bcaecb;
      margin: 0 0 18px;
    }

    #jarexaViewersPanel .viewers-total {
      background: #21172d;
      border: 1px solid #5d397d;
      padding: 18px;
      border-radius: 12px;
      margin-bottom: 20px;
    }

    #jarexaViewersPanel .viewers-total span {
      display: block;
      color: #bcaecb;
      font-size: 13px;
    }

    #jarexaViewersPanel .viewers-total strong {
      display: block;
      color: #c084fc;
      font-size: 32px;
      margin-top: 5px;
    }

    #jarexaViewersPanel h3 {
      margin: 0 0 12px;
      font-size: 17px;
    }

    #jarexaViewersPanel .viewers-list {
      color: #bcaecb;
      font-size: 14px;
    }

    #jarexaViewersPanel .viewer-entry {
      padding: 12px 0;
      border-bottom: 1px solid #40314e;
      color: #f5edff;
    }
  `;

  document.head.appendChild(style);

  panel = document.createElement("section");
  panel.id = "jarexaViewersPanel";
  panel.setAttribute("aria-label", "Profile viewers");

  const title = document.createElement("h2");
  title.textContent = "👁 Profile Viewers";

  const description = document.createElement("p");
  description.className = "viewers-description";
  description.textContent = "Your JAREXA profile activity.";

  const stat = document.createElement("div");
  stat.className = "viewers-total";

  const statLabel = document.createElement("span");
  statLabel.textContent = "Total Profile Views";

  const statValue = document.createElement("strong");
  statValue.id = "jarexaTotalViews";
  statValue.textContent = "—";

  stat.append(statLabel, statValue);

  const recentTitle = document.createElement("h3");
  recentTitle.textContent = "Recent Viewers";

  const recentList = document.createElement("div");
  recentList.className = "viewers-list";
  recentList.id = "jarexaRecentViewers";
  recentList.textContent = "Loading viewer information...";

  panel.append(
    title,
    description,
    stat,
    recentTitle,
    recentList
  );

  const main = document.querySelector("main");

  if (main) {
    main.appendChild(panel);
  } else {
    document.body.appendChild(panel);
  }

  return panel;
}

async function loadDashboardViewers(uid) {
  createViewersPanel();

  const count = document.getElementById("jarexaTotalViews");
  const list = document.getElementById("jarexaRecentViewers");

  count.textContent = "—";
  list.textContent = "Loading viewer information...";

  try {
    // GET only reads the count; it must not increment visits.
    const url = new URL(VIEWS_API);
    url.searchParams.set("uid", uid);

    const response = await fetch(url.href, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error("Views API GET is not available.");
    }

    const data = await response.json();

    if (auth.currentUser?.uid !== uid) return;

    if (
      Number.isSafeInteger(data.views) &&
      data.views >= 0
    ) {
      count.textContent =
        data.views.toLocaleString("en-US");
    }

    list.replaceChildren();

    // Show only viewer records deliberately supplied by the server.
    if (Array.isArray(data.viewers)) {
      for (const viewer of data.viewers.slice(0, 10)) {
        if (
          !viewer ||
          typeof viewer.username !== "string" ||
          !viewer.username.trim()
        ) {
          continue;
        }

        const entry = document.createElement("div");
        entry.className = "viewer-entry";
        entry.textContent = viewer.username.trim();

        list.appendChild(entry);
      }
    }

    if (!list.children.length) {
      list.textContent =
        "No identified viewers recorded yet.";
    }

  } catch (error) {
    console.error("Profile viewers:", error);

    count.textContent = "—";

    list.textContent =
      "Viewer data isn't available yet. The views Worker needs a read-only dashboard endpoint.";
  }
}