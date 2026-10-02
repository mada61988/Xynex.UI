import { ApiService } from '../services/ApiServices.js';

export class DashboardModel {
  constructor() {
    this.apiService = new ApiService();

    this.metrics = {
      activeBots: 3,
      messagesHandled: 48291,
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
  }

  async fetchMetrics() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(this.metrics);
      }, 300);
    });
  }

  /**
   * Fetches users from the fetchUsers api service, with fallback
   */
  async fetchUsers() {
    try {
      const data = await this.apiService.fetchUsers();
      if (Array.isArray(data)) {
        return data;
      }
      return this.fallbackUsers;
    } catch (err) {
      console.warn("ApiService.fetchUsers failed, using fallback dataset:", err);
      return this.fallbackUsers;
    }
  }
}
