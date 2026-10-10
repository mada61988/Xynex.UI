import { CONFIG, getAppUrl } from '../config.js';

export class AuthModel {
  constructor() {
    this.clerk = null;
    this.isReady = false;
  }

  async init() {
    if (this.isReady) return;

    // 1. Wait for window.Clerk SDK script to be available
    if (!window.Clerk) {
      await new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.Clerk) {
            clearInterval(interval);
            resolve();
          } else if (attempts > 140) { // Timeout after 7 seconds
            clearInterval(interval);
            resolve();
          }
        }, 50);
      });
    }

    if (!window.Clerk) {
      console.error("Clerk SDK failed to load. Please check your network connection or publishable key.");
      return;
    }

    this.clerk = window.Clerk;

    // 2. Initialize Clerk SDK cleanly
    try {
      const dashboardUrl = getAppUrl('dashboard.html');
      const homeUrl = getAppUrl('index.html');
      const signInUrl = getAppUrl('signin.html');
      const signUpUrl = getAppUrl('signup.html');

      // Call clerk.load and allow it to finish properly
      await this.clerk.load({
        publishableKey: CONFIG.CLERK_PUBLISHABLE_KEY,
        afterSignInUrl: dashboardUrl,
        afterSignUpUrl: dashboardUrl,
        afterSignOutUrl: homeUrl,
        signInUrl: signInUrl,
        signUpUrl: signUpUrl
      });

      this.isReady = true;
    } catch (error) {
      console.warn("Clerk load notice:", error.message || error);
      // If clerk has initialized user or state despite notice, mark ready
      if (this.clerk && (this.clerk.user || this.clerk.loaded)) {
        this.isReady = true;
      }
    }
  }

  get user() {
    return this.clerk ? this.clerk.user : null;
  }

  onAuthStateChange(callback) {
    if (this.clerk && typeof this.clerk.addListener === 'function') {
      return this.clerk.addListener(callback);
    }
  }

  async getToken() {
    return this.clerk?.session ? await this.clerk.session.getToken() : null;
  }
}
