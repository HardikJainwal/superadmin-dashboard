import { AuthManager } from './auth-manager';
import { BACKEND_CONFIG } from './auth-manager';

class ApiClient {
  constructor() {
    this.baseURL = null;
  }

  setBackend(backend) {
    const config = BACKEND_CONFIG[backend];
    this.baseURL = config.url;
    this.backend = backend;
  }

  buildUrl(endpoint) {
    if (!this.baseURL) {
      const currentBackend = AuthManager.getCurrentBackend();
      if (currentBackend) {
        this.setBackend(currentBackend);
      }
    }
    return `${this.baseURL}${endpoint}`;
  }

  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const token = AuthManager.getToken(this.backend || AuthManager.getCurrentBackend());
    
    const response = await fetch(url, {
      headers: { 
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();