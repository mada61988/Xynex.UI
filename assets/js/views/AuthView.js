import { getAppUrl } from '../config.js';

export class AuthView {
  constructor() {
    this.clerkAppearance = {
      variables: {
        colorPrimary: '#ffffff',
        colorBackground: 'transparent',
        colorInputBackground: '#0d0d10',
        colorInputText: '#ffffff',
        colorText: '#f4f4f5',
        colorTextSecondary: '#a1a1aa',
        borderRadius: '0.75rem',
      },
      elements: {
        watermark: 'hidden',
        cardBox: 'w-full m-0 p-0 bg-transparent shadow-none border-none',
        card: 'w-full m-0 p-0 bg-transparent shadow-none border-none',
        rootBox: 'w-full flex justify-center',
        headerTitle: 'hidden',
        headerSubtitle: 'hidden',
        formButtonPrimary: 'bg-white hover:bg-zinc-200 text-black font-semibold py-3.5 rounded-xl transition',
        socialButtonsBlockButton: 'border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 py-3 rounded-xl transition',
        dividerLine: 'bg-zinc-800',
        dividerText: 'text-zinc-500 uppercase text-[11px] font-semibold tracking-wider px-3 bg-[#111114]',
        formFieldLabel: 'text-zinc-300 text-xs font-semibold mb-1.5',
        formFieldInput: 'bg-[#0d0d10] border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition',
        footerActionLink: 'text-white hover:underline font-semibold'
      }
    };
  }

  async mountSignIn(clerk) {
    const container = document.getElementById('sign-in-container');
    if (!container) return;

    if (!clerk) {
      container.innerHTML = `
        <div class="text-center p-6 text-zinc-400">
          <p class="text-sm font-semibold text-rose-400 mb-1.5">Authentication Service Unavailable</p>
          <p class="text-xs text-zinc-500 mb-4">Could not load Clerk SDK. Please check your network connection.</p>
          <button onclick="window.location.reload()" class="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition cursor-pointer">Retry</button>
        </div>
      `;
      return;
    }

    // Ensure clerk components are ready
    if (typeof clerk.load === 'function' && !clerk.loaded) {
      try {
        await clerk.load();
      } catch (e) {
        console.warn("clerk.load wait notice in mountSignIn:", e);
      }
    }

    container.innerHTML = ''; // Clear loading spinner
    const dashboardUrl = getAppUrl('dashboard.html');
    const signUpUrl = getAppUrl('signup.html');

    try {
      clerk.mountSignIn(container, { 
        appearance: this.clerkAppearance,
        afterSignInUrl: dashboardUrl,
        afterSignUpUrl: dashboardUrl,
        fallbackRedirectUrl: dashboardUrl,
        forceRedirectUrl: dashboardUrl,
        signUpUrl: signUpUrl
      });
    } catch (err) {
      console.error("Clerk mountSignIn failed:", err);
      container.innerHTML = `
        <div class="text-center p-6 text-zinc-400">
          <p class="text-sm font-semibold text-rose-400 mb-1.5">Failed to render Sign In form</p>
          <p class="text-xs text-zinc-500 mb-4">${err.message || 'Please reload the page.'}</p>
          <button onclick="window.location.reload()" class="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition cursor-pointer">Reload Page</button>
        </div>
      `;
    }
  }

  async mountSignUp(clerk) {
    const container = document.getElementById('sign-up-container');
    if (!container) return;

    if (!clerk) {
      container.innerHTML = `
        <div class="text-center p-6 text-zinc-400">
          <p class="text-sm font-semibold text-rose-400 mb-1.5">Authentication Service Unavailable</p>
          <p class="text-xs text-zinc-500 mb-4">Could not load Clerk SDK. Please check your network connection.</p>
          <button onclick="window.location.reload()" class="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition cursor-pointer">Retry</button>
        </div>
      `;
      return;
    }

    // Ensure clerk components are ready
    if (typeof clerk.load === 'function' && !clerk.loaded) {
      try {
        await clerk.load();
      } catch (e) {
        console.warn("clerk.load wait notice in mountSignUp:", e);
      }
    }

    container.innerHTML = ''; // Clear loading spinner
    const dashboardUrl = getAppUrl('dashboard.html');
    const signInUrl = getAppUrl('signin.html');

    try {
      clerk.mountSignUp(container, { 
        appearance: this.clerkAppearance,
        afterSignInUrl: dashboardUrl,
        afterSignUpUrl: dashboardUrl,
        fallbackRedirectUrl: dashboardUrl,
        forceRedirectUrl: dashboardUrl,
        signInUrl: signInUrl
      });
    } catch (err) {
      console.error("Clerk mountSignUp failed:", err);
      container.innerHTML = `
        <div class="text-center p-6 text-zinc-400">
          <p class="text-sm font-semibold text-rose-400 mb-1.5">Failed to render Sign Up form</p>
          <p class="text-xs text-zinc-500 mb-4">${err.message || 'Please reload the page.'}</p>
          <button onclick="window.location.reload()" class="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 transition cursor-pointer">Reload Page</button>
        </div>
      `;
    }
  }

  mountUserButton(clerk) {
    const container = document.getElementById('user-button');
    if (container && clerk) {
      const homeUrl = getAppUrl('index.html');
      try {
        clerk.mountUserButton(container, {
          afterSignOutUrl: homeUrl,
          appearance: {
            variables: this.clerkAppearance.variables,
            elements: { 
              userButtonPopoverCard: 'bg-[#111114] border border-zinc-800 shadow-2xl rounded-2xl',
              userButtonAvatarBox: 'w-8 h-8 rounded-full border border-zinc-700 hover:opacity-80 transition'
            }
          }
        });
      } catch (err) {
        console.warn("Clerk mountUserButton warning:", err);
      }
    }
  }
}
