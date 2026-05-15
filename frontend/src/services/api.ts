import { AuthToken, Todo } from '../types';

const BASE_URL = 'http://localhost:8000';

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? 'Something went wrong');
  return data as T;
}

export const api = {
  register: (username: string, email: string, password: string) =>
    request<{ message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (username: string, password: string) =>
    request<AuthToken>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  getProtected: (token: string) =>
    request<{ message: string; user: string }>('/protected', {}, token),

  getTodos: (token: string) => request<Todo[]>('/todos', {}, token),

  createTodo: (title: string, token: string) =>
    request<Todo>('/todos', { method: 'POST', body: JSON.stringify({ title }) }, token),

  updateTodo: (id: string, updates: { title?: string; completed?: boolean }, token: string) =>
    request<Todo>(`/todos/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }, token),

  deleteTodo: (id: string, token: string) =>
    request<void>(`/todos/${id}`, { method: 'DELETE' }, token),
};
