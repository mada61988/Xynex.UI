export class DashboardController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }

  async init() {
    // 1. Delegate basic drawer and filter controls
    this.view.bindSidebarToggle((isOpen) => this.view.toggleSidebar(isOpen));
    this.view.bindTimeframeSelection(this.handleTimeframeChange.bind(this));

    // 2. Delegate sidebar navigation (e.g. #overview, #users)
    this.view.bindNavigation(this.handleNavigation.bind(this));

    // 3. Handle initial section display based on URL hash
    const initialHash = window.location.hash.replace('#', '') || 'overview';
    await this.handleNavigation(initialHash);

    // 4. Initial metrics payload for overview
    const metrics = await this.model.fetchMetrics();
    this.view.renderMetrics(metrics);
  }

  async handleNavigation(target) {
    if (target === 'users') {
      this.view.showSection('users');
      this.view.renderUsersLoading();

      try {
        const users = await this.model.fetchUsers();
        this.view.renderUsersTable(users);
      } catch (err) {
        console.error("DashboardController: Error fetching users:", err);
      }
    } else {
      // Default to overview section
      this.view.showSection('overview');
    }
  }

  async handleTimeframeChange(timeframe) {
    console.log(`DashboardController: Timeframe changed to ${timeframe}`);
    const metrics = await this.model.fetchMetrics(); 
    this.view.renderMetrics(metrics);
  }
}
