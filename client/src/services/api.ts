const BASE_URL = ''; // Proxied by Vite to http://localhost:5000 in development

export class ApiRequestError extends Error {
  public status: number;
  public details?: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const api = {
  request: async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;

    // Get auth token from local storage
    const token = localStorage.getItem('trimaki_token');
    const headers = new Headers(options.headers || {});

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, config);

    let data;
    let contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    // Intercept 401 Unauthorized errors and attempt to silently refresh token
    if (
      response.status === 401 &&
      !endpoint.includes('/auth/login') &&
      !endpoint.includes('/auth/refresh') &&
      !endpoint.includes('/auth/google')
    ) {
      const refreshToken = localStorage.getItem('trimaki_refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            const { accessToken, refreshToken: newRefreshToken } = refreshData.data || refreshData;

            localStorage.setItem('trimaki_token', accessToken);
            localStorage.setItem('trimaki_refresh_token', newRefreshToken);

            // Re-apply Authorization header and retry the request
            headers.set('Authorization', `Bearer ${accessToken}`);
            response = await fetch(url, {
              ...config,
              headers,
            });

            contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              data = await response.json();
            } else {
              data = { message: await response.text() };
            }
          }
        } catch (refreshErr) {
          console.error('Silent token refresh failed:', refreshErr);
        }
      }
    }

    if (!response.ok) {
      throw new ApiRequestError(
        response.status,
        data.message || 'Something went wrong',
        data.errors
      );
    }

    return (data.data !== undefined ? data.data : data) as T;
  },

  get: <T>(endpoint: string, options?: RequestInit) =>
    api.request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: any, options?: RequestInit) =>
    api.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: any, options?: RequestInit) =>
    api.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    api.request<T>(endpoint, { ...options, method: 'DELETE' }),
};
export default api;
