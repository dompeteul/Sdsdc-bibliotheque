import { importData } from './scripts/importData';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

console.log('🔍 Environment Debug Info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);
console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 30) + '...');

console.log('🔍 Database-related environment variables:');
Object.keys(process.env).forEach(key => {
  if (key.startsWith('DATABASE') || key.startsWith('PG') || key.startsWith('POSTGRES')) {
    const value = process.env[key];
    if (key.includes('PASSWORD') || key.includes('SECRET')) {
      console.log(`${key}: [HIDDEN]`);
    } else {
      console.log(`${key}: ${value}`);
    }
  }
});

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration for separate frontend service
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || '', 
        /^https:\/\/.*\.railway\.app$/  // Allow any Railway subdomain
      ].filter(Boolean) // Remove any empty strings
    : ['http://localhost:3000'],
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import consultationRoutes from './routes/consultationRoutes';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/consultations', consultationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Library Management API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Simple homepage for backend API service
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SdSdC Bibliothèque API</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 900px; margin: 0 auto; padding: 20px; 
            background: #f8fafc; color: #1e293b;
          }
          .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          h1 { color: #2563eb; margin-bottom: 0.5rem; }
          .status { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.875rem; margin-bottom: 1rem; }
          .endpoint { background: #f1f5f9; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #3b82f6; }
          .endpoint strong { color: #1e40af; }
          a { color: #2563eb; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .section { margin: 2rem 0; }
          .demo-credentials { background: #fef3c7; border: 1px solid #f59e0b; padding: 1rem; border-radius: 6px; }
          .frontend-link { background: #dbeafe; border: 1px solid #3b82f6; padding: 1rem; border-radius: 6px; margin: 1rem 0; }
          .footer { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 0.875rem; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📚 SdSdC Bibliothèque API</h1>
          <div class="status">✅ Backend API en ligne</div>
          
          <p>Système de gestion de bibliothèque de la Société des Sciences de Châtellerault</p>
          
          <div class="frontend-link">
            <strong>🌐 Interface Web :</strong> L'interface utilisateur est déployée séparément.<br>
            <small>Consultez votre tableau de bord Railway pour l'URL du service frontend.</small>
          </div>
          
          <div class="section">
            <h2>🔓 Endpoints Publics</h2>
            <div class="endpoint">
              <strong><a href="/api/health">GET /api/health</a></strong><br>
              État de santé de l'API
            </div>
            <div class="endpoint">
              <strong><a href="/api/books">GET /api/books</a></strong><br>
              Parcourir le catalogue (accès libre)
            </div>
            <div class="endpoint">
              <strong><a href="/api/books/stats">GET /api/books/stats</a></strong><br>
              Statistiques de la bibliothèque
            </div>
          </div>
          
          <div class="section">
            <h2>🔐 Authentification</h2>
            <div class="endpoint">
              <strong>POST /api/auth/register</strong><br>
              Inscription nouvel utilisateur
            </div>
            <div class="endpoint">
              <strong>POST /api/auth/login</strong><br>
              Connexion utilisateur
            </div>
            
            <div class="demo-credentials">
              <strong>🔑 Compte de démonstration :</strong><br>
              Email: <code>admin@library.com</code><br>
              Mot de passe: <code>admin123</code>
            </div>
          </div>
          
          <div class="section">
            <h2>👥 Endpoints Membres</h2>
            <div class="endpoint">
              <strong>POST /api/books</strong><br>
              Ajouter un nouveau livre (membres uniquement)
            </div>
            <div class="endpoint">
              <strong>POST /api/consultations</strong><br>
              Demander une consultation (membres uniquement)
            </div>
            <div class="endpoint">
              <strong>GET /api/consultations</strong><br>
              Voir toutes les demandes (admin/bibliothécaire uniquement)
            </div>
          </div>
          
          <div class="footer">
            <p><strong>⚙️ Architecture :</strong> Backend API séparé du frontend React</p>
            <p><strong>📋 Version :</strong> 1.0.0 | <strong>🌍 Environnement :</strong> Production</p>
          </div>
        </div>
      </body>
    </html>
  `);
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

async function initializeDatabase() {
  try {
    // Import database functions
    const { query } = await import('./utils/database');
    
    console.log('🔧 Initializing database connection...');
    
    // Test connection with a simple query
    await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    
    console.log('📊 Checking if database has existing data...');
    const result = await query('SELECT COUNT(*) as count FROM books');
    const bookCount = parseInt(result.rows[0].count);
    
    if (bookCount === 0) {
      console.log('📚 Database is empty. Running CSV data import...');
      const { importData } = await import('./scripts/importData');
      await importData();
      console.log('✅ CSV data import completed!');
    } else {
      console.log(`📚 Database already has ${bookCount} books. Skipping import.`);
    }
  } catch (error: any) {
    if (error?.message?.includes('relation "books" does not exist')) {
      console.log('📚 Database tables don\'t exist. Running CSV data import...');
      try {
        const { importData } = await import('./scripts/importData');
        await importData();
        console.log('✅ CSV data import completed!');
      } catch (importError: any) {
        console.error('❌ Error during CSV data import:', importError.message);
        console.error('🔍 Full error:', importError);
      }
    } else {
      console.error('❌ Error checking database:', error?.message || error);
      console.error('🔍 Full error:', error);
      
      // Don't exit the process, let the server start anyway
      console.log('⚠️ Continuing without database initialization...');
    }
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 Library Management API ready`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  
  // Initialize database on startup
  await initializeDatabase();
});
