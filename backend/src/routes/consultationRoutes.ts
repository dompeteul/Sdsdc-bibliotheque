import { Router } from 'express';
import { 
  createConsultationRequest, 
  getUserConsultationRequests, 
  getAllConsultationRequests,
  updateConsultationRequest 
} from '../controllers/consultationController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// User routes
router.post('/', authenticateToken, createConsultationRequest);
router.get('/my-requests', authenticateToken, getUserConsultationRequests);

// Admin/Librarian routes
router.get('/', authenticateToken, requireRole(['admin', 'librarian']), getAllConsultationRequests);
router.put('/:id', authenticateToken, requireRole(['admin', 'librarian']), updateConsultationRequest);

export default router;
