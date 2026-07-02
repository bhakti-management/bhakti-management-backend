import { Router } from 'express';
import { 
  submitEnquiry, 
  getEnquiries, 
  getEnquiryById, 
  updateEnquiryStatus, 
  deleteEnquiry 
} from '../controllers/enquiryController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public route (for clients/users submitting contact forms)
router.post('/', submitEnquiry);

// Protected routes (Admin access only)
router.get('/', authenticate, getEnquiries);
router.get('/:id', authenticate, getEnquiryById);
router.put('/:id/status', authenticate, updateEnquiryStatus);
router.delete('/:id', authenticate, deleteEnquiry);

export default router;
