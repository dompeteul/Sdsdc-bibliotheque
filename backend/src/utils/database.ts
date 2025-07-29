import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Debug: Log connection info (remove password for security)
console.log('🔗 Database connection info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20) + '...');

// Additional debug for individual vars
console.log('PGHOST:', process.env.PGHOST);
console.log('PGPORT:', process.env.PGPORT);
console.log('PGDATABASE:', process.env.PGDATABASE);
console.log('PGUSER:', process.env.PGUSER);
console.log('PGPASSWORD exists:', !!process.env.PGPASSWORD);

// Create connection pool with fallback options
const poolConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
} : {
  host: process.env.PGHOST,
  port: parseInt(process.env.PGPORT || '5432'),
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

console.log('🔧 Using connection config:', {
  ...poolConfig,
  password: poolConfig.password ? '[HIDDEN]' : undefined,
  connectionString: poolConfig.connectionString ? poolConfig.connectionString.substring(0, 30) + '...' : undefined
});

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // Increased timeout
});

// Connection event handlers
pool.on('connect', (client) => {
  console.log('🔗 New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('💥 PostgreSQL pool error:', err.message);
});

pool.on('remove', () => {
  console.log('🔌 Client removed from PostgreSQL pool');
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { 
      text: text.substring(0, 50) + '...', 
      duration: `${duration}ms`, 
      rows: res.rowCount 
    });
    return res;
  } catch (error: any) {
    console.error('❌ Database query error:', error.message);
    console.error('🔍 Failed query:', text.substring(0, 100) + '...');
    throw error;
  }
};

export const getClient = async () => {
  try {
    const client = await pool.connect();
    return client;
  } catch (error: any) {
    console.error('❌ Error getting database client:', error.message);
    throw error;
  }
};

export default pool;
