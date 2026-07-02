import { Router } from 'express';
import { 
  applyForJob, 
  getCandidates, 
  getCandidateById, 
  downloadResume, 
  updateCandidateStatus, 
  updateCandidateNotes, 
  deleteCandidate 
} from '../controllers/candidateController';
import { uploadResume } from '../config/multer';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (For candidates submitting application)
router.post('/', uploadResume.single('resume'), applyForJob);

// Protected routes (Admin access only)
router.get('/', authenticate, getCandidates);
router.get('/:id', authenticate, getCandidateById);
router.get('/:id/resume', authenticate, downloadResume);
router.put('/:id/status', authenticate, updateCandidateStatus);
router.put('/:id/notes', authenticate, updateCandidateNotes);
router.delete('/:id', authenticate, deleteCandidate);

export default router;
