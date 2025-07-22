import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { booksApi } from '../services/api';
import { Book, SearchFilters } from '../types';
import { Search, Filter, BookOpen, User, Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const Books: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });

  const [filters, setFilters] = useState<SearchFilters>({
    search: searchParams.get('search') || '',
    section: searchParams.get('section') || '',
    author: searchParams.get('author') || '',
    theme: searchParams.get('theme') || '',
    geography: searchParams.get('geography') || '',
    page: 1,
    limit: 12
  });

  const [sections, setSections] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>([]);
  const [geographies, setGeographies] = useState<string[]>([]);

  // Load initial data and filter options
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load books with current filters
        const booksResponse = await booksApi.getBooks(filters);
        setBooks(booksResponse.data.books);
        setPagination(booksResponse.data.pagination);

        // Load filter options (if not already loaded)
        if (sections.length === 0) {
          const statsResponse = await booksApi.getBookStats();
          
          // Extract unique values for filters
          const allBooks = await booksApi.getBooks({ limit: 1000 }); // Get all books for filter options
          const allBooksData = allBooks.data.books;
          
          setSections(Array.from(new Set(allBooksData.map(b => b.section).filter(Boolean))));
          setThemes(Array.from(new Set(allBooksData.map(b => b.generalTheme).filter(Boolean))));
          setGeographies(Array.from(new Set(allBooksData.map(b => b.geography).filter(Boolean))));
        }
      } catch (err) {
        setError('Erreur lors du chargement des livres');
        console.error('Error loading books:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'limit') {
        params.set(key, value.toString());
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      section: '',
      author: '',
      theme: '',
      geography: '',
      page: 1,
      limit: 12
    });
  };

  const formatAuthors = (author1?: string, author2?: string) => {
    if (!author1 && !author2) return 'Auteur non spécifié';
    if (!author2) return author1;
    return `${author1}, ${author2}`;
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.getFullYear().toString();
  };

  if (loading && books.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catalogue des ouvrages</h1>
          <p className="text-gray-600 mt-2">
            {pagination.total} ouvrage{pagination.total > 1 ? 's' : ''} disponible{pagination.total > 1 ? 's' : ''}
          </p>
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className={`lg:block ${showFilters ? 'block' : 'hidden'} space-y-6`}>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recherche et filtres</h2>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Effacer
              </button>
            </div>

            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recherche générale
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Titre, auteur, résumé..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Section Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <select
                  value={filters.section}
                  onChange={(e) => handleFilterChange('section', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les sections</option>
                  {sections.map(section => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>

              {/* Author Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auteur
                </label>
                <input
                  type="text"
                  value={filters.author}
                  onChange={(e) => handleFilterChange('author', e.target.value)}
                  placeholder="Nom de l'auteur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Theme Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thématique
                </label>
                <select
                  value={filters.theme}
                  onChange={(e) => handleFilterChange('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les thématiques</option>
                  {themes.map(theme => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>

              {/* Geography Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Géographie
                </label>
                <select
                  value={filters.geography}
                  onChange={(e) => handleFilterChange('geography', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Toutes les géographies</option>
                  {geographies.map(geo => (
                    <option key={geo} value={geo}>{geo}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Books Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun livre trouvé</h3>
              <p className="text-gray-600 mb-4">
                Essayez de modifier vos critères de recherche ou de supprimer certains filtres.
              </p>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Effacer tous les filtres
              </button>
            </div>
          ) : (
            <>
              {/* Books Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {books.map((book) => (
                  <Link
                    key={book.id}
                    to={`/books/${book.id}`}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                  >
                    <div className="p-6">
                      {/* Book Header */}
                      <div className="mb-3">
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {book.section}
                        </span>
                        {book.location && (
                          <span className="inline-block ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            {book.location}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {book.title}
                      </h3>
                      
                      {book.subtitle && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                          {book.subtitle}
                        </p>
                      )}

                      {/* Author & Date */}
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <User className="h-4 w-4 mr-1" />
                        <span className="truncate">
                          {formatAuthors(book.author1, book.author2)}
                        </span>
                        {book.publicationDate && (
                          <>
                            <span className="mx-2">•</span>
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(book.publicationDate)}</span>
                          </>
                        )}
                      </div>

                      {/* Summary */}
                      {book.summary && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                          {book.summary}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {book.generalTheme && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                            {book.generalTheme}
                          </span>
                        )}
                        {book.geography && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {book.geography}
                          </span>
                        )}
                        {book.historicalPeriod && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                            {book.historicalPeriod}
                          </span>
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                        <span>
                          {book.pageCount ? `${book.pageCount} pages` : ''}
                          {book.publisher && (
                            <span>{book.pageCount ? ' • ' : ''}{book.publisher}</span>
                          )}
                        </span>
                        {book.format && (
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                            {book.format}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Précédent
                  </button>

                  <div className="flex space-x-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-md ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="flex items-center px-3 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Books;
