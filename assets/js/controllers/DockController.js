export class DockController {
  constructor(view) {
    this.view = view;
  }

  init() {
    this.view.bindDrawerToggle((isOpen) => this.view.toggleDrawer(isOpen));
    this.view.bindScroll((scrollY) => this.view.toggleDockGlassmorphism(scrollY));
  }
}
