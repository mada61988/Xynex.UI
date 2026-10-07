import { CONFIG, getAppUrl } from '../config.js';

export class AuthModel {
  constructor() {
    this.clerk = null;
    this.isReady = false;
  }

  async init() {
    if (this.isReady) return;

    if (!window.Clerk) {
      await new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.Clerk) {
            clearInterval(interval);
            resolve();
          } else if (attempts > 200) { // Timeout after 10 seconds
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

    try {
      const dashboardUrl = getAppUrl('dashboard.html');
      const homeUrl = getAppUrl('index.html');
      const signInUrl = getAppUrl('signin.html');
      const signUpUrl = getAppUrl('signup.html');

      const clerkLoadPromise = this.clerk.load({
        publishableKey: CONFIG.CLERK_PUBLISHABLE_KEY,
        allowedRedirectOrigins: [window.location.origin, 'http://localhost:3000', 'http://localhost:5500', 'https://mada61988.github.io'],
        afterSignInUrl: dashboardUrl,
        afterSignUpUrl: dashboardUrl,
        afterSignOutUrl: homeUrl,
        signInUrl: signInUrl,
        signUpUrl: signUpUrl
      });

      // Never allow clerk.load to block or hang the app
      await Promise.race([
        clerkLoadPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Clerk load timed out")), 3500))
      ]);

      this.isReady = true;
    } catch (error) {
      console.warn("Clerk load notice:", error.message || error);
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
