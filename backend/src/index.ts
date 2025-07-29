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

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-app.railway.app'] 
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

// Simple homepage for production
if (process.env.NODE_ENV === 'production') {
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>SdSdC Bibliothèque API</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #2563eb; }
            .endpoint { background: #f3f4f6; padding: 10px; margin: 10px 0; border-radius: 5px; }
            a { color: #2563eb; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>🚀 SdSdC Bibliothèque API</h1>
          <p>Backend API is running successfully!</p>
          
          <h2>Available Public Endpoints:</h2>
          <div class="endpoint">
            <strong><a href="/api/health">GET /api/health</a></strong><br>
            Health check endpoint
          </div>
          <div class="endpoint">
            <strong><a href="/api/books">GET /api/books</a></strong><br>
            Browse books catalog (public access)
          </div>
          <div class="endpoint">
            <strong><a href="/api/books/stats">GET /api/books/stats</a></strong><br>
            Library statistics
          </div>
          
          <h2>Authentication Endpoints:</h2>
          <div class="endpoint">
            <strong>POST /api/auth/register</strong><br>
            Register new user
          </div>
          <div class="endpoint">
            <strong>POST /api/auth/login</strong><br>
            User login
          </div>
          
          <h2>Member Endpoints (requires authentication):</h2>
          <div class="endpoint">
            <strong>POST /api/books</strong><br>
            Add new book (members only)
          </div>
          <div class="endpoint">
            <strong>POST /api/consultations</strong><br>
            Request consultation (members only)
          </div>
          
          <p><em>Status: Backend deployed successfully. Frontend will be added in next deployment.</em></p>
          <p><strong>Next steps:</strong> Import your Excel data using the import script.</p>
        </body>
      </html>
    `);
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

async function initializeDatabase() {
  try {
    // Check if books table has any data
    const { query } = await import('./utils/database');
    const result = await query('SELECT COUNT(*) as count FROM books');
    const bookCount = parseInt(result.rows[0].count);
    
    if (bookCount === 0) {
      console.log('📚 Database is empty. Running data import...');
      await importData();
      console.log('✅ Data import completed!');
    } else {
      console.log(`📚 Database already has ${bookCount} books. Skipping import.`);
    }
  } catch (error: any) {
    if (error?.message?.includes('relation "books" does not exist')) {
      console.log('📚 Database tables don\'t exist. Running data import...');
      try {
        await importData();
        console.log('✅ Data import completed!');
      } catch (importError: any) {
        console.error('❌ Error during data import:', importError.message);
      }
    } else {
      console.error('❌ Error checking database:', error?.message || error);
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
