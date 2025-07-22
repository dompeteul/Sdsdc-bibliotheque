import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { booksApi } from '../services/api';
import { BookOpen, Users, Search, Calendar } from 'lucide-react';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await booksApi.getBookStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bienvenue à la Bibliothèque SdSdC
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Explorez librement notre collection de livres et articles. Devenez membre pour ajouter de nouveaux ouvrages et réserver des consultations sur place.
        </p>
        
        <div className="flex justify-center space-x-4">
          <Link
            to="/books"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Explorer le catalogue
          </Link>
          {!isAuthenticated ? (
            <Link
              to="/register"
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold"
            >
              Devenir membre
            </Link>
          ) : (
            <Link
              to="/add-book"
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold"
            >
              Ajouter un livre
            </Link>
          )}
        </div>
      </div>

      {/* Stats Section */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Total Ouvrages</p>
                <p className="text-2xl font-bold">{stats.overview.total_books}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Auteurs</p>
                <p className="text-2xl font-bold">{stats.overview.total_authors}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Sections</p>
                <p className="text-2xl font-bold">{stats.overview.total_sections}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Thèmes</p>
                <p className="text-2xl font-bold">{stats.overview.total_themes}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sections Overview */}
      {!loading && stats && stats.sections.length > 0 && (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Nos Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.sections.map((section: any) => (
              <Link
                key={section.section}
                to={`/books?section=${encodeURIComponent(section.section)}`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-semibold text-gray-900">{section.section}</h3>
                <p className="text-sm text-gray-600">{section.count} ouvrages</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* How it Works */}
      <div className="bg-white rounded-lg p-8 shadow-sm border">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Comment ça marche ?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">1. Rechercher</h3>
            <p className="text-gray-600 text-sm">
              Parcourez librement notre catalogue - aucun compte requis
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">2. Devenir membre</h3>
            <p className="text-gray-600 text-sm">
              Inscrivez-vous pour ajouter des livres et réserver des consultations
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">3. Réserver</h3>
            <p className="text-gray-600 text-sm">
              Membres: demandez une consultation sur place
            </p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">4. Consulter</h3>
            <p className="text-gray-600 text-sm">
              Consultez l'ouvrage sur place au créneau réservé
            </p>
          </div>
        </div>

        {/* Access levels info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">🔓 Accès libre</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Consulter le catalogue complet</li>
              <li>• Rechercher par auteur, titre, thème</li>
              <li>• Voir les détails des ouvrages</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-3">🔐 Accès membre</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Ajouter de nouveaux ouvrages</li>
              <li>• Demander des consultations sur place</li>
              <li>• Gérer ses demandes de consultation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
