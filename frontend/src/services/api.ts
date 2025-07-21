import axios from 'axios';
import { User, Book, ConsultationRequest, SearchFilters, PaginatedResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),
  
  register: (userData: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post<{ user: User; token: string }>('/auth/register', userData),
  
  getProfile: () =>
    api.get<User>('/auth/profile'),
};

// Books API
export const booksApi = {
  getBooks: (filters: SearchFilters) =>
    api.get<{ books: Book[]; pagination: any }>('/books', { params: filters }),
  
  getBookById: (id: number) =>
    api.get<Book>(`/books/${id}`),
  
  getBookSuggestions: (query: string) =>
    api.get<Partial<Book>[]>('/books/suggestions', { params: { query } }),
  
  getBookStats: () =>
    api.get<{ overview: any; sections: any[] }>('/books/stats'),

  addBook: (bookData: Partial<Book>) =>
    api.post<{ book: Book }>('/books', bookData),

  updateBook: (id: number, bookData: Partial<Book>) =>
    api.put<{ book: Book }>(`/books/${id}`, bookData),
};

// Consultations API
export const consultationsApi = {
  createRequest: (data: {
    bookId: number;
    requestedDate: string;
    requestedTimeSlot: string;
    notes?: string;
  }) =>
    api.post<{ request: ConsultationRequest }>('/consultations', data),
  
  getUserRequests: () =>
    api.get<ConsultationRequest[]>('/consultations/my-requests'),
  
  getAllRequests: () =>
    api.get<ConsultationRequest[]>('/consultations'),
  
  updateRequest: (id: number, data: { status: string; adminNotes?: string }) =>
    api.put<{ request: ConsultationRequest }>(`/consultations/${id}`, data),
};
