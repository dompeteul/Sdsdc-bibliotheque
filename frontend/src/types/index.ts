export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'librarian';
  createdAt?: Date;
}

export interface Book {
  id: number;
  entryId: number;
  location: string;
  section: string;
  title: string;
  subtitle?: string;
  author1?: string;
  author2?: string;
  publisher?: string;
  publicationDate?: Date;
  isbn?: string;
  format?: string;
  pageCount?: number;
  summary?: string;
  historicalPeriod?: string;
  generalTheme?: string;
  majorEvent?: string;
  geography?: string;
  groupsActors?: string;
  sources?: string;
  enrichedSummary?: string;
  subjects?: string[];
  genres?: string[];
  authorBio?: string;
  coverImageUrl?: string;
  externalLinks?: Record<string, string>;
  searchKeywords?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultationRequest {
  id: number;
  userId: number;
  bookId: number;
  requestedDate: string;
  requestedTimeSlot: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  title?: string;
  author1?: string;
  author2?: string;
  location?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface SearchFilters {
  search?: string;
  section?: string;
  author?: string;
  theme?: string;
  geography?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
