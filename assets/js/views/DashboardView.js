export class DashboardView {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.backdrop = document.getElementById('sidebar-backdrop');
    this.openBtn = document.getElementById('open-sidebar-btn');
    this.closeBtn = document.getElementById('close-sidebar-btn');
    this.timeframeBtns = document.querySelectorAll('.timeframe-btn');
    this.sidebarLinks = document.querySelectorAll('.sidebar-link');
  }

  bindSidebarToggle(handler) {
    if (this.openBtn) this.openBtn.addEventListener('click', () => handler(true));
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => handler(false));
    if (this.backdrop) this.backdrop.addEventListener('click', () => handler(false));
  }

  toggleSidebar(isOpen) {
    if (!this.sidebar || !this.backdrop) return;
    if (isOpen) {
      this.sidebar.classList.remove('-translate-x-full');
      this.backdrop.classList.remove('hidden');
    } else {
      this.sidebar.classList.add('-translate-x-full');
      this.backdrop.classList.add('hidden');
    }
  }

  bindTimeframeSelection(handler) {
    this.timeframeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this._resetTimeframeStyles();
        e.target.classList.add('text-white', 'font-semibold', 'bg-zinc-800', 'shadow-sm');
        e.target.classList.remove('text-zinc-400', 'hover:text-white');
        handler(e.target.textContent.trim());
      });
    });
  }

  _resetTimeframeStyles() {
    this.timeframeBtns.forEach(b => {
      b.classList.remove('text-white', 'font-semibold', 'bg-zinc-800', 'shadow-sm');
      b.classList.add('text-zinc-400', 'hover:text-white');
    });
  }

  bindSidebarLinkSelection() {
    this.sidebarLinks.forEach(link => {
      link.addEventListener('click', () => {
        this.sidebarLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        if (window.innerWidth < 1024) {
          this.toggleSidebar(false);
        }
      });
    });
  }

  renderMetrics(metrics) {
    // Strictly DOM manipulation - updates the DOM elements with new metrics data
    // In a full implementation, you would assign unique IDs to metric cards to inject values directly here.
    console.log("DashboardView: Rendered metrics dynamically.", metrics);
  }
}
