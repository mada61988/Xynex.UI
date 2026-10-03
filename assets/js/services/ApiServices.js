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
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    return await response.json();
  }

  async fetchUserMessagesCount(clerkId) {
    if (!clerkId) {
      throw new Error("clerkId is required to fetch messages count");
    }
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/chats/users/${encodeURIComponent(clerkId)}/messages/count`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch messages count: ${response.statusText}`);
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
}
