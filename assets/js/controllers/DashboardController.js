export class DashboardController {
  constructor(model, view, authModel = null) {
    this.model = model;
    this.view = view;
    this.authModel = authModel;
    this.messagesPollInterval = null;
    this.messagesTickerInterval = null;
    this.lastMessagesSyncedTime = null;
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

    // 6. Fetch dynamic messages handled count for current Clerk user and start polling
    await this.loadMessagesCount();
    this.startMessagesPolling();

    // 7. Fetch dynamic profiles metric for current Clerk user
    await this.loadProfilesMetric();

    // 8. Re-fetch if auth state updates dynamically
    if (this.authModel) {
      this.authModel.onAuthStateChange(({ user }) => {
        if (user && user.id) {
          this.loadMessagesCount();
          this.loadProfilesMetric();
        }
      });
    }
  }

  startMessagesPolling() {
    // 1-second ticker to update "last synced X seconds"
    if (!this.messagesTickerInterval) {
      this.messagesTickerInterval = setInterval(() => {
        if (this.lastMessagesSyncedTime) {
          const elapsed = Math.floor((Date.now() - this.lastMessagesSyncedTime) / 1000);
          this.view.updateMessagesLastSynced(elapsed);
        }
      }, 1000);
    }

    // 2-minute polling interval (120,000 ms)
    if (!this.messagesPollInterval) {
      this.messagesPollInterval = setInterval(async () => {
        await this.loadMessagesCount(true);
      }, 120000);
    }
  }

  async loadMessagesCount(isBackground = false) {
    const clerkId = this.authModel?.user?.id || window.Clerk?.user?.id;
    if (!clerkId) {
      this.view.renderMessagesCountError("Authentication required");
      return;
    }

    if (!isBackground) {
      this.view.setMessagesCountLoading();
    }

    try {
      const count = await this.model.fetchMessagesCount(clerkId);
      this.view.renderMessagesCount(count);
      this.lastMessagesSyncedTime = Date.now();
      this.view.updateMessagesLastSynced(0);
    } catch (err) {
      console.error("DashboardController: Error loading messages count:", err);
      const serverMessage = err.serverMessage || err.message || "Server did not respond";
      if (!isBackground) {
        this.view.renderMessagesCountError(serverMessage);
      }
    }
  }

  async loadProfilesMetric() {
    const clerkId = this.authModel?.user?.id || window.Clerk?.user?.id;
    if (!clerkId) {
      this.view.renderProfilesError("Authentication required");
      this.view.renderChannelsDropdown([], "Authentication required");
      return;
    }

    this.view.setProfilesLoading();
    try {
      // Calls fetchUserProfiles once and stores the profiles to avoid redundant API requests
      const profilesData = await this.model.fetchUserProfiles(clerkId);
      this.view.renderProfilesMetric(profilesData);
      this.view.renderChannelsDropdown(profilesData.profiles || []);
    } catch (err) {
      console.error("DashboardController: Error loading profiles metric:", err);
      const serverMessage = err.serverMessage || err.message || "Server did not respond";
      this.view.renderProfilesError(serverMessage);
      this.view.renderChannelsDropdown([], serverMessage);
    }
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
        const serverMessage = err.serverMessage || err.message || "Failed to communicate with server.";
        const status = err.status || (String(serverMessage).toLowerCase().includes('unauthorized') ? 401 : 403);
        this.view.renderUsersError({
          status: status,
          message: serverMessage
        }, () => this.handleNavigation('users'));
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
