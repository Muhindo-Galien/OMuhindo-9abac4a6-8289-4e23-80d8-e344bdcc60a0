// Generic API Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

// Paginated Response Interface
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// API Error Interface
export interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  timestamp: Date;
  path: string;
  details?: Record<string, any>;
}

// Validation Error Details
export interface ValidationErrorDetail {
  field: string;
  value: any;
  constraints: Record<string, string>;
}

// Health Check Response
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: Date;
  uptime: number;
  memory: {
    used: number;
    total: number;
  };
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
}
