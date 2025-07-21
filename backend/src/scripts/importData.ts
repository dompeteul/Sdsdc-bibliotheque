import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { query } from '../utils/database';
import dotenv from 'dotenv';

dotenv.config();

interface ExcelBookRow {
  'Ent. SdSdC': number;
  'Localisation': string;
  'Section': string;
  'Titre complet de l\'ouvrage': string;
  'Sous titre'?: string;
  'Auteur 1'?: string;
  'auteur 2'?: string;
  'Editeur'?: string;
  'Date de Publ.'?: Date;
  'ISBN'?: number | string;
  'Format'?: string;
  'nb pages'?: number;
  'résumé'?: string;
  'Pérlode Hist'?: string;
  'Thématique Générale'?: string;
  'Evt Majeur'?: string;
  'Géographie'?: string;
  'Groupes et acteurs'?: string;
  'Sources'?: string;
}

async function createTables() {
  console.log('Creating database tables...');
  
  // Create users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create books table
  await query(`
    CREATE TABLE IF NOT EXISTS books (
      id SERIAL PRIMARY KEY,
      entry_id INTEGER UNIQUE,
      location VARCHAR(50),
      section VARCHAR(100),
      title VARCHAR(500) NOT NULL,
      subtitle VARCHAR(500),
      author_1 VARCHAR(200),
      author_2 VARCHAR(200),
      publisher VARCHAR(200),
      publication_date DATE,
      isbn VARCHAR(20),
      format VARCHAR(20),
      page_count INTEGER,
      summary TEXT,
      historical_period VARCHAR(100),
      general_theme VARCHAR(200),
      major_event VARCHAR(200),
      geography VARCHAR(200),
      groups_actors VARCHAR(500),
      sources VARCHAR(200),
      enriched_summary TEXT,
      subjects JSONB,
      genres JSONB,
      author_bio TEXT,
      cover_image_url VARCHAR(500),
      external_links JSONB,
      search_keywords TEXT[],
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create consultation requests table
  await query(`
    CREATE TABLE IF NOT EXISTS consultation_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      book_id INTEGER REFERENCES books(id),
      requested_date DATE NOT NULL,
      requested_time_slot TIME NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      admin_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  await query(`
    CREATE INDEX IF NOT EXISTS idx_books_title ON books USING GIN (to_tsvector('french', title));
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_books_summary ON books USING GIN (to_tsvector('french', COALESCE(summary, '')));
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_books_section ON books(section);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_1, author_2);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_consultation_requests_user ON consultation_requests(user_id);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_consultation_requests_book ON consultation_requests(book_id);
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_consultation_requests_date ON consultation_requests(requested_date);
  `);

  console.log('Database tables created successfully!');
}

function readExcelFile(filePath: string): ExcelBookRow[] {
  console.log(`Reading Excel file: ${filePath}`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = 'Biblio';
  
  if (!workbook.Sheets[sheetName]) {
    throw new Error(`Sheet "${sheetName}" not found in Excel file`);
  }

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelBookRow[];
  
  console.log(`Found ${jsonData.length} records in Excel file`);
  return jsonData;
}

function cleanData(data: ExcelBookRow[]): any[] {
  return data.map(row => {
    // Clean and format the data
    const publicationDate = row['Date de Publ.'] ? new Date(row['Date de Publ.']) : null;
    const isbn = row['ISBN'] ? String(row['ISBN']) : null;
    
    return {
      entry_id: row['Ent. SdSdC'],
      location: row['Localisation']?.trim() || null,
      section: row['Section']?.trim() || null,
      title: row['Titre complet de l\'ouvrage']?.trim() || 'Titre non spécifié',
      subtitle: row['Sous titre']?.trim() || null,
      author_1: row['Auteur 1']?.trim() || null,
      author_2: row['auteur 2']?.trim() || null,
      publisher: row['Editeur']?.trim() || null,
      publication_date: publicationDate,
      isbn: isbn,
      format: row['Format']?.trim() || null,
      page_count: row['nb pages'] || null,
      summary: row['résumé']?.trim() || null,
      historical_period: row['Pérlode Hist']?.trim() || null,
      general_theme: row['Thématique Générale']?.trim() || null,
      major_event: row['Evt Majeur']?.trim() || null,
      geography: row['Géographie']?.trim() || null,
      groups_actors: row['Groupes et acteurs']?.trim() || null,
      sources: row['Sources']?.trim() || null
    };
  }).filter(row => row.entry_id && row.title); // Filter out rows without essential data
}

async function insertBooks(books: any[]) {
  console.log(`Inserting ${books.length} books into database...`);

  const insertQuery = `
    INSERT INTO books (
      entry_id, location, section, title, subtitle, author_1, author_2,
      publisher, publication_date, isbn, format, page_count, summary,
      historical_period, general_theme, major_event, geography,
      groups_actors, sources
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
    ) ON CONFLICT (entry_id) DO UPDATE SET
      location = EXCLUDED.location,
      section = EXCLUDED.section,
      title = EXCLUDED.title,
      subtitle = EXCLUDED.subtitle,
      author_1 = EXCLUDED.author_1,
      author_2 = EXCLUDED.author_2,
      publisher = EXCLUDED.publisher,
      publication_date = EXCLUDED.publication_date,
      isbn = EXCLUDED.isbn,
      format = EXCLUDED.format,
      page_count = EXCLUDED.page_count,
      summary = EXCLUDED.summary,
      historical_period = EXCLUDED.historical_period,
      general_theme = EXCLUDED.general_theme,
      major_event = EXCLUDED.major_event,
      geography = EXCLUDED.geography,
      groups_actors = EXCLUDED.groups_actors,
      sources = EXCLUDED.sources,
      updated_at = CURRENT_TIMESTAMP
  `;

  for (const book of books) {
    try {
      await query(insertQuery, [
        book.entry_id, book.location, book.section, book.title, book.subtitle,
        book.author_1, book.author_2, book.publisher, book.publication_date,
        book.isbn, book.format, book.page_count, book.summary,
        book.historical_period, book.general_theme, book.major_event,
        book.geography, book.groups_actors, book.sources
      ]);
    } catch (error) {
      console.error(`Error inserting book with entry_id ${book.entry_id}:`, error);
    }
  }

  console.log('Books inserted successfully!');
}

async function createDefaultAdmin() {
  console.log('Creating default admin user...');
  
  const bcrypt = require('bcrypt');
  const password = 'admin123'; // Change this in production!
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['admin@library.com', hashedPassword, 'Admin', 'User', 'admin']);
    
    console.log('Default admin user created: admin@library.com / admin123');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting data import process...');
    
    // Create database tables
    await createTables();
    
    // Create default admin user
    await createDefaultAdmin();
    
    // Find Excel file
    const possiblePaths = [
      path.join(process.cwd(), 'SdSdC  Biblio V0.8.xlsm'),
      path.join(process.cwd(), 'data', 'SdSdC  Biblio V0.8.xlsm'),
      path.join(__dirname, '..', '..', 'SdSdC  Biblio V0.8.xlsm'),
      path.join(__dirname, '..', '..', '..', 'SdSdC  Biblio V0.8.xlsm'),
    ];
    
    let excelPath: string | null = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        excelPath = testPath;
        break;
      }
    }
    
    if (!excelPath) {
      console.log('Excel file not found automatically. Please specify the path:');
      console.log('Usage: npm run import-data [path-to-excel-file]');
      console.log('Looked in paths:', possiblePaths);
      return;
    }
    
    // Read Excel data
    const rawData = readExcelFile(excelPath);
    
    // Clean and format data
    const cleanedBooks = cleanData(rawData);
    console.log(`Processed ${cleanedBooks.length} valid book records`);
    
    // Insert into database
    await insertBooks(cleanedBooks);
    
    console.log('✅ Data import completed successfully!');
    console.log(`📚 Imported ${cleanedBooks.length} books`);
    console.log('👤 Created default admin user: admin@library.com');
    
  } catch (error) {
    console.error('❌ Error during data import:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  main().then(() => process.exit(0));
}

export { main as importData };
