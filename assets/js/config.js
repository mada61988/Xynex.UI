export const CONFIG = {
  CLERK_PUBLISHABLE_KEY: window.clerkPublishableKey || "pk_test_cmVsZXZhbnQtcGFuZ29saW4tMzg2LmNsZXJrLmFjY291bnRzLmRldiQ",
  API_BASE_URL: 'https://x5xpswzc-9000.euw.devtunnels.ms'
};

/**
 * Returns a fully-qualified or subpath-aware URL for GitHub Pages, local dev, or custom domains.
 * Ensures repository subpaths (e.g. /Xynex.UI/) are always preserved.
 */
export function getAppUrl(path) {
  if (typeof window === 'undefined') return path;
  const target = path.startsWith('/') ? path.slice(1) : path;

  if (window.location.protocol === 'file:') {
    return target;
  }

  let pathname = window.location.pathname;
  if (pathname.endsWith('.html') || pathname.endsWith('.htm')) {
    pathname = pathname.substring(0, pathname.lastIndexOf('/') + 1);
  } else if (!pathname.endsWith('/')) {
    pathname += '/';
  }

  return `${window.location.origin}${pathname}${target}`;
}
