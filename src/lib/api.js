// API Configuration for Spring Boot Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Service endpoints based on your microservices structure
export const API_ENDPOINTS = {
  // Admin Server
  admin: `${API_BASE_URL}/admin`,

  // Authentication & Security (SecurityP04)
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    profile: `${API_BASE_URL}/api/auth/profile`
  },

  // Product Service
  products: {
    list: `${API_BASE_URL}/api/products`,
    details: (id) => `${API_BASE_URL}/api/products/${id}`
  },

  // Service requests (could be part of Product-Service)
  services: {
    list: `${API_BASE_URL}/api/services`,
    details: (id) => `${API_BASE_URL}/api/services/${id}`,
    request: `${API_BASE_URL}/api/service-requests`,
    userRequests: `${API_BASE_URL}/api/service-requests/user`
  },

  // Payment Gateway
  payments: {
    create: `${API_BASE_URL}/api/payments/create`,
    verify: `${API_BASE_URL}/api/payments/verify`,
    history: `${API_BASE_URL}/api/payments/history`
  },

  // Notifications
  notifications: {
    list: `${API_BASE_URL}/api/notifications`,
    markRead: (id) => `${API_BASE_URL}/api/notifications/${id}/read`
  },

  // AI Assistant (AskAi)
  ai: {
    chat: `${API_BASE_URL}/api/ai/chat`,
    query: `${API_BASE_URL}/api/ai/query`
  },

  // Contact
  contact: `${API_BASE_URL}/api/contact`
};

// Generic fetch wrapper with auth token
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('gmr_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: async (email, password) => {
    return fetchWithAuth(API_ENDPOINTS.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (name, email, password, phone) => {
    return fetchWithAuth(API_ENDPOINTS.auth.register, {
      method: 'POST',
      body: JSON.stringify({ name, email, password, phone })
    });
  },

  logout: async () => {
    return fetchWithAuth(API_ENDPOINTS.auth.logout, { method: 'POST' });
  },

  getProfile: async () => {
    return fetchWithAuth(API_ENDPOINTS.auth.profile);
  }
};

// Services API
export const servicesApi = {
  getAll: async () => {
    return fetchWithAuth(API_ENDPOINTS.services.list);
  },

  getById: async (id) => {
    return fetchWithAuth(API_ENDPOINTS.services.details(id));
  },

  requestService: async (serviceId, data) => {
    return fetchWithAuth(API_ENDPOINTS.services.request, {
      method: 'POST',
      body: JSON.stringify({ serviceId, ...data })
    });
  },

  getUserRequests: async () => {
    return fetchWithAuth(API_ENDPOINTS.services.userRequests);
  }
};

// Payments API
export const paymentsApi = {
  createPayment: async (amount, serviceRequestId) => {
    return fetchWithAuth(API_ENDPOINTS.payments.create, {
      method: 'POST',
      body: JSON.stringify({ amount, serviceRequestId })
    });
  },

  verifyPayment: async (paymentId, transactionId) => {
    return fetchWithAuth(API_ENDPOINTS.payments.verify, {
      method: 'POST',
      body: JSON.stringify({ paymentId, transactionId })
    });
  },

  getHistory: async () => {
    return fetchWithAuth(API_ENDPOINTS.payments.history);
  }
};

// Notifications API
export const notificationsApi = {
  getAll: async () => {
    return fetchWithAuth(API_ENDPOINTS.notifications.list);
  },

  markAsRead: async (id) => {
    return fetchWithAuth(API_ENDPOINTS.notifications.markRead(id), {
      method: 'PUT'
    });
  }
};

// AI Assistant API
export const aiApi = {
  chat: async (message) => {
    return fetchWithAuth(API_ENDPOINTS.ai.chat, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }
};

// Contact API
export const contactApi = {
  submit: async (data) => {
    return fetchWithAuth(API_ENDPOINTS.contact, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

export { fetchWithAuth, API_BASE_URL };