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

    // 3. Delegate role inline edit and save actions
    this.view.bindRoleActions({
      onEdit: this.handleEditRole.bind(this),
      onSave: this.handleSaveRole.bind(this)
    });

    // 4. Handle initial section display based on URL hash
    const initialHash = window.location.hash.replace('#', '') || 'overview';
    await this.handleNavigation(initialHash);

    // 5. Initial metrics payload for overview
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

  async handleEditRole(userId, currentRole) {
    this.view.setRoleCellLoading(userId);
    try {
      const roles = await this.model.fetchRoles();
      this.view.enableRoleEdit(userId, currentRole, roles);
    } catch (err) {
      console.error("DashboardController: Failed to fetch roles:", err);
      this.view.cancelRoleEdit(userId, currentRole);
    }
  }

  async handleSaveRole(userId, newRole) {
    try {
      await this.model.updateUserRole(userId, newRole);
      this.view.renderUserRoleSaved(userId, newRole);
    } catch (err) {
      console.error("DashboardController: Failed to save user role:", err);
      alert("Failed to update user role. Please try again.");
      this.view.cancelRoleEdit(userId, this.model.getUserRole(userId));
    }
  }

  async handleTimeframeChange(timeframe) {
    console.log(`DashboardController: Timeframe changed to ${timeframe}`);
    const metrics = await this.model.fetchMetrics(); 
    this.view.renderMetrics(metrics);
  }
}
