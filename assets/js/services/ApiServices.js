// assets/js/services/ApiServices.js

import { CONFIG } from '../config.js';

export class ApiService {
  static async getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (window.Clerk && window.Clerk.session) {
      try {
        const token = await window.Clerk.session.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn("Could not retrieve Clerk session token:", err);
      }
    }

    return headers;
  }

  async getHeaders() {
    return ApiService.getHeaders();
  }

  async fetchUsers() {
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/users/`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchUserMessagesCount(clerkId) {
    if (!clerkId) {
      throw new Error("clerkId is required to fetch messages count");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/users/${encodeURIComponent(clerkId)}/messages/count`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch messages count: ${response.statusText}`);
    }
    console.log("Receved Messages Number : ",response.json);
    return await response.json();
  }

  async fetchUserWorkspaces(clerkId) {
    if (!clerkId) {
      throw new Error("clerkId is required to fetch user workspaces");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/workspaces/user/${encodeURIComponent(clerkId)}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchAllWorkspaces() {
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/workspaces/`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchUserProfiles(clerkId) {
    return this.fetchUserWorkspaces(clerkId);
  }

  async fetchWorkspaceChannels(workspaceId) {
    if (!workspaceId) {
      throw new Error("workspaceId is required to fetch workspace channels");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/channels/workspace/${encodeURIComponent(workspaceId)}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchWorkspaceMessagesCount(workspaceId) {
    if (!workspaceId) {
      throw new Error("workspaceId is required to fetch workspace messages");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/chats/workspace/${encodeURIComponent(workspaceId)}/messages`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchUserDmToCheckout(clerkId) {
    if (!clerkId) {
      throw new Error("clerkId is required to fetch DM to checkout rate");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/users/${encodeURIComponent(clerkId)}/dm-to-checkouts/`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchWorkspaceDmToCheckout(workspaceId) {
    if (!workspaceId) {
      throw new Error("workspaceId is required to fetch DM to checkout rate");
    }
    const headers = await this.getHeaders();
    let response;
    try {
      response = await fetch(`${CONFIG.API_BASE_URL}/workspaces/${encodeURIComponent(workspaceId)}/dm-to-checkouts/`, {
        method: 'GET',
        headers
      });
      if (response.status === 404) {
        response = await fetch(`${CONFIG.API_BASE_URL}/workspace/${encodeURIComponent(workspaceId)}/dm-to-checkouts/`, {
          method: 'GET',
          headers
        });
      }
    } catch (e) {
      response = await fetch(`${CONFIG.API_BASE_URL}/workspace/${encodeURIComponent(workspaceId)}/dm-to-checkouts/`, {
        method: 'GET',
        headers
      });
    }

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchUserTotalSales(clerkId) {
    if (!clerkId) {
      throw new Error("clerkId is required to fetch total sales");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/users/${encodeURIComponent(clerkId)}/total-sales`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchWorkspaceTotalSales(workspaceId) {
    if (!workspaceId) {
      throw new Error("workspaceId is required to fetch workspace sales");
    }
    const headers = await this.getHeaders();
    let response;
    try {
      response = await fetch(`${CONFIG.API_BASE_URL}/workspaces/${encodeURIComponent(workspaceId)}/total-sales`, {
        method: 'GET',
        headers
      });
      if (response.status === 404) {
        response = await fetch(`${CONFIG.API_BASE_URL}/workspace/${encodeURIComponent(workspaceId)}/total-sales`, {
          method: 'GET',
          headers
        });
      }
    } catch (e) {
      response = await fetch(`${CONFIG.API_BASE_URL}/workspace/${encodeURIComponent(workspaceId)}/total-sales`, {
        method: 'GET',
        headers
      });
    }

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async createWorkspace(workspaceData) {
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/workspaces/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(workspaceData)
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchUserPlacedOrders(clerkId) {
    if (!clerkId) {
      throw new Error("clerkId is required to fetch placed orders");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/orders/user/${encodeURIComponent(clerkId)}/placed-orders`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchWorkspacePlacedOrders(param1, param2) {
    let clerkId = param2 ? param1 : (window.Clerk?.user?.id || null);
    let workspaceId = param2 ? param2 : param1;

    if (!clerkId || !workspaceId) {
      throw new Error("clerkId and workspaceId are required to fetch workspace placed orders");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/orders/user/${encodeURIComponent(clerkId)}/workspace/${encodeURIComponent(workspaceId)}/placed-orders`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async fetchRoles() {
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/users/roles`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch roles: ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.roles || ['user', 'admin', 'super_admin']);
  }

  async updateUserRole(userId, role) {
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ role })
    });

    if (!response.ok) {
      throw new Error(`Failed to update user role: ${response.statusText}`);
    }

    return await response.json();
  }

  async updateChannelStatus(channelId, isActive) {
    if (!channelId) {
      throw new Error("channelId is required to update channel status");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/channels/${encodeURIComponent(channelId)}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isActive: Boolean(isActive) })
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async updateWorkspace(workspaceId, updateData) {
    if (!workspaceId) {
      throw new Error("workspaceId is required to update workspace");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/workspaces/${encodeURIComponent(workspaceId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async updateChannel(channelId, updateData) {
    if (!channelId) {
      throw new Error("channelId is required to update channel");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/channels/${encodeURIComponent(channelId)}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json();
  }

  async deleteChannel(channelId) {
    if (!channelId) {
      throw new Error("channelId is required to delete channel");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/channels/${encodeURIComponent(channelId)}`, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      let serverMessage = response.statusText;
      try {
        const errorData = await response.json();
        serverMessage = errorData.message || errorData.error || errorData.detail || JSON.stringify(errorData);
      } catch (e) {
        try {
          const text = await response.text();
          if (text) serverMessage = text;
        } catch (_) {}
      }

      const err = new Error(serverMessage || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.serverMessage = serverMessage;
      throw err;
    }

    return await response.json().catch(() => ({ success: true }));
  }
}
