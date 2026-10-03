export class DashboardController {
  constructor(model, view, authModel = null) {
    this.model = model;
    this.view = view;
    this.authModel = authModel;
    this.messagesPollInterval = null;
    this.messagesTickerInterval = null;
    this.lastMessagesSyncedTime = null;
    this.currentSelectedWorkspaceId = 'all';
    this.cachedOverallData = null;
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

    // 7. Fetch dynamic workspaces and channels metric for current Clerk user
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
        if (this.currentSelectedWorkspaceId && this.currentSelectedWorkspaceId !== 'all') {
          await this.loadWorkspaceMessagesCount(this.currentSelectedWorkspaceId, true);
        } else {
          await this.loadMessagesCount(true);
        }
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

  async loadWorkspaceMessagesCount(workspaceId, isBackground = false) {
    if (!workspaceId || workspaceId === 'all') {
      return this.loadMessagesCount(isBackground);
    }

    if (!isBackground) {
      this.view.setMessagesCountLoading();
    }

    try {
      const count = await this.model.fetchWorkspaceMessagesCount(workspaceId);
      this.view.renderMessagesCount(count);
      this.lastMessagesSyncedTime = Date.now();
      this.view.updateMessagesLastSynced(0);
    } catch (err) {
      console.error(`DashboardController: Error loading messages for workspace ${workspaceId}:`, err);
      const serverMessage = err.serverMessage || err.message || "Server did not respond";
      if (!isBackground) {
        this.view.renderMessagesCountError(serverMessage);
      }
    }
  }

  async loadProfilesMetric() {
    const clerkId = this.authModel?.user?.id || window.Clerk?.user?.id;
    if (!clerkId) {
      this.view.renderChannelsError("Authentication required");
      this.view.renderWorkspacesDropdown([], "Authentication required");
      return;
    }

    this.view.setChannelsLoading();
    try {
      // Calls fetchUserWorkspaces once and stores the workspaces to avoid redundant API requests
      const data = await this.model.fetchUserWorkspaces(clerkId);
      this.cachedOverallData = data;
      
      // Render overall channels metric (total channels across all profiles)
      this.view.renderChannelsMetric({
        totalChannels: data.totalChannels,
        activeChannels: data.activeChannels,
        percentageOperational: data.percentageOperational
      });

      // Render workspaces dropdown and wire selection handler
      this.view.renderWorkspacesDropdown(data.workspaces || data.profiles || [], null, async (selectedId) => {
        await this.handleWorkspaceSelection(selectedId);
      });
    } catch (err) {
      console.error("DashboardController: Error loading workspaces & channels metric:", err);
      const serverMessage = err.serverMessage || err.message || "Server did not respond";
      this.view.renderChannelsError(serverMessage);
      this.view.renderWorkspacesDropdown([], serverMessage);
    }
  }

  async handleWorkspaceSelection(selectedId) {
    this.currentSelectedWorkspaceId = selectedId;

    if (selectedId === 'all') {
      // 1. Render overall channels metric across all workspaces
      if (this.cachedOverallData) {
        this.view.renderChannelsMetric({
          totalChannels: this.cachedOverallData.totalChannels,
          activeChannels: this.cachedOverallData.activeChannels,
          percentageOperational: this.cachedOverallData.percentageOperational
        });
      }

      // 2. Fetch overall user messages count
      await this.loadMessagesCount();
      return;
    }

    // A specific workspace is chosen:
    // 1. In the channels card, use /channels/workspace/:workspaceId
    this.view.setChannelsLoading();
    try {
      const channelData = await this.model.fetchWorkspaceChannels(selectedId);
      this.view.renderChannelsMetric(channelData);
    } catch (err) {
      console.error(`DashboardController: Error fetching channels for workspace ${selectedId}:`, err);
      const serverMessage = err.serverMessage || err.message || "Failed to load workspace channels";
      this.view.renderChannelsError(serverMessage);
    }

    // 2. In the messages card, use /chats/workspace/:workspaceId/messages
    // 3. Reads { messageCount } returned by the endpoint
    await this.loadWorkspaceMessagesCount(selectedId);
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
