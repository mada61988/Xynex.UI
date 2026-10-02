export class DockView {
  constructor() {
    this.drawerToggle = document.getElementById('mobile-drawer-toggle');
    this.drawerClose = document.getElementById('drawer-close');
    this.drawer = document.getElementById('mobile-nav-drawer');
    this.backdrop = document.getElementById('drawer-backdrop');
    this.navItems = document.querySelectorAll('.mobile-nav-item');
  }

  bindDrawerToggle(handler) {
    if (this.drawerToggle) this.drawerToggle.addEventListener('click', () => handler(true));
    if (this.drawerClose) this.drawerClose.addEventListener('click', () => handler(false));
    if (this.backdrop) this.backdrop.addEventListener('click', () => handler(false));
    
    this.navItems.forEach(item => {
      item.addEventListener('click', () => handler(false));
    });
  }

  toggleDrawer(isOpen) {
    if (!this.drawer || !this.backdrop) return;
    if (isOpen) {
      this.drawer.classList.remove('hidden');
      this.backdrop.classList.remove('hidden');
    } else {
      this.drawer.classList.add('hidden');
      this.backdrop.classList.add('hidden');
    }
  }

  bindScroll(handler) {
    window.addEventListener('scroll', () => handler(window.scrollY));
  }

  toggleDockGlassmorphism(scrollY) {
    const dock = document.querySelector('.awwwards-dock');
    if (dock) {
      if (scrollY > 50) {
        dock.classList.add('bg-dockBg/95', 'backdrop-blur-xl', 'border-white/10');
      } else {
        dock.classList.remove('bg-dockBg/95', 'backdrop-blur-xl', 'border-white/10');
      }
    }
  }
}
