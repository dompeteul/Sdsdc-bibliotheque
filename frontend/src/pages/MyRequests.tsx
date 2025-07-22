import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { consultationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ConsultationRequest } from '../types';
import { 
  Calendar, Clock, BookOpen, MapPin, User, 
  CheckCircle, XCircle, AlertCircle, Hourglass,
  Plus, FileText
} from 'lucide-react';

const MyRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const response = await consultationsApi.getUserRequests();
        setRequests(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erreur lors du chargement des demandes');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: Hourglass,
          text: 'En attente',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      case 'approved':
        return {
          icon: CheckCircle,
          text: 'Approuvée',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return {
          icon: XCircle,
          text: 'Refusée',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'completed':
        return {
          icon: CheckCircle,
          text: 'Terminée',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          icon: AlertCircle,
          text: 'Inconnu',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (date: string, status: string) => {
    const requestDate = new Date(date);
    const now = new Date();
    return requestDate > now && (status === 'approved' || status === 'pending');
  };

  const isPast = (date: string) => {
    const requestDate = new Date(date);
    const now = new Date();
    return requestDate < now;
  };

  // Group requests by status
  const groupedRequests = {
    upcoming: requests.filter(r => isUpcoming(r.requestedDate, r.status)),
    pending: requests.filter(r => r.status === 'pending' && !isUpcoming(r.requestedDate, r.status)),
    approved: requests.filter(r => r.status === 'approved' && !isUpcoming(r.requestedDate, r.status)),
    completed: requests.filter(r => r.status === 'completed'),
    rejected: requests.filter(r => r.status === 'rejected')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mes demandes de consultation</h1>
          <p className="text-gray-600 mt-2">
            Gérez vos demandes de consultation et suivez leur statut
          </p>
        </div>
        <Link
          to="/books"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Aucune demande de consultation
          </h2>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas encore fait de demande de consultation. 
            Parcourez notre catalogue pour découvrir nos ouvrages.
          </p>
          <Link
            to="/books"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Explorer le catalogue
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Consultations */}
          {groupedRequests.upcoming.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Consultations à venir ({groupedRequests.upcoming.length})
              </h2>
              <div className="grid gap-4">
                {groupedRequests.upcoming.map((request) => {
                  const statusInfo = getStatusInfo(request.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div
                      key={request.id}
                      className={`bg-white border rounded-lg p-6 ${statusInfo.borderColor} ${statusInfo.bgColor}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <Link 
                            to={`/books/${request.bookId}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {request.title}
                          </Link>
                          <div className="flex items-center text-sm text-gray-600 mt-1">
                            <User className="h-4 w-4 mr-1" />
                            <span>{request.author1}{request.author2 ? `, ${request.author2}` : ''}</span>
                            {request.location && (
                              <>
                                <span className="mx-2">•</span>
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{request.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
                          <StatusIcon className="h-4 w-4 mr-1" />
                          {statusInfo.text}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm font-medium">{formatDate(request.requestedDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-sm">{request.requestedTimeSlot}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          Demandé le {formatDateTime(request.createdAt)}
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600">
                            <strong>Vos notes:</strong> {request.notes}
                          </p>
                        </div>
                      )}

                      {request.adminNotes && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-sm">
                            <strong className="text-blue-900">Note de l'équipe:</strong>
                            <span className="text-blue-800 ml-1">{request.adminNotes}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Requests Table */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-gray-600" />
              Toutes les demandes ({requests.length})
            </h2>
            
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Livre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date demandée
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Horaire
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Demandé le
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => {
                      const statusInfo = getStatusInfo(request.status);
                      const StatusIcon = statusInfo.icon;
                      const isRequestUpcoming = isUpcoming(request.requestedDate, request.status);
                      const isRequestPast = isPast(request.requestedDate);
                      
                      return (
                        <tr key={request.id} className={isRequestUpcoming ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4">
                            <div>
                              <Link 
                                to={`/books/${request.bookId}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600"
                              >
                                {request.title}
                              </Link>
                              <div className="text-sm text-gray-500">
                                {request.author1}{request.author2 ? `, ${request.author2}` : ''}
                              </div>
                              {request.location && (
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {request.location}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${isRequestPast && request.status !== 'completed' ? 'text-gray-500' : 'text-gray-900'}`}>
                              {formatDate(request.requestedDate)}
                              {isRequestPast && request.status !== 'completed' && (
                                <span className="text-xs text-gray-400 block">(passée)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.requestedTimeSlot}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.text}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(request.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <Hourglass className="h-6 w-6 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm text-yellow-600">En attente</p>
                  <p className="text-xl font-bold text-yellow-900">{groupedRequests.pending.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-600">Approuvées</p>
                  <p className="text-xl font-bold text-green-900">{groupedRequests.approved.length + groupedRequests.upcoming.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-blue-600">Terminées</p>
                  <p className="text-xl font-bold text-blue-900">{groupedRequests.completed.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-6 w-6 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-red-600">Refusées</p>
                  <p className="text-xl font-bold text-red-900">{groupedRequests.rejected.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequests;
