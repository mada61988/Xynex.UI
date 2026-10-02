import { CONFIG } from '../config.js';

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
      const dashboardUrl = window.location.protocol === 'file:' ? 'dashboard.html' : '/dashboard.html';
      const homeUrl = window.location.protocol === 'file:' ? 'index.html' : '/index.html';
      
      await this.clerk.load({
        publishableKey: CONFIG.CLERK_PUBLISHABLE_KEY,
        afterSignInUrl: dashboardUrl,
        afterSignUpUrl: dashboardUrl,
        afterSignOutUrl: homeUrl,
        signInUrl: window.location.protocol === 'file:' ? 'signin.html' : '/signin.html',
        signUpUrl: window.location.protocol === 'file:' ? 'signup.html' : '/signup.html'
      });
      this.isReady = true;
    } catch (error) {
      console.error("Error loading Clerk:", error);
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
