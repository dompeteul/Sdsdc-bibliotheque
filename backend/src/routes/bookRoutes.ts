import { Router } from 'express';
import { 
  getBooks, 
  getBookById, 
  getBookSuggestions, 
  getBookStats,
  addBook,
  updateBook
} from '../controllers/bookController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
router.get('/', getBooks);
router.get('/stats', getBookStats);
router.get('/suggestions', getBookSuggestions);
router.get('/:id', getBookById);

// Member routes (authentication required)
router.post('/', authenticateToken, addBook);
router.put('/:id', authenticateToken, requireRole(['admin', 'librarian']), updateBook);

export default router;
