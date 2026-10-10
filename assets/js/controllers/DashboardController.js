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

    // 3a. Delegate Create Workspace form
    this.view.bindCreateWorkspace({
      onSubmit: this.handleCreateWorkspace.bind(this),
      onCancel: () => {
        window.location.hash = 'workspaces';
        this.handleNavigation('workspaces');
      }
    });

    // 3b. Delegate Add Workspace button click
    this.view.bindAddWorkspace(() => {
      window.location.hash = 'create-workspace';
      this.handleNavigation('create-workspace');
    });

    // 3c. Delegate Create Channel form
    this.view.bindCreateChannel({
      onSubmit: this.handleCreateChannel.bind(this),
      onCancel: () => {
        if (this.currentDetailWorkspace) {
          this.openWorkspaceDetail(this.currentDetailWorkspace.id);
        } else {
          window.location.hash = 'workspaces';
          this.handleNavigation('workspaces');
        }
      }
    });

    // 3d. Header breadcrumb navigation handler
    this.view.onBreadcrumbNavigate = (target, workspaceId) => {
      if (target === 'workspaces') {
        window.location.hash = 'workspaces';
        this.handleNavigation('workspaces');
      } else if (target === 'create-workspace') {
        window.location.hash = 'create-workspace';
        this.handleNavigation('create-workspace');
      } else if (target === 'workspace-detail' && workspaceId) {
        this.openWorkspaceDetail(workspaceId);
      }
    };

    // 4. Handle initial section display based on URL hash
    const initialHash = window.location.hash.replace('#', '') || 'overview';
    await this.handleNavigation(initialHash);

    // 5. Initial metrics payload for overview
    const metrics = await this.model.fetchMetrics();
    this.view.renderMetrics(metrics);

    // 6. Concurrently fetch all initial dashboard data from the database
    this.view.showPageLoading("Initializing dashboard data...");
    try {
      await Promise.allSettled([
        this.loadMessagesCount(),
        this.loadProfilesMetric(),
        this.loadDmToCheckout(),
        this.loadTotalSales(),
        this.loadPlacedOrders()
      ]);
    } finally {
      this.view.hidePageLoading();
    }
    this.startMessagesPolling();


// 7. Re-fetch ONLY if the authenticated user actually changes
    if (this.authModel) {
      let currentUserId = this.authModel?.user?.id || window.Clerk?.user?.id;

      this.authModel.onAuthStateChange(async ({ user }) => {
        // Only trigger loading overlay if user.id exists AND is different from currentUserId
        if (user && user.id && user.id !== currentUserId) {
          currentUserId = user.id;
          this.view.showPageLoading("Updating session data...");
          try {
            await Promise.allSettled([
              this.loadMessagesCount(),
              this.loadProfilesMetric(),
              this.loadDmToCheckout(),
              this.loadTotalSales(),
              this.loadPlacedOrders()
            ]);
          } finally {
            this.view.hidePageLoading();
          }
        }
      });
    }
  }

  async handleCreateWorkspace(payload) {
    this.view.setCreateWorkspaceLoading(true);
    try {
      await this.model.createWorkspace(payload);
      this.view.showCreateWorkspaceFeedback({ type: 'success', message: 'Workspace created successfully!' });
      
      // Reload workspaces data to reflect the new workspace
      await this.loadProfilesMetric();
      
      // Transition back to workspaces tab after brief delay
      setTimeout(() => {
        this.view.resetCreateWorkspaceForm();
        window.location.hash = 'workspaces';
        this.handleNavigation('workspaces');
      }, 1500);
    } catch (err) {
      console.error("DashboardController: Error creating workspace:", err);
      const serverMessage = err.serverMessage || err.message || "Failed to create workspace";
      this.view.showCreateWorkspaceFeedback({ type: 'error', message: serverMessage });
      this.view.setCreateWorkspaceLoading(false);
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
    this.view.showPageLoading("Syncing workspace data...");

    try {
      if (selectedId === 'all') {
        // 1. Render overall channels metric across all workspaces
        if (this.cachedOverallData) {
          this.view.renderChannelsMetric({
            totalChannels: this.cachedOverallData.totalChannels,
            activeChannels: this.cachedOverallData.activeChannels,
            percentageOperational: this.cachedOverallData.percentageOperational
          });
        }

        // 2. Fetch overall user messages count, DM-to-checkout rate, total sales, and placed orders
        await Promise.allSettled([
          this.loadMessagesCount(),
          this.loadDmToCheckout('all'),
          this.loadTotalSales('all'),
          this.loadPlacedOrders('all')
        ]);
        return;
      }

      // A specific workspace is chosen:
      // Concurrently fetch channels, messages, DM-to-checkout rate, total sales, and placed orders for that workspace
      await Promise.allSettled([
        (async () => {
          this.view.setChannelsLoading();
          try {
            const channelData = await this.model.fetchWorkspaceChannels(selectedId);
            this.view.renderChannelsMetric(channelData);
          } catch (err) {
            console.error(`DashboardController: Error fetching channels for workspace ${selectedId}:`, err);
            const serverMessage = err.serverMessage || err.message || "Failed to load workspace channels";
            this.view.renderChannelsError(serverMessage);
          }
        })(),
        (async () => {
          await this.loadWorkspaceMessagesCount(selectedId);
        })(),
        (async () => {
          await this.loadDmToCheckout(selectedId);
        })(),
        (async () => {
          await this.loadTotalSales(selectedId);
        })(),
        (async () => {
          await this.loadPlacedOrders(selectedId);
        })()
      ]);
    } finally {
      // Hide the centered loading spinner once all data is fetched
      this.view.hidePageLoading();
    }
  }

  async loadPlacedOrders(workspaceId = null) {
    const clerkId = this.authModel?.user?.id || window.Clerk?.user?.id;
    if (!clerkId) {
      this.view.renderPlacedOrdersError("Authentication required");
      return;
    }

    this.view.setOrdersLoading();
    try {
      const orders = await this.model.fetchPlacedOrders({ clerkId, workspaceId });
      this.view.renderPlacedOrders(orders);
    } catch (err) {
      console.error("DashboardController: Error loading placed orders:", err);
      const serverMessage = err.serverMessage || err.message || "Failed to load placed orders";
      this.view.renderPlacedOrdersError(serverMessage);
    }
  }

  async loadTotalSales(workspaceId = null) {
    const clerkId = this.authModel?.user?.id || window.Clerk?.user?.id;
    if (!clerkId && (!workspaceId || workspaceId === 'all')) {
      this.view.renderTotalSalesError("Authentication required");
      return;
    }

    this.view.setTotalSalesLoading();
    try {
      const salesData = await this.model.fetchTotalSales({ clerkId, workspaceId });
      this.view.renderTotalSales(salesData);
    } catch (err) {
      console.error("DashboardController: Error loading total sales:", err);
      const serverMessage = err.serverMessage || err.message || "Server did not respond";
      this.view.renderTotalSalesError(serverMessage);
    }
  }

  async loadDmToCheckout(workspaceId = null) {
    const clerkId = this.authModel?.user?.id || window.Clerk?.user?.id;
    if (!clerkId && (!workspaceId || workspaceId === 'all')) {
      this.view.renderDmToCheckoutError("Authentication required");
      return;
    }

    this.view.setDmToCheckoutLoading();
    try {
      const percentage = await this.model.fetchDmToCheckout({ clerkId, workspaceId });
      this.view.renderDmToCheckout(percentage);
    } catch (err) {
      console.error("DashboardController: Error loading DM to checkout rate:", err);
      const serverMessage = err.serverMessage || err.message || "Server did not respond";
      this.view.renderDmToCheckoutError(serverMessage);
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
    } else if (target === 'workspaces') {
      this.view.showSection('workspaces');
      this.view.renderWorkspacesCardsLoading();

      try {
        const workspaces = await this.model.fetchAllWorkspaces();
        this.view.renderWorkspacesCards(workspaces, async (workspaceId) => {
          await this.openWorkspaceDetail(workspaceId);
        });
      } catch (err) {
        console.error("DashboardController: Error fetching workspaces:", err);
        const serverMessage = err.serverMessage || err.message || "Failed to communicate with server.";
        this.view.renderWorkspacesCardsError(serverMessage, () => this.handleNavigation('workspaces'));
      }
    } else if (target === 'create-workspace') {
      this.view.showSection('create-workspace');
    } else {
      // Default to overview section
      this.view.showSection('overview');
    }
  }

  async openWorkspaceDetail(workspaceId) {
    this.view.showPageLoading("Loading workspace details...");
    try {
      let workspaces = this.model.cachedUserWorkspaces?.workspaces;
      if (!workspaces || workspaces.length === 0) {
        workspaces = await this.model.fetchAllWorkspaces();
      }
      const workspace = (workspaces || []).find(w => String(w.id) === String(workspaceId)) || {
        id: workspaceId,
        name: `Workspace #${workspaceId}`,
        status: 'active'
      };

      // Concurrently fetch channels and the 4 workspace metrics
      const [channelDataRes, salesRes, messagesRes, dmRes, ordersRes] = await Promise.allSettled([
        this.model.fetchWorkspaceChannels(workspaceId),
        this.model.fetchWorkspaceTotalSales(workspaceId),
        this.model.fetchWorkspaceMessagesCount(workspaceId),
        this.model.fetchWorkspaceDmToCheckout(workspaceId),
        this.model.fetchWorkspacePlacedOrders(workspaceId)
      ]);

      let channels = [];
      if (channelDataRes.status === 'fulfilled') {
        const cd = channelDataRes.value;
        channels = cd?.channels || (Array.isArray(cd) ? cd : (workspace.channels || []));
      } else {
        console.warn("Could not fetch workspace channels directly, using embedded channels:", channelDataRes.reason);
        channels = workspace.channels || [];
      }

      const metrics = {
        totalSales: salesRes.status === 'fulfilled' ? (salesRes.value?.formattedSales || '—') : '—',
        currency: salesRes.status === 'fulfilled' ? (salesRes.value?.currency || workspace.currencyCode || 'USD') : (workspace.currencyCode || 'USD'),
        messagesCount: messagesRes.status === 'fulfilled' ? (typeof messagesRes.value === 'number' ? messagesRes.value.toLocaleString() : messagesRes.value) : '—',
        dmToCheckout: dmRes.status === 'fulfilled' ? `${dmRes.value}%` : '—',
        placedOrdersCount: ordersRes.status === 'fulfilled' ? (Array.isArray(ordersRes.value) ? ordersRes.value.length : (ordersRes.value?.count ?? ordersRes.value ?? 0)) : '—'
      };

      this.currentDetailWorkspace = workspace;
      this.view.showSection('workspace-detail');
      this.view.renderWorkspaceDetailView(workspace, channels, metrics, {
        onBackToWorkspaces: () => {
          this.handleNavigation('workspaces');
        },
        onConfigureChannel: (channelId) => {
          const channel = (channels || []).find(c => Number(c.id) === Number(channelId)) || {
            id: channelId,
            platform: 'channel',
            isActive: true
          };
          this.openChannelConfig(workspace, channel, channels);
        },
        onOpenEditWorkspace: () => {
          this.openEditWorkspace(workspace, channels);
        },
        onOpenCreateChannel: (ws) => {
          this.openCreateChannel(ws || workspace);
        }
      });
    } catch (err) {
      console.error("DashboardController: Error opening workspace detail:", err);
    } finally {
      this.view.hidePageLoading();
    }
  }

  openCreateChannel(workspace) {
    this.currentDetailWorkspace = workspace;
    this.view.openCreateChannelView(workspace);
  }

  async handleCreateChannel(payload) {
    this.view.setCreateChannelLoading(true);
    try {
      await this.model.createChannel(payload);
      this.view.showCreateChannelFeedback({ type: 'success', message: 'Channel connected successfully!' });

      // Refresh workspaces/channels cache
      await this.loadProfilesMetric();

      // Return to workspace detail view
      setTimeout(() => {
        this.view.resetCreateChannelForm();
        this.openWorkspaceDetail(payload.workspaceId);
      }, 1500);
    } catch (err) {
      console.error("DashboardController: Error creating channel:", err);
      const serverMessage = err.serverMessage || err.message || "Failed to create channel";
      this.view.showCreateChannelFeedback({ type: 'error', message: serverMessage });
      this.view.setCreateChannelLoading(false);
    }
  }

  openEditWorkspace(workspace, channels) {
    this.view.renderEditWorkspaceView(workspace, channels, {
      onBackToWorkspaces: () => {
        this.handleNavigation('workspaces');
      },
      onBackToWorkspaceDetail: () => {
        this.openWorkspaceDetail(workspace.id);
      },
      onSaveWorkspace: async (updatedData) => {
        await this.model.updateWorkspace(workspace.id, updatedData);
        workspace.name = updatedData.name;
        workspace.serviceType = updatedData.serviceType;
        workspace.currencyCode = updatedData.currencyCode;
        workspace.metaAppId = updatedData.metaAppId;
        workspace.metaAppSecret = updatedData.metaAppSecret;
        await this.openWorkspaceDetail(workspace.id);
      },
      onDeleteChannel: async (channelId) => {
        await this.model.deleteChannel(channelId);
        const idx = channels.findIndex(c => Number(c.id) === Number(channelId));
        if (idx !== -1) {
          channels.splice(idx, 1);
        }
      }
    });
  }

  openChannelConfig(workspace, channel, allChannels) {
    this.view.renderChannelConfigView(workspace, channel, {
      onBackToWorkspaces: () => {
        this.handleNavigation('workspaces');
      },
      onBackToWorkspaceDetail: () => {
        this.openWorkspaceDetail(workspace.id);
      },
      onToggleStatus: async (channelId, newStatus) => {
        await this.model.updateChannelStatus(channelId, newStatus);
        channel.isActive = newStatus;
        const ch = (allChannels || []).find(c => Number(c.id) === Number(channelId));
        if (ch) ch.isActive = newStatus;
      },
      onSaveChannel: async (channelId, updatedData) => {
        await this.model.updateChannel(channelId, updatedData);
        channel.platform = updatedData.platform;
        channel.metaPageId = updatedData.metaPageId;
        channel.pageAccessToken = updatedData.pageAccessToken;
        const ch = (allChannels || []).find(c => Number(c.id) === Number(channelId));
        if (ch) {
          ch.platform = updatedData.platform;
          ch.metaPageId = updatedData.metaPageId;
          ch.pageAccessToken = updatedData.pageAccessToken;
        }
        await this.openWorkspaceDetail(workspace.id);
      },
      onDeleteChannel: async (channelId) => {
        await this.model.deleteChannel(channelId);
        const idx = (allChannels || []).findIndex(c => Number(c.id) === Number(channelId));
        if (idx !== -1) {
          allChannels.splice(idx, 1);
        }
        await this.loadProfilesMetric();
        await this.openWorkspaceDetail(workspace.id);
      }
    });
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
