const API_URL = process.env.NEXT_PUBLIC_R_BACKEND_URL || 'http://localhost:5000';

class ApiClient {
  constructor(baseURL = API_URL) {
    this.baseURL = baseURL;
  }

  buildUrl(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }

  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
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
