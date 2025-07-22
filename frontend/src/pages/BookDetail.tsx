import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { booksApi, consultationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Book } from '../types';
import { 
  BookOpen, User, Calendar, MapPin, Building, Hash, 
  FileText, Clock, Globe, Users, ArrowLeft, 
  CalendarPlus, CheckCircle, AlertCircle 
} from 'lucide-react';

const BookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Consultation request state
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [consultationLoading, setConsultationLoading] = useState(false);
  const [consultationSuccess, setConsultationSuccess] = useState(false);
  const [consultationError, setConsultationError] = useState('');
  
  const [consultationData, setConsultationData] = useState({
    requestedDate: '',
    requestedTimeSlot: '09:00',
    notes: ''
  });

  const timeSlots = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'
  ];

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const response = await booksApi.getBookById(parseInt(id));
        setBook(response.data);
      } catch (err: any) {
        setError(err.response?.status === 404 ? 'Livre non trouvé' : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id]);

  const handleConsultationRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;

    setConsultationError('');
    setConsultationLoading(true);

    try {
      await consultationsApi.createRequest({
        bookId: book.id,
        requestedDate: consultationData.requestedDate,
        requestedTimeSlot: consultationData.requestedTimeSlot,
        notes: consultationData.notes || undefined
      });

      setConsultationSuccess(true);
      setShowConsultationForm(false);
      
      // Reset form
      setConsultationData({
        requestedDate: '',
        requestedTimeSlot: '09:00',
        notes: ''
      });
    } catch (err: any) {
      setConsultationError(err.response?.data?.message || 'Erreur lors de la demande');
    } finally {
      setConsultationLoading(false);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Date non spécifiée';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAuthors = (author1?: string, author2?: string) => {
    if (!author1 && !author2) return 'Auteur non spécifié';
    if (!author2) return author1;
    return `${author1}, ${author2}`;
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="text-center py-12">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {error || 'Livre non trouvé'}
        </h2>
        <p className="text-gray-600 mb-6">
          Ce livre n'existe pas ou n'est plus disponible dans notre catalogue.
        </p>
        <Link
          to="/books"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </button>
      </div>

      {/* Consultation Success Message */}
      {consultationSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h3 className="text-green-800 font-semibold">Demande envoyée avec succès !</h3>
              <p className="text-green-700 text-sm">
                Votre demande de consultation a été transmise. Vous recevrez une notification 
                dès qu'elle sera traitée par l'équipe.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {book.section}
              </span>
              {book.location && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  📍 {book.location}
                </span>
              )}
              {book.format && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-mono">
                  {book.format}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {book.title}
            </h1>
            
            {book.subtitle && (
              <p className="text-xl text-gray-600 mb-4">
                {book.subtitle}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>{formatAuthors(book.author1, book.author2)}</span>
              </div>
              
              {book.publicationDate && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(book.publicationDate)}</span>
                </div>
              )}
              
              {book.publisher && (
                <div className="flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  <span>{book.publisher}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {book.summary && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Résumé</h2>
              <p className="text-gray-700 leading-relaxed">
                {book.summary}
              </p>
            </div>
          )}

          {/* Thematic Classification */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Classification thématique</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {book.generalTheme && (
                <div className="flex items-start">
                  <FileText className="h-4 w-4 mr-3 mt-1 text-purple-600" />
                  <div>
                    <dt className="font-medium text-gray-900">Thématique générale</dt>
                    <dd className="text-gray-600">{book.generalTheme}</dd>
                  </div>
                </div>
              )}
              
              {book.geography && (
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 mr-3 mt-1 text-green-600" />
                  <div>
                    <dt className="font-medium text-gray-900">Géographie</dt>
                    <dd className="text-gray-600">{book.geography}</dd>
                  </div>
                </div>
              )}
              
              {book.historicalPeriod && (
                <div className="flex items-start">
                  <Clock className="h-4 w-4 mr-3 mt-1 text-orange-600" />
                  <div>
                    <dt className="font-medium text-gray-900">Période historique</dt>
                    <dd className="text-gray-600">{book.historicalPeriod}</dd>
                  </div>
                </div>
              )}
              
              {book.majorEvent && (
                <div className="flex items-start">
                  <Globe className="h-4 w-4 mr-3 mt-1 text-red-600" />
                  <div>
                    <dt className="font-medium text-gray-900">Événement majeur</dt>
                    <dd className="text-gray-600">{book.majorEvent}</dd>
                  </div>
                </div>
              )}
              
              {book.groupsActors && (
                <div className="flex items-start">
                  <Users className="h-4 w-4 mr-3 mt-1 text-indigo-600" />
                  <div>
                    <dt className="font-medium text-gray-900">Groupes et acteurs</dt>
                    <dd className="text-gray-600">{book.groupsActors}</dd>
                  </div>
                </div>
              )}
              
              {book.sources && (
                <div className="flex items-start">
                  <FileText className="h-4 w-4 mr-3 mt-1 text-blue-600" />
                  <div>
                    <dt className="font-medium text-gray-900">Sources</dt>
                    <dd className="text-gray-600">{book.sources}</dd>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Book Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations</h3>
            <dl className="space-y-3">
              {book.isbn && (
                <div className="flex items-start">
                  <Hash className="h-4 w-4 mr-3 mt-1 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ISBN</dt>
                    <dd className="text-sm text-gray-900 font-mono">{book.isbn}</dd>
                  </div>
                </div>
              )}
              
              {book.pageCount && (
                <div className="flex items-start">
                  <BookOpen className="h-4 w-4 mr-3 mt-1 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Pages</dt>
                    <dd className="text-sm text-gray-900">{book.pageCount} pages</dd>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <Calendar className="h-4 w-4 mr-3 mt-1 text-gray-400" />
                <div>
                  <dt className="text-sm font-medium text-gray-500">Ajouté le</dt>
                  <dd className="text-sm text-gray-900">{formatDate(book.createdAt)}</dd>
                </div>
              </div>

              {book.entryId && (
                <div className="flex items-start">
                  <Hash className="h-4 w-4 mr-3 mt-1 text-gray-400" />
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Référence</dt>
                    <dd className="text-sm text-gray-900">#{book.entryId}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          {/* Consultation Request */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Consulter cet ouvrage
            </h3>
            
            {!isAuthenticated ? (
              <div className="text-center">
                <CalendarPlus className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  Connectez-vous pour demander une consultation sur place
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  Se connecter
                </Link>
              </div>
            ) : showConsultationForm ? (
              <form onSubmit={handleConsultationRequest} className="space-y-4">
                {consultationError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {consultationError}
                  </div>
                )}

                <div>
                  <label htmlFor="requestedDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date souhaitée
                  </label>
                  <input
                    type="date"
                    id="requestedDate"
                    value={consultationData.requestedDate}
                    onChange={(e) => setConsultationData(prev => ({ ...prev, requestedDate: e.target.value }))}
                    min={getTomorrowDate()}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                    disabled={consultationLoading}
                  />
                </div>

                <div>
                  <label htmlFor="requestedTimeSlot" className="block text-sm font-medium text-gray-700 mb-1">
                    Créneau horaire
                  </label>
                  <select
                    id="requestedTimeSlot"
                    value={consultationData.requestedTimeSlot}
                    onChange={(e) => setConsultationData(prev => ({ ...prev, requestedTimeSlot: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    required
                    disabled={consultationLoading}
                  >
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    id="notes"
                    value={consultationData.notes}
                    onChange={(e) => setConsultationData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Précisions sur votre demande..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={consultationLoading}
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={consultationLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {consultationLoading ? 'Envoi...' : 'Envoyer la demande'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConsultationForm(false)}
                    disabled={consultationLoading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <CalendarPlus className="mx-auto h-8 w-8 text-blue-600 mb-3" />
                <p className="text-sm text-gray-600 mb-4">
                  Demandez à consulter cet ouvrage sur place
                </p>
                <button
                  onClick={() => setShowConsultationForm(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Demander une consultation
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Consultation sur rendez-vous uniquement
                </p>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Consultation sur place
                </h4>
                <p className="text-sm text-blue-800">
                  Les ouvrages ne peuvent pas être empruntés mais sont consultables sur place 
                  sur rendez-vous. Votre demande sera traitée dans les plus brefs délais.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
