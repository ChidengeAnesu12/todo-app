export interface User {
  username: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  username: string;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface ApiError {
  detail: string;
}
