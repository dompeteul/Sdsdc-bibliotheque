import * as fs from 'fs';
import * as path from 'path';
import { query } from '../utils/database';
import dotenv from 'dotenv';

dotenv.config();

interface CSVBookRow {
  'Ent. SdSdC': string;
  'Localisation': string;
  'Section': string;
  'Titre complet de l\'ouvrage': string;
  'Sous titre'?: string;
  'Auteur 1'?: string;
  'auteur 2'?: string;
  'Editeur'?: string;
  'Date de Publ.'?: string;
  'ISBN'?: string;
  'Format'?: string;
  'nb pages'?: string;
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

function parseCSV(csvContent: string): CSVBookRow[] {
  const lines = csvContent.split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file appears to be empty or malformed');
  }

  // Parse header row - handle BOM and clean up
  const headerLine = lines[0].replace(/^\uFEFF/, ''); // Remove BOM if present
  const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  console.log('CSV Headers found:', headers);

  const data: CSVBookRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    // Better CSV parsing that handles quoted fields and commas within quotes
    const values = parseCSVLine(line);
    
    if (values.length < headers.length) {
      console.warn(`Row ${i + 1} has ${values.length} columns but expected ${headers.length}. Padding with empty values.`);
      // Pad with empty strings
      while (values.length < headers.length) {
        values.push('');
      }
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || '';
    });

    data.push(row as CSVBookRow);
  }

  console.log(`Parsed ${data.length} rows from CSV`);
  return data;
}

function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  // Clean quotes from values
  return result.map(val => val.replace(/^["']|["']$/g, ''));
}

function readCSVFile(filePath: string): CSVBookRow[] {
  console.log(`Reading CSV file: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`CSV file not found: ${filePath}`);
  }

  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const jsonData = parseCSV(csvContent);
  
  console.log(`Found ${jsonData.length} records in CSV file`);
  return jsonData;
}

function cleanData(data: CSVBookRow[]): any[] {
  return data.map(row => {
    // Clean and format the data
    const publicationDate = row['Date de Publ.'] ? parseDate(row['Date de Publ.']) : null;
    
    // Clean ISBN - handle scientific notation and invalid values
    let isbn = null;
    if (row['ISBN']) {
      const isbnStr = String(row['ISBN']).trim();
      if (isbnStr && isbnStr !== '' && !isbnStr.includes('E') && !isbnStr.toLowerCase().includes('nan')) {
        // Handle scientific notation (like 9.7828E+12)
        if (isbnStr.includes('E')) {
          try {
            const numValue = parseFloat(isbnStr);
            if (!isNaN(numValue)) {
              isbn = Math.floor(numValue).toString();
            }
          } catch (e) {
            isbn = null;
          }
        } else {
          isbn = isbnStr.replace(/[^\d]/g, '') || null;
        }
      }
    }
    
    // Clean entry_id
    let entryId = null;
    if (row['Ent. SdSdC']) {
      const entryStr = String(row['Ent. SdSdC']).trim();
      if (entryStr && entryStr !== '' && !entryStr.toLowerCase().includes('nan')) {
        const parsed = parseInt(entryStr);
        if (!isNaN(parsed)) {
          entryId = parsed;
        }
      }
    }
    
    // Clean page count
    let pageCount = null;
    if (row['nb pages']) {
      const pageStr = String(row['nb pages']).trim();
      if (pageStr && pageStr !== '' && !pageStr.toLowerCase().includes('nan') && pageStr !== '9999') {
        const parsed = parseInt(pageStr);
        if (!isNaN(parsed) && parsed > 0 && parsed < 10000) {
          pageCount = parsed;
        }
      }
    }
    
    return {
      entry_id: entryId,
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
      page_count: pageCount,
      summary: row['résumé']?.trim() || null,
      historical_period: row['Pérlode Hist']?.trim() || null,
      general_theme: row['Thématique Générale']?.trim() || null,
      major_event: row['Evt Majeur']?.trim() || null,
      geography: row['Géographie']?.trim() || null,
      groups_actors: row['Groupes et acteurs']?.trim() || null,
      sources: row['Sources']?.trim() || null
    };
  }).filter(row => {
    // Filter out invalid rows
    if (!row.entry_id || !row.title || row.title === 'n\'importe quoi' || row.title === 'titre') {
      return false;
    }
    return true;
  });
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Try different date formats
  const formats = [
    /^\d{1,2}\/\d{1,2}\/\d{2}$/, // MM/DD/YY or M/D/YY
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY or M/D/YYYY
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
  ];

  const cleanDate = dateStr.trim();
  
  try {
    // Handle MM/DD/YY format (most likely from your CSV)
    if (formats[0].test(cleanDate) || formats[1].test(cleanDate)) {
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Handle ISO format
    if (formats[2].test(cleanDate)) {
      return new Date(cleanDate);
    }
    
    // Try parsing as-is
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (error) {
    console.warn(`Failed to parse date: ${dateStr}`);
  }
  
  return null;
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

  let successCount = 0;
  let errorCount = 0;

  for (const book of books) {
    try {
      // Validate data before insertion
      const values = [
        book.entry_id, book.location, book.section, book.title, book.subtitle,
        book.author_1, book.author_2, book.publisher, book.publication_date,
        book.isbn, book.format, book.page_count, book.summary,
        book.historical_period, book.general_theme, book.major_event,
        book.geography, book.groups_actors, book.sources
      ];

      // Check for NaN values
      values.forEach((value, index) => {
        if (value === 'NaN' || (typeof value === 'number' && isNaN(value))) {
          console.warn(`Warning: NaN value found in book ${book.entry_id} at parameter ${index + 1}`);
        }
      });

      await query(insertQuery, values);
      successCount++;
      
      if (successCount % 10 === 0) {
        console.log(`📈 Progress: ${successCount}/${books.length} books inserted`);
      }
    } catch (error) {
      console.error(`❌ Error inserting book with entry_id ${book.entry_id}:`);
      console.error(`   Title: ${book.title}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Book data:`, JSON.stringify(book, null, 2));
      errorCount++;
    }
  }

  console.log(`✅ Books inserted successfully! ${successCount} success, ${errorCount} errors`);
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
    console.log('🚀 Starting CSV data import process...');
    
    // Create database tables
    await createTables();
    
    // Create default admin user
    await createDefaultAdmin();
    
    // Find CSV file - checking in project root first
    const possiblePaths = [
      path.join(process.cwd(), 'SdSdC - Biblio V0.8.csv'),
      path.join(__dirname, '..', '..', 'SdSdC - Biblio V0.8.csv'),
      path.join(__dirname, '..', '..', '..', 'SdSdC - Biblio V0.8.csv'),
      path.join(process.cwd(), 'data', 'SdSdC - Biblio V0.8.csv'),
    ];
    
    let csvPath: string | null = null;
    for (const testPath of possiblePaths) {
      console.log(`Checking path: ${testPath}`);
      if (fs.existsSync(testPath)) {
        csvPath = testPath;
        console.log(`✅ Found CSV file at: ${csvPath}`);
        break;
      }
    }
    
    if (!csvPath) {
      console.error('❌ CSV file not found. Looked in paths:');
      possiblePaths.forEach(p => console.log(`  - ${p}`));
      console.log('\nPlease ensure "SdSdC - Biblio V0.8.csv" is in your project root directory.');
      return;
    }
    
    // Read CSV data
    const rawData = readCSVFile(csvPath);
    
    // Clean and format data
    const cleanedBooks = cleanData(rawData);
    console.log(`Processed ${cleanedBooks.length} valid book records`);
    
    if (cleanedBooks.length === 0) {
      console.error('❌ No valid book records found in CSV file');
      return;
    }

    // Show sample of first book for verification
    if (cleanedBooks.length > 0) {
      console.log('📖 Sample book record:');
      console.log(JSON.stringify(cleanedBooks[0], null, 2));
    }
    
    // Insert into database
    await insertBooks(cleanedBooks);
    
    console.log('✅ CSV data import completed successfully!');
    console.log(`📚 Imported ${cleanedBooks.length} books`);
    console.log('👤 Created default admin user: admin@library.com');
    
  } catch (error) {
    console.error('❌ Error during CSV data import:', error);
    process.exit(1);
  }
}

// Run the import
if (require.main === module) {
  main().then(() => process.exit(0));
}

export { main as importData };
