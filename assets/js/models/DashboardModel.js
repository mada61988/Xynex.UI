import { ApiService } from '../services/ApiServices.js';

export class DashboardModel {
  constructor() {
    this.apiService = new ApiService();
    this.cachedRoles = null;

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
   * Fetches total messages handled count for a specific Clerk user
   */
  async fetchMessagesCount(clerkId) {
    if (!clerkId) {
      return this.metrics.messagesHandled;
    }

    try {
      const data = await this.apiService.fetchUserMessagesCount(clerkId);
      let count = data.count;

      console.log("data :", data)
      console.log("count: ", count)
      if (data && typeof data === 'object') {
        count = data.count ? data.count : 0;
      }
      const parsed = Number(count);
      return !isNaN(parsed) ? parsed : this.metrics.messagesHandled;
    } catch (err) {
      console.warn("fetchUserMessagesCount failed, falling back to default:", err);
      return this.metrics.messagesHandled;
    }
  }

  /**
   * Fetches users from the fetchUsers api service, with fallback
   */
  async fetchUsers() {
    try {
      const data = await this.apiService.fetchUsers();
      if (Array.isArray(data)) {
        this.currentUsers = data;
        return data;
      }
      return this.fallbackUsers;
    } catch (err) {
      console.warn("ApiService.fetchUsers failed, using fallback dataset:", err);
      return this.fallbackUsers;
    }
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
