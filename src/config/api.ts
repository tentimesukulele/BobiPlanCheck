// API configuration
const API_CONFIG = {
  BASE_URL: 'http://bobeki.anglezko.eu/api',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// API endpoints
export const API_ENDPOINTS = {
  // Family endpoints
  FAMILY: {
    GET_ALL: '/family',
    GET_BY_ID: (id: number) => `/family/${id}`,
    CREATE: '/family',
    UPDATE: (id: number) => `/family/${id}`,
    DELETE: (id: number) => `/family/${id}`,
    UPDATE_PUSH_TOKEN: (id: number) => `/family/${id}/push-token`,
    GET_ACTIVITY: (id: number) => `/family/${id}/activity`,
  },

  // Task endpoints
  TASKS: {
    GET_ALL: '/tasks',
    GET_BY_ID: (id: number) => `/tasks/${id}`,
    CREATE: '/tasks',
    COMPLETE: (id: number) => `/tasks/${id}/complete`,
    REASSIGN: (id: number) => `/tasks/${id}/reassign`,
    DELETE: (id: number) => `/tasks/${id}`,
  },

  // Calendar endpoints
  CALENDAR: {
    GET_ALL: '/calendar',
    GET_BY_ID: (id: number) => `/calendar/${id}`,
    CREATE: '/calendar',
    RESPOND: (id: number) => `/calendar/${id}/respond`,
    UPDATE: (id: number) => `/calendar/${id}`,
    DELETE: (id: number) => `/calendar/${id}`,
    GET_UPCOMING: (days: number) => `/calendar/upcoming/${days}`,
  },

  // Schedule endpoints
  SCHEDULE: {
    GET_ALL: '/schedule',
    GET_BY_STUDENT: (id: number) => `/schedule/student/${id}`,
    GET_BY_ID: (id: number) => `/schedule/${id}`,
    CREATE: '/schedule',
    UPDATE: (id: number) => `/schedule/${id}`,
    DELETE: (id: number) => `/schedule/${id}`,
    GET_CURRENT_WEEK: '/schedule/current-week',
    GET_TODAY: (studentId: number) => `/schedule/today/${studentId}`,
    GET_WEEK: (studentId: number, weekType: string) => `/schedule/week/${studentId}/${weekType}`,
  },

  // Grades endpoints
  GRADES: {
    GET_ALL: '/grades',
    GET_ALL_STUDENTS: '/grades/all',
    GET_BY_ID: (id: number) => `/grades/${id}`,
    CREATE: '/grades',
    UPDATE: (id: number) => `/grades/${id}`,
    DELETE: (id: number) => `/grades/${id}`,
    GET_STATS: (studentId: number) => `/grades/stats/${studentId}`,
  },

  // Notification endpoints
  NOTIFICATIONS: {
    REGISTER_TOKEN: '/notifications/register-token',
    SEND: '/notifications/send',
    SEND_BULK: '/notifications/send-bulk',
    SCHEDULE: '/notifications/schedule',
    GET_QUEUE: '/notifications/queue',
    GET_STATS: '/notifications/stats',
    DELETE_TOKENS: (memberId: number) => `/notifications/tokens/${memberId}`,
    SEND_TEST: '/notifications/test',
    CANCEL_EVENT: (eventId: number) => `/notifications/cancel-event/${eventId}`,
  },
};

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any[];
  message?: string;
}

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export default API_CONFIG;