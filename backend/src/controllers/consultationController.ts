import { Request, Response } from 'express';
import { query } from '../utils/database';

export const createConsultationRequest = async (req: Request, res: Response) => {
  try {
    const { bookId, requestedDate, requestedTimeSlot, notes } = req.body;
    const userId = (req as any).user.userId;
    
    // Validate input
    if (!bookId || !requestedDate || !requestedTimeSlot) {
      return res.status(400).json({ message: 'Book ID, date, and time slot are required' });
    }
    
    // Check if book exists
    const bookCheck = await query('SELECT id FROM books WHERE id = $1', [bookId]);
    if (bookCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check for existing pending request for same book and time slot
    const existingRequest = await query(`
      SELECT id FROM consultation_requests 
      WHERE book_id = $1 AND requested_date = $2 AND requested_time_slot = $3 
      AND status IN ('pending', 'approved')
    `, [bookId, requestedDate, requestedTimeSlot]);
    
    if (existingRequest.rows.length > 0) {
      return res.status(409).json({ message: 'This time slot is already requested or booked' });
    }
    
    // Create consultation request
    const result = await query(`
      INSERT INTO consultation_requests (user_id, book_id, requested_date, requested_time_slot, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, bookId, requestedDate, requestedTimeSlot, notes || null]);
    
    res.status(201).json({
      message: 'Consultation request created successfully',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating consultation request:', error);
    res.status(500).json({ message: 'Error creating consultation request' });
  }
};

export const getUserConsultationRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    const result = await query(`
      SELECT 
        cr.*,
        b.title,
        b.author_1,
        b.author_2,
        b.location
      FROM consultation_requests cr
      JOIN books b ON cr.book_id = b.id
      WHERE cr.user_id = $1
      ORDER BY cr.created_at DESC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching user consultation requests:', error);
    res.status(500).json({ message: 'Error fetching consultation requests' });
  }
};

export const getAllConsultationRequests = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin' && userRole !== 'librarian') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const result = await query(`
      SELECT 
        cr.*,
        b.title,
        b.author_1,
        b.author_2,
        b.location,
        u.first_name,
        u.last_name,
        u.email
      FROM consultation_requests cr
      JOIN books b ON cr.book_id = b.id
      JOIN users u ON cr.user_id = u.id
      ORDER BY cr.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching consultation requests:', error);
    res.status(500).json({ message: 'Error fetching consultation requests' });
  }
};

export const updateConsultationRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const userRole = (req as any).user.role;
    
    if (userRole !== 'admin' && userRole !== 'librarian') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const result = await query(`
      UPDATE consultation_requests 
      SET status = $1, admin_notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, adminNotes || null, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Consultation request not found' });
    }
    
    res.json({
      message: 'Consultation request updated successfully',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating consultation request:', error);
    res.status(500).json({ message: 'Error updating consultation request' });
  }
};
