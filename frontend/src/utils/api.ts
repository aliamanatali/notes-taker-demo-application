const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// Types for API responses
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ApiNote {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface NoteRequest {
  title: string;
  content: string;
}

// Auth token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem("auth_token", token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem("auth_token");
};

// API request helper with auth
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid, remove it
    removeAuthToken();
    throw new Error("Authentication required");
  }

  return response;
};

// Authentication API calls
export const registerUser = async (
  data: RegisterRequest
): Promise<{ message: string }> => {
  const response = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }

  return response.json();
};

export const loginUser = async (data: LoginRequest): Promise<AuthResponse> => {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Login failed");
  }

  return response.json();
};

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiRequest("/auth/me");

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get user info");
  }

  return response.json();
};

// Notes API calls
export const getNotes = async (search?: string): Promise<ApiNote[]> => {
  const searchParam = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await apiRequest(`/notes${searchParam}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch notes");
  }

  return response.json();
};

export const createNote = async (data: NoteRequest): Promise<ApiNote> => {
  const response = await apiRequest("/notes", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create note");
  }

  return response.json();
};

export const updateNote = async (
  noteId: string,
  data: NoteRequest
): Promise<ApiNote> => {
  const response = await apiRequest(`/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update note");
  }

  return response.json();
};

export const deleteNote = async (
  noteId: string
): Promise<{ message: string }> => {
  const response = await apiRequest(`/notes/${noteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete note");
  }

  return response.json();
};

export const getNote = async (noteId: string): Promise<ApiNote> => {
  const response = await apiRequest(`/notes/${noteId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch note");
  }

  return response.json();
};

// Generic API helper for additional endpoints
export const api = {
  get: async (endpoint: string) => {
    const response = await apiRequest(endpoint);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.detail || "API request failed");
    }
    return { data: await response.json() };
  },
  post: async (endpoint: string, body: any) => {
    const response = await apiRequest(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.detail || "API request failed");
    }
    return { data: await response.json() };
  },
};
