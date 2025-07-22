import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { booksApi } from '../services/api';
import { BookPlus, Save, X } from 'lucide-react';

const AddBook: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author1: '',
    author2: '',
    publisher: '',
    publicationDate: '',
    isbn: '',
    format: '',
    pageCount: '',
    summary: '',
    section: '',
    location: '',
    historicalPeriod: '',
    generalTheme: '',
    majorEvent: '',
    geography: '',
    groupsActors: '',
    sources: ''
  });

  const sections = [
    'Histoire',
    'Patrimoine', 
    'Nature',
    'Sciences',
    'Littérature',
    'Art',
    'Philosophie',
    'Religion',
    'Géographie',
    'Biographie'
  ];

  const formats = [
    'MF', // Moyen Format
    'GF', // Grand Format
    'PF', // Petit Format
    'Broché',
    'Relié',
    'Numérique'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prepare data for submission
      const bookData = {
        ...formData,
        pageCount: formData.pageCount ? parseInt(formData.pageCount) : undefined,
        publicationDate: formData.publicationDate || undefined
      };

      // Remove empty strings
      Object.keys(bookData).forEach(key => {
        if (bookData[key as keyof typeof bookData] === '') {
          delete bookData[key as keyof typeof bookData];
        }
      });

      const response = await booksApi.addBook(bookData);
      setSuccess(true);
      
      // Redirect to the new book after a short delay
      setTimeout(() => {
        navigate(`/books/${response.data.book.id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout du livre');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/books');
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <BookPlus className="h-6 w-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Livre ajouté avec succès !</h2>
          <p className="text-green-700 mb-4">Le livre a été ajouté au catalogue et sera bientôt disponible pour consultation.</p>
          <p className="text-sm text-green-600">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ajouter un nouveau livre</h1>
        <p className="text-gray-600">
          Enrichissez notre collection en ajoutant un nouvel ouvrage au catalogue.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
        {/* Basic Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Informations de base</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Titre complet de l'ouvrage <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                Sous-titre
              </label>
              <input
                type="text"
                id="subtitle"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-1">
                Section <span className="text-red-500">*</span>
              </label>
              <select
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loading}
              >
                <option value="">Sélectionner une section</option>
                {sections.map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Localisation (emplacement physique)
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: A-2-4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Author Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Auteurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="author1" className="block text-sm font-medium text-gray-700 mb-1">
                Auteur principal
              </label>
              <input
                type="text"
                id="author1"
                name="author1"
                value={formData.author1}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="author2" className="block text-sm font-medium text-gray-700 mb-1">
                Auteur secondaire
              </label>
              <input
                type="text"
                id="author2"
                name="author2"
                value={formData.author2}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Publication Information */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Publication</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label htmlFor="publisher" className="block text-sm font-medium text-gray-700 mb-1">
                Éditeur
              </label>
              <input
                type="text"
                id="publisher"
                name="publisher"
                value={formData.publisher}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="publicationDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date de publication
              </label>
              <input
                type="date"
                id="publicationDate"
                name="publicationDate"
                value={formData.publicationDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-1">
                ISBN
              </label>
              <input
                type="text"
                id="isbn"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">Sélectionner un format</option>
                {formats.map(format => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="pageCount" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de pages
              </label>
              <input
                type="number"
                id="pageCount"
                name="pageCount"
                value={formData.pageCount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
              Résumé
            </label>
            <textarea
              id="summary"
              name="summary"
              value={formData.summary}
              onChange={handleChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        {/* Classification */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Classification thématique</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="generalTheme" className="block text-sm font-medium text-gray-700 mb-1">
                Thématique générale
              </label>
              <input
                type="text"
                id="generalTheme"
                name="generalTheme"
                value={formData.generalTheme}
                onChange={handleChange}
                placeholder="Ex: culture, politique, militaire"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="geography" className="block text-sm font-medium text-gray-700 mb-1">
                Géographie
              </label>
              <input
                type="text"
                id="geography"
                name="geography"
                value={formData.geography}
                onChange={handleChange}
                placeholder="Ex: France, Vienne, Europe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="historicalPeriod" className="block text-sm font-medium text-gray-700 mb-1">
                Période historique
              </label>
              <input
                type="text"
                id="historicalPeriod"
                name="historicalPeriod"
                value={formData.historicalPeriod}
                onChange={handleChange}
                placeholder="Ex: 20ème, 14ème, 39-45"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="majorEvent" className="block text-sm font-medium text-gray-700 mb-1">
                Événement majeur
              </label>
              <input
                type="text"
                id="majorEvent"
                name="majorEvent"
                value={formData.majorEvent}
                onChange={handleChange}
                placeholder="Ex: Cent ans, Révolution"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="groupsActors" className="block text-sm font-medium text-gray-700 mb-1">
                Groupes et acteurs
              </label>
              <input
                type="text"
                id="groupsActors"
                name="groupsActors"
                value={formData.groupsActors}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="sources" className="block text-sm font-medium text-gray-700 mb-1">
                Sources
              </label>
              <input
                type="text"
                id="sources"
                name="sources"
                value={formData.sources}
                onChange={handleChange}
                placeholder="Ex: Témoignages, Biographie, Essai"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            <X className="h-4 w-4" />
            <span>Annuler</span>
          </button>
          
          <button
            type="submit"
            disabled={loading || !formData.title || !formData.section}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-md transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Ajout en cours...' : 'Ajouter le livre'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBook;
