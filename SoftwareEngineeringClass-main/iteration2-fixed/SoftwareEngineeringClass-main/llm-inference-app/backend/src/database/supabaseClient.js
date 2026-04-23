const config = require('../config/config');

/**
 * Supabase REST API client
 * Uses native fetch to communicate with Supabase REST API
 */
class SupabaseClient {
  constructor() {
    this.url = config.supabase.url;
    this.anonKey = config.supabase.anonKey;
    this.serviceKey = config.supabase.serviceKey;
    
    if (!this.url || !this.anonKey) {
      throw new Error('Supabase URL and ANON_KEY must be configured in environment variables');
    }
  }

  /**
   * Make a request to Supabase REST API
   * @param {string} table - Table name
   * @param {object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PATCH, DELETE)
   * @param {object} options.body - Request body
   * @param {string} options.query - Query string (e.g., "?select=*&filter=eq.id.1")
   * @param {boolean} options.useServiceKey - Use service role key instead of anon key
   * @returns {Promise<object>} Response data
   */
  async request(table, options = {}) {
    const {
      method = 'GET',
      body = null,
      query = '',
      useServiceKey = false
    } = options;

    const url = `${this.url}/rest/v1/${table}${query}`;
    const key = useServiceKey ? this.serviceKey : this.anonKey;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Prefer': 'return=representation'
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });

      const text = await response.text();

      // Handle different response statuses
      if (!response.ok) {
        console.error(`Supabase error (${response.status}):`, text, { method, table, url });
        let errorData = {};
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          errorData = { message: text };
        }
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        error.data = errorData;
        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      if (!text) {
        return null;
      }

      const data = JSON.parse(text);
      return data;
    } catch (error) {
      console.error(`Supabase request error:`, error.message, { table, method, url });
      throw error;
    }
  }

  /**
   * Query users table
   */
  async queryUsers(filter = null) {
    let query = '?select=*';
    if (filter) {
      query += `&${filter}`;
    }
    return this.request('users', { query });
  }

  /**
   * Insert user
   */
  async insertUser(userData) {
    const result = await this.request('users', {
      method: 'POST',
      body: userData
    });
    return Array.isArray(result) ? result : [result];
  }

  /**
   * Update user
   */
  async updateUser(userId, userData) {
    return this.request('users', {
      method: 'PATCH',
      body: userData,
      query: `?user_id=eq.${userId}`
    });
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    return this.request('users', {
      method: 'DELETE',
      query: `?user_id=eq.${userId}`
    });
  }
}

module.exports = new SupabaseClient();
