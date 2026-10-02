/**
 * Xynex AI - Tailwind CSS Configuration
 * Configured for dark-mode executive SaaS design system.
 */
const config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        canvas: '#09090b',
        borderDark: '#27272a',
        borderLight: '#27272a',
        dockBg: '#121215',
        dockBorder: '#27272a',
        dockHover: '#202024'
      }
    }
  }
};

// Expose configuration for Tailwind Play CDN
if (typeof window !== 'undefined') {
  window.tailwind = window.tailwind || {};
  window.tailwind.config = config;
}

// Support Node.js / PostCSS toolchains
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}
