export const API_ROOT = '/api/v1';

export const API_ENDPOINTS = {
  adminModeration: `${API_ROOT}/admin/moderation`,
  auth: `${API_ROOT}/Auth`,
  cars: `${API_ROOT}/Cars`,
  chats: `${API_ROOT}/chats`,
  masterData: `${API_ROOT}/MasterData`,
  notifications: `${API_ROOT}/notifications`,
  reports: `${API_ROOT}/reports`,
  reviews: `${API_ROOT}/reviews`,
  seller: `${API_ROOT}/seller`,
  sellers: `${API_ROOT}/sellers`,
  settings: `${API_ROOT}/settings`,
  users: `${API_ROOT}/users`,
  vehicleHistory: `${API_ROOT}/vehicle-history`,
} as const;
