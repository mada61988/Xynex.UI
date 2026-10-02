// assets/js/services/ApiService.js

import { CONFIG } from '../config.js';
export class ApiService {
  static async getHeaders() {
    if (!window.Clerk || !window.Clerk.session) {
      throw new Error('User is not authenticated');
    }
    // Get the fresh JWT token directly from Clerk
    const token = await window.Clerk.session.getToken();

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

    async fetchUsers() {
    const headers = await this.getHeaders();
    const response = await fetch(`${CONFIG.API_BASE_URL}/users/`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.statusText}`);
    }

    return await response.json();
  }
}