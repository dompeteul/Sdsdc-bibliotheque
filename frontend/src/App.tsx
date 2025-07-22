import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Books from './pages/Books';
import BookDetail from './pages/BookDetail';
import AddBook from './pages/AddBook';
import Login from './pages/Login';
import Register from './pages/Register';
import MyRequests from './pages/MyRequests';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/books" element={<Books />} />
            <Route path="/books/:id" element={<BookDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Member routes - require authentication */}
            <Route 
              path="/add-book" 
              element={
                <ProtectedRoute>
                  <AddBook />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-requests" 
              element={
                <ProtectedRoute>
                  <MyRequests />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin routes - require librarian/admin role */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireRole={['admin', 'librarian']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;

