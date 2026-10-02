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
        watermark: '!hidden',
        // Strip out shadows and borders so it blends seamlessly
        cardBox: 'w-full !m-0 !p-0 !bg-transparent !shadow-none !border-none',
        card: 'w-full !m-0 !p-0 !bg-transparent !shadow-none !border-none',
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

  mountSignIn(clerk) {
    const container = document.getElementById('sign-in-container');
    if (container && clerk) {
      container.innerHTML = ''; // Clear spinner
      const dashboardUrl = window.location.protocol === 'file:' ? 'dashboard.html' : '/dashboard.html';
      const signUpUrl = window.location.protocol === 'file:' ? 'signup.html' : '/signup.html';

      clerk.mountSignIn(container, { 
        appearance: this.clerkAppearance,
        afterSignInUrl: dashboardUrl,
        afterSignUpUrl: dashboardUrl,
        fallbackRedirectUrl: dashboardUrl,
        forceRedirectUrl: dashboardUrl,
        signUpUrl: signUpUrl
      });
    }
  }

  mountSignUp(clerk) {
    const container = document.getElementById('sign-up-container');
    if (container && clerk) {
      container.innerHTML = ''; // Clear spinner
      const dashboardUrl = window.location.protocol === 'file:' ? 'dashboard.html' : '/dashboard.html';
      const signInUrl = window.location.protocol === 'file:' ? 'signin.html' : '/signin.html';

      clerk.mountSignUp(container, { 
        appearance: this.clerkAppearance,
        afterSignInUrl: dashboardUrl,
        afterSignUpUrl: dashboardUrl,
        fallbackRedirectUrl: dashboardUrl,
        forceRedirectUrl: dashboardUrl,
        signInUrl: signInUrl
      });
    }
  }

  mountUserButton(clerk) {
    const container = document.getElementById('user-button');
    if (container && clerk) {
      const homeUrl = window.location.protocol === 'file:' ? 'index.html' : '/index.html';
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
    }
  }
}