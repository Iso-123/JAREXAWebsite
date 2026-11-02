
const RESERVED = new Set([
  "admin",
  "api",
  "dashboard",
  "login",
  "signup",
  "register",
  "profile",
  "index",
  "settings",
  "support",
  "help",
  "assets",
  "favicon",
  "robots"
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Only handle normal page requests
    if (request.method !== "GET" &&
        request.method !== "HEAD") {
      return env.ASSETS.fetch(request);
    }

    // Homepage, static files and nested paths
    if (
      path === "/" ||
      path.includes(".") ||
      path.slice(1).includes("/")
    ) {
      return env.ASSETS.fetch(request);
    }

    const slug = path
      .replace(/^\/+|\/+$/g, "")
      .toLowerCase();

    // Keep reserved website routes intact
    if (RESERVED.has(slug)) {
      return env.ASSETS.fetch(request);
    }

    // Only valid custom usernames
    if (!/^[a-z0-9_-]{3,20}$/.test(slug)) {
      return env.ASSETS.fetch(request);
    }

    // Internally serve the clean /profile route.
    // Keep the visitor's original URL unchanged.
    const profileURL = new URL("/profile", url.origin);

    const profileRequest = new Request(
      profileURL.toString(),
      {
        method: request.method,
        headers: request.headers
      }
    );

    return env.ASSETS.fetch(profileRequest);
  }
};