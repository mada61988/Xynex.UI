import { ApiService } from '../services/ApiServices.js';

export class DashboardModel {
  constructor() {
    this.apiService = new ApiService();
    this.cachedRoles = null;
    this.cachedUserWorkspaces = null;

    this.metrics = {
      activeBots: 3,
      messagesHandled: 20040,
      conversionRate: 18.4,
      automatedSales: 142850
    };

    this.fallbackUsers = [
      {
        "id": 4,
        "clerkId": null,
        "username": "mada",
        "email": "mada@example.com",
        "password": "1234",
        "role": "user",
        "imageUrl": null
      },
      {
        "id": 5,
        "clerkId": null,
        "username": "testuser",
        "email": "test@example.com",
        "password": "password",
        "role": "user",
        "imageUrl": null
      },
      {
        "id": 18,
        "clerkId": null,
        "username": "testuser_1773904328",
        "email": "testuser_1773904328@xynex.com",
        "password": "securepassword123",
        "role": "user",
        "imageUrl": null
      },
      {
        "id": 19,
        "clerkId": null,
        "username": "testuser_1773904385",
        "email": "testuser_1773904385@xynex.com",
        "password": "securepassword123",
        "role": "user",
        "imageUrl": null
      },
      {
        "id": 26,
        "clerkId": "user_3K83KWuh5aviBVlREd3CSFFvE8p",
        "username": "Mohamed Ayman",
        "email": "mada61988@gmail.com",
        "password": "MANAGED_BY_CLERK",
        "role": "user",
        "imageUrl": "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18zSzgzS1pYT1dEMWhvenZQNVJRaUVJRVhLTnAifQ"
      },
      {
        "id": 27,
        "clerkId": "user_3K8AgODAZyyTpHIz5DJDkexKtsu",
        "username": "Mark Shnaider",
        "email": "mohamedayman.ese@gmail.com",
        "password": "MANAGED_BY_CLERK",
        "role": "user",
        "imageUrl": null
      }
    ];

    this.currentUsers = [...this.fallbackUsers];
  }

  async fetchMetrics() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.metrics);
      }, 300);
    });
  }

  /**
   * Fetches total messages handled count for a specific Clerk user.
   * Throws errors if server fails so the view can display an error state.
   */
  async fetchMessagesCount(clerkId) {
    if (!clerkId) {
      const err = new Error("Authentication required");
      err.serverMessage = "No active Clerk session";
      throw err;
    }

    const data = await this.apiService.fetchUserMessagesCount(clerkId);
    let count = data;
    if (data && typeof data === 'object') {
      if (data.count !== undefined) count = data.count;
      else if (data.total !== undefined) count = data.total;
      else if (data.messagesCount !== undefined) count = data.messagesCount;
      else if (data.messages !== undefined) count = data.messages;
      else if (data.message !== undefined) {
        const err = new Error(data.message);
        err.serverMessage = data.message;
        throw err;
      }
    }
    const parsed = Number(count);
    if (isNaN(parsed)) {
      const err = new Error("Invalid count returned from server");
      throw err;
    }
    return parsed;
  }

  /**
   * Fetches user workspaces from /workspaces/user/:clerkId
   * Extracts all channels across all workspaces/profiles and computes channel metrics.
   * Stores the workspaces from the first call to prevent redundant requests.
   * Throws errors if server fails so the view can display an error state.
   */
  async fetchUserWorkspaces(clerkId) {
    if (!clerkId) {
      const err = new Error("Authentication required");
      err.serverMessage = "No active Clerk session";
      throw err;
    }

    // Do not call API again if workspaces are already stored
    if (this.cachedUserWorkspaces) {
      return this.cachedUserWorkspaces;
    }

    const data = await this.apiService.fetchUserWorkspaces(clerkId);
    let workspacesList = [];
    if (Array.isArray(data)) {
      workspacesList = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.workspaces)) workspacesList = data.workspaces;
      else if (Array.isArray(data.profiles)) workspacesList = data.profiles;
      else if (Array.isArray(data.data)) workspacesList = data.data;
      else if (data.id !== undefined) workspacesList = [data];
    }

    if (!Array.isArray(workspacesList) || workspacesList.length === 0) {
      if (data && (data.message || data.error)) {
        const msg = data.message || data.error;
        const err = new Error(msg);
        err.serverMessage = msg;
        throw err;
      }
    }

    // Collect all channels across all workspaces/profiles
    const allChannels = workspacesList.flatMap(p => Array.isArray(p.channels) ? p.channels : []);
    const totalChannels = allChannels.length;
    const activeChannels = allChannels.filter(c => Boolean(c.isActive)).length;
    const percentageOperational = totalChannels > 0 ? Math.round((activeChannels / totalChannels) * 100) : 0;

    const result = {
      totalChannels,
      activeChannels,
      percentageOperational,
      channels: allChannels,
      profiles: workspacesList,
      workspaces: workspacesList
    };

    this.cachedUserWorkspaces = result; // Stored from the first call
    return result;
  }

  async fetchUserProfiles(clerkId) {
    return this.fetchUserWorkspaces(clerkId);
  }

  getUserWorkspaces() {
    return this.cachedUserWorkspaces?.workspaces || [];
  }

  getUserProfiles() {
    return this.getUserWorkspaces();
  }

  /**
   * Fetches users from the fetchUsers api service.
   * Throws errors so the view can display the exact server error card.
   */
  async fetchUsers() {
    const data = await this.apiService.fetchUsers();
    if (Array.isArray(data)) {
      this.currentUsers = data;
      return data;
    }

    const msg = data?.message || data?.error || "Received invalid response from server";
    const err = new Error(msg);
    err.serverMessage = msg;
    throw err;
  }

  /**
   * Fetches available roles from /users/roles
   */
  async fetchRoles() {
    if (this.cachedRoles) {
      return this.cachedRoles;
    }

    try {
      const roles = await this.apiService.fetchRoles();
      this.cachedRoles = roles;
      return roles;
    } catch (err) {
      console.warn("ApiService.fetchRoles failed, using default roles:", err);
      return ['user', 'admin', 'super_admin'];
    }
  }

  /**
   * Updates a user's role on the backend
   */
  async updateUserRole(userId, newRole) {
    try {
      const updatedUser = await this.apiService.updateUserRole(userId, newRole);
      // Update in-memory user list
      const u = this.currentUsers.find(item => item.id === Number(userId));
      if (u) u.role = newRole;
      return updatedUser;
    } catch (err) {
      console.warn("ApiService.updateUserRole failed, updating locally:", err);
      const u = this.currentUsers.find(item => item.id === Number(userId));
      if (u) u.role = newRole;
      return u || { id: userId, role: newRole };
    }
  }

  getUserRole(userId) {
    const u = this.currentUsers.find(item => item.id === Number(userId));
    return u ? u.role : 'user';
  }
}
