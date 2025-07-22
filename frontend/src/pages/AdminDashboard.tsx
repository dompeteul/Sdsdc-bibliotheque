import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { consultationsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ConsultationRequest } from '../types';
import { 
  Calendar, Clock, BookOpen, User, Mail, MapPin,
  CheckCircle, XCircle, AlertCircle, Hourglass,
  Settings, FileText, Edit3, MessageSquare
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConsultationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [editingRequest, setEditingRequest] = useState<number | null>(null);
  const [editData, setEditData] = useState({ status: '', adminNotes: '' });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await consultationsApi.getAllRequests();
      setRequests(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequest = async (requestId: number) => {
    if (!editData.status) return;

    setUpdating(true);
    try {
      await consultationsApi.updateRequest(requestId, {
        status: editData.status,
        adminNotes: editData.adminNotes || undefined
      });
      
      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: editData.status as any, adminNotes: editData.adminNotes }
          : req
      ));
      
      setEditingRequest(null);
      setEditData({ status: '', adminNotes: '' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  const startEditing = (request: ConsultationRequest) => {
    setEditingRequest(request.id);
    setEditData({
      status: request.status,
      adminNotes: request.adminNotes || ''
    });
  };

  const cancelEditing = () => {
    setEditingRequest(null);
    setEditData({ status: '', adminNotes: '' });
  };

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

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  // Sort by date (upcoming first, then by requested date)
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const aUpcoming = isUpcoming(a.requestedDate, a.status);
    const bUpcoming = isUpcoming(b.requestedDate, b.status);
    
    if (aUpcoming && !bUpcoming) return -1;
    if (!aUpcoming && bUpcoming) return 1;
    
    return new Date(a.requestedDate).getTime() - new Date(b.requestedDate).getTime();
  });

  // Statistics
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    upcoming: requests.filter(r => isUpcoming(r.requestedDate, r.status)).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-2">
            Gestion des demandes de consultation et du système
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            to="/add-book"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Ajouter un livre
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-gray-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Hourglass className="h-6 w-6 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-yellow-600">En attente</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-600">Approuvées</p>
              <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">À venir</p>
              <p className="text-2xl font-bold text-blue-900">{stats.upcoming}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-600">Terminées</p>
              <p className="text-2xl font-bold text-blue-900">{stats.completed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-red-600">Refusées</p>
              <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'Toutes', count: stats.total },
            { key: 'pending', label: 'En attente', count: stats.pending },
            { key: 'approved', label: 'Approuvées', count: stats.approved },
            { key: 'completed', label: 'Terminées', count: stats.completed },
            { key: 'rejected', label: 'Refusées', count: stats.rejected }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {sortedRequests.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune demande {filter !== 'all' ? `avec le statut "${filter}"` : ''}
            </h3>
            <p className="text-gray-600">
              {filter !== 'all' ? 'Essayez un autre filtre.' : 'Toutes les demandes apparaîtront ici.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Livre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRequests.map((request) => {
                  const statusInfo = getStatusInfo(request.status);
                  const StatusIcon = statusInfo.icon;
                  const isRequestUpcoming = isUpcoming(request.requestedDate, request.status);
                  const isRequestPast = isPast(request.requestedDate);
                  const isEditing = editingRequest === request.id;
                  
                  return (
                    <tr 
                      key={request.id} 
                      className={`${isRequestUpcoming ? 'bg-green-50' : ''} ${isEditing ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {request.firstName} {request.lastName}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="h-3 w-3 mr-1" />
                              {request.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
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
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {formatDate(request.requestedDate)}
                          </div>
                          <div className="flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-2" />
                            {request.requestedTimeSlot}
                          </div>
                          {isRequestPast && request.status !== 'completed' && (
                            <span className="text-xs text-red-500">(passée)</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Demandé le {formatDateTime(request.createdAt)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editData.status}
                            onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                            disabled={updating}
                          >
                            <option value="pending">En attente</option>
                            <option value="approved">Approuvée</option>
                            <option value="rejected">Refusée</option>
                            <option value="completed">Terminée</option>
                          </select>
                        ) : (
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bgColor}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.text}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={editData.adminNotes}
                              onChange={(e) => setEditData(prev => ({ ...prev, adminNotes: e.target.value }))}
                              placeholder="Note administrative (optionnelle)"
                              rows={2}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                              disabled={updating}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateRequest(request.id)}
                                disabled={updating || !editData.status}
                                className="text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-2 py-1 rounded"
                              >
                                {updating ? 'Envoi...' : 'Sauver'}
                              </button>
                              <button
                                onClick={cancelEditing}
                                disabled={updating}
                                className="text-xs border border-gray-300 text-gray-700 hover:bg-gray-50 px-2 py-1 rounded"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <button
                              onClick={() => startEditing(request)}
                              className="flex items-center text-blue-600 hover:text-blue-700"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Modifier
                            </button>
                            {(request.notes || request.adminNotes) && (
                              <div className="text-xs text-gray-600 max-w-xs">
                                {request.notes && (
                                  <div className="mb-1">
                                    <strong>Notes utilisateur:</strong> {request.notes}
                                  </div>
                                )}
                                {request.adminNotes && (
                                  <div>
                                    <strong>Notes admin:</strong> {request.adminNotes}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
