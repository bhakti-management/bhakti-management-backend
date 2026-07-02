import { Router } from 'express';
import { 
  getPublishedJobs, 
  getAdminJobs, 
  getJobById, 
  createJob, 
  updateJob, 
  deleteJob 
} from '../controllers/jobController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getPublishedJobs);
router.get('/:id', getJobById);

// Protected routes (Admin access only)
router.get('/admin/all', authenticate, getAdminJobs);
router.post('/', authenticate, createJob);
router.put('/:id', authenticate, updateJob);
router.delete('/:id', authenticate, deleteJob);

export default router;
