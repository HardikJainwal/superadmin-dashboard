export const BACKENDS = {
  SCHOOL: 'school',
  CORPORATE: 'corporate',
  WEBSITE: 'website'
};

export const BACKEND_CONFIG = {
  [BACKENDS.SCHOOL]: {
    name: 'School Management',
    url: 'https://schoolapi.devdoot.org',
    apiPath: '/api/v1/superAdmin',
    color: 'blue'
  },
  [BACKENDS.CORPORATE]: {
    name: 'Corporate Management',
    url: 'https://api.humanova.live',
    apiPath: '/api/v1/superAdmin',
    color: 'purple'
  },
  [BACKENDS.WEBSITE]: {
    name: 'Website Management',
    url: 'https://api.devdoot.org',
    apiPath: '/api/v1/superAdmin',
    color: 'green'
  }
};

export const AuthManager = {
  setToken: (backend, token) => {
    localStorage.setItem(`${backend}_token`, token);
  },
  
  getToken: (backend) => {
    return localStorage.getItem(`${backend}_token`);
  },
  
  setRole: (backend, role) => {
    localStorage.setItem(`${backend}_role`, role);
  },
  
  getRole: (backend) => {
    return localStorage.getItem(`${backend}_role`);
  },
  
  setUser: (backend, user) => {
    localStorage.setItem(`${backend}_user`, JSON.stringify(user));
  },
  
  getUser: (backend) => {
    const user = localStorage.getItem(`${backend}_user`);
    return user ? JSON.parse(user) : null;
  },
  
  setCurrentBackend: (backend) => {
    localStorage.setItem('current_backend', backend);
  },
  
  getCurrentBackend: () => {
    return localStorage.getItem('current_backend');
  },
  
  clearAuth: (backend) => {
    localStorage.removeItem(`${backend}_token`);
    localStorage.removeItem(`${backend}_user`);
    localStorage.removeItem(`${backend}_role`);
  },
  
  clearAllAuth: () => {
    Object.values(BACKENDS).forEach(backend => {
      AuthManager.clearAuth(backend);
    });
    localStorage.removeItem('current_backend');
  },
  cleanupOldTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
  },
  
  isAuthenticated: (backend) => {
    return !!AuthManager.getToken(backend);
  }
  
};