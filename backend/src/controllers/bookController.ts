import { Request, Response } from 'express';
import { query } from '../utils/database';
import { Book } from '../types';

export const getBooks = async (req: Request, res: Response) => {
  try {
    const {
      search = '',
      section = '',
      author = '',
      theme = '',
      geography = '',
      page = 1,
      limit = 20
    } = req.query;

    let whereConditions: string[] = [];
    let params: any[] = [];
    let paramCount = 0;

    // Build dynamic WHERE clause
    if (search) {
      paramCount++;
      whereConditions.push(`(
        to_tsvector('french', title) @@ plainto_tsquery('french', $${paramCount}) OR
        to_tsvector('french', COALESCE(summary, '')) @@ plainto_tsquery('french', $${paramCount}) OR
        author_1 ILIKE $${paramCount + 1} OR
        author_2 ILIKE $${paramCount + 1}
      )`);
      params.push(search, `%${search}%`);
      paramCount++;
    }

    if (section) {
      paramCount++;
      whereConditions.push(`section ILIKE $${paramCount}`);
      params.push(`%${section}%`);
    }

    if (author) {
      paramCount++;
      whereConditions.push(`(author_1 ILIKE $${paramCount} OR author_2 ILIKE $${paramCount})`);
      params.push(`%${author}%`);
    }

    if (theme) {
      paramCount++;
      whereConditions.push(`general_theme ILIKE $${paramCount}`);
      params.push(`%${theme}%`);
    }

    if (geography) {
      paramCount++;
      whereConditions.push(`geography ILIKE $${paramCount}`);
      params.push(`%${geography}%`);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Count total results
    const countQuery = `SELECT COUNT(*) FROM books ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const offset = (Number(page) - 1) * Number(limit);
    paramCount += 2;
    const booksQuery = `
      SELECT * FROM books 
      ${whereClause}
      ORDER BY title ASC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;
    
    const booksResult = await query(booksQuery, [...params, Number(limit), offset]);

    res.json({
      books: booksResult.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ message: 'Error fetching books' });
  }
};

export const getBookById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await query('SELECT * FROM books WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ message: 'Error fetching book' });
  }
};

export const getBookSuggestions = async (req: Request, res: Response) => {
  try {
    const { query: searchQuery } = req.query;
    
    if (!searchQuery || typeof searchQuery !== 'string') {
      return res.json([]);
    }
    
    const result = await query(`
      SELECT DISTINCT title, author_1, author_2, id
      FROM books 
      WHERE title ILIKE $1 OR author_1 ILIKE $1 OR author_2 ILIKE $1
      LIMIT 10
    `, [`%${searchQuery}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
};

export const getBookStats = async (req: Request, res: Response) => {
  try {
    const stats = await query(`
      SELECT 
        COUNT(*) as total_books,
        COUNT(DISTINCT section) as total_sections,
        COUNT(DISTINCT author_1) + COUNT(DISTINCT author_2) as total_authors,
        COUNT(DISTINCT general_theme) as total_themes
      FROM books
    `);
    
    const sectionStats = await query(`
      SELECT section, COUNT(*) as count
      FROM books 
      WHERE section IS NOT NULL
      GROUP BY section
      ORDER BY count DESC
    `);
    
    res.json({
      overview: stats.rows[0],
      sections: sectionStats.rows
    });
  } catch (error) {
    console.error('Error fetching book stats:', error);
    res.status(500).json({ message: 'Error fetching book statistics' });
  }
};

export const addBook = async (req: Request, res: Response) => {
  try {
    const {
      title, subtitle, author1, author2, publisher, publicationDate,
      isbn, format, pageCount, summary, section, location,
      historicalPeriod, generalTheme, majorEvent, geography,
      groupsActors, sources
    } = req.body;

    if (!title || !section) {
      return res.status(400).json({ message: 'Title and section are required' });
    }

    // Generate new entry ID
    const maxIdResult = await query('SELECT MAX(entry_id) as max_id FROM books');
    const nextEntryId = (maxIdResult.rows[0].max_id || 0) + 1;

    const result = await query(`
      INSERT INTO books (
        entry_id, title, subtitle, author_1, author_2, publisher, 
        publication_date, isbn, format, page_count, summary, section, 
        location, historical_period, general_theme, major_event, 
        geography, groups_actors, sources
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
      ) RETURNING *
    `, [
      nextEntryId, title, subtitle || null, author1 || null, author2 || null,
      publisher || null, publicationDate || null, isbn || null, format || null,
      pageCount || null, summary || null, section, location || null,
      historicalPeriod || null, generalTheme || null, majorEvent || null,
      geography || null, groupsActors || null, sources || null
    ]);

    res.status(201).json({
      message: 'Book added successfully',
      book: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding book:', error);
    res.status(500).json({ message: 'Error adding book' });
  }
};

export const updateBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Build dynamic update query
    const updateFields = Object.keys(updates).filter(key => 
      key !== 'id' && key !== 'entryId' && key !== 'createdAt'
    );
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    const setClause = updateFields.map((field, index) => 
      `${field.replace(/([A-Z])/g, '_$1').toLowerCase()} = $${index + 2}`
    ).join(', ');
    
    const values = [id, ...updateFields.map(field => updates[field])];
    
    const result = await query(`
      UPDATE books 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }

    res.json({
      message: 'Book updated successfully',
      book: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ message: 'Error updating book' });
  }
};
