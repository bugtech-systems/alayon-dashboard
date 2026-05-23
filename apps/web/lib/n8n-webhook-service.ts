// lib/n8n.service.ts

interface WebhookResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.sharewin.pro/webhook';
const API_TOKEN = process.env.NEXT_PUBLIC_N8N_API_TOKEN;

async function n8nRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: any;
    params?: Record<string, any>;
  } = {}
): Promise<WebhookResponse<T>> {
  try {
    const url = new URL(`${BASE_URL}${endpoint}`);
    
    // Add query params
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, String(value));
      });
    }

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (API_TOKEN) headers['Authorization'] = `Bearer ${API_TOKEN}`;

    const res = await fetch(url.toString(), {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await res.json();
    
    if (!res.ok) return { success: false, error: data.message || 'Request failed' };
    
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Export convenience methods
export const n8n = {
  get: <T = any>(endpoint: string, params?: Record<string, any>) => 
    n8nRequest<T>(endpoint, { method: 'GET', params }),
  
  post: <T = any>(endpoint: string, body?: any) => 
    n8nRequest<T>(endpoint, { method: 'POST', body }),
  
  put: <T = any>(endpoint: string, body?: any) => 
    n8nRequest<T>(endpoint, { method: 'PUT', body }),
  
  delete: <T = any>(endpoint: string, params?: Record<string, any>) => 
    n8nRequest<T>(endpoint, { method: 'DELETE', params }),
  
  paginated: async <T = any>(
    endpoint: string,
    page: number = 1,
    pageSize: number = 10,
    filters?: Record<string, any>
  ) => {
    const res = await n8nRequest<{
      data: T[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(endpoint, { method: 'GET', params: { page, pageSize, ...filters } });
    
    if (!res.success) return res;
    
    return {
      success: true,
      data: {
        data: res.data!.data,
        total: res.data!.total,
        page: res.data!.page,
        pageSize: res.data!.pageSize,
        totalPages: res.data!.totalPages,
        hasNext: res.data!.page < res.data!.totalPages,
        hasPrevious: res.data!.page > 1,
      },
    };
  },
};