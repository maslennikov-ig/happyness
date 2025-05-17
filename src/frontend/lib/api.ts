/**
 * Базовый API клиент для взаимодействия с бэкендом
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiOptions {
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

interface ApiError {
  statusCode: number;
  message: string;
  error: string;
  details?: any;
}

/**
 * Базовый метод для выполнения HTTP запросов к API
 */
async function fetchApi<T>(
  endpoint: string,
  method: string = 'GET',
  options: ApiOptions = {}
): Promise<T> {
  const { headers = {}, body, params } = options;

  // Добавляем токен авторизации, если он есть
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // Формируем URL с параметрами запроса
  const url = new URL(`${API_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.message || 'Произошла ошибка при выполнении запроса');
    }

    return data as T;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * API клиент с методами для различных эндпоинтов
 */
export const api = {
  // Аутентификация
  auth: {
    login: (email: string, password: string) =>
      fetchApi('/auth/login', 'POST', { body: { email, password } }),
    register: (email: string, password: string, name?: string) =>
      fetchApi('/auth/register', 'POST', { body: { email, password, name } }),
    me: () => fetchApi('/auth/me'),
  },

  // Проекты
  projects: {
    getAll: (params?: Record<string, string>) => fetchApi('/projects', 'GET', { params }),
    getById: (id: string) => fetchApi(`/projects/${id}`),
    create: (data: any) => fetchApi('/projects', 'POST', { body: data }),
    update: (id: string, data: any) => fetchApi(`/projects/${id}`, 'PUT', { body: data }),
    delete: (id: string) => fetchApi(`/projects/${id}`, 'DELETE'),
  },

  // Запросы
  requests: {
    getAll: (params?: Record<string, string>) => fetchApi('/requests', 'GET', { params }),
    getById: (id: string) => fetchApi(`/requests/${id}`),
    create: (data: any) => fetchApi('/requests', 'POST', { body: data }),
    update: (id: string, data: any) => fetchApi(`/requests/${id}`, 'PUT', { body: data }),
    delete: (id: string) => fetchApi(`/requests/${id}`, 'DELETE'),
  },

  // Подрядчики
  contractors: {
    getAll: (params?: Record<string, string>) => fetchApi('/contractors', 'GET', { params }),
    getById: (id: string) => fetchApi(`/contractors/${id}`),
  },
};
