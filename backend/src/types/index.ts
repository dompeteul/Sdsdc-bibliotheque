// backend/src/types/index.ts
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin' | 'librarian';
  createdAt: Date;
  updatedAt: Date;
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
  // Enriched fields
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
  requestedDate: Date;
  requestedTimeSlot: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}
