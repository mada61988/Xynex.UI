export class AuthController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  async init(path) {
    try {
      await this.model.init();
    } catch (e) {
      console.error("Auth init failed:", e);
      return;
    }

    const isDashboard = path.includes('dashboard.html') || path.endsWith('/dashboard');
    const isSignIn = path.includes('signin.html') || path.endsWith('/signin');
    const isSignUp = path.includes('signup.html') || path.endsWith('/signup');
    const homeUrl = window.location.protocol === 'file:' ? 'index.html' : '/index.html';
    const signinUrl = window.location.protocol === 'file:' ? 'signin.html' : '/signin.html';
    const dashboardUrl = window.location.protocol === 'file:' ? 'dashboard.html' : '/dashboard.html';

    // Strict Route Protection Guard (Initial Load)
    if (!this.model.user && isDashboard) {
      window.location.href = signinUrl;
      return;
    }

    if (this.model.user && (isSignIn || isSignUp)) {
      window.location.href = dashboardUrl;
      return;
    }

    // Reactive Auth State Listener
    this.model.onAuthStateChange(({ session, user }) => {
      if (session === null || user === null) {
        if (isDashboard) {
          window.location.href = homeUrl;
        }
      } else if (user) {
        if (isSignIn || isSignUp) {
          window.location.href = dashboardUrl;
        }
      }
    });

    // Orchestrate views based on current path
    if (isSignIn) {
      this.view.mountSignIn(this.model.clerk);
    } else if (isSignUp) {
      this.view.mountSignUp(this.model.clerk);
    } else if (isDashboard) {
      this.view.mountUserButton(this.model.clerk);
    }
  }
}
