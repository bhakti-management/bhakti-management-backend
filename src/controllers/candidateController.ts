import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/db';
import { CandidateStatus } from '@prisma/client';

// Validation schema for job application
const applySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters long'),
  coverLetter: z.string().optional(),
  jobId: z.string().uuid('Invalid Job ID').optional().nullable(),
});

// Update candidate status validation
const updateStatusSchema = z.object({
  status: z.nativeEnum(CandidateStatus),
});

// Update candidate notes validation
const updateNotesSchema = z.object({
  notes: z.string().optional().default(''),
});

// 1. Public: Apply for a job / Submit resume
export const applyForJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let uploadedFilePath: string | null = null;
  try {
    // Check if resume file was uploaded
    if (!req.file) {
      res.status(400).json({ message: 'Resume file is required' });
      return;
    }

    uploadedFilePath = req.file.path;

    // Validate request body
    const parseResult = applySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map(issue => issue.message),
      });
      return;
    }

    const { name, email, phone, coverLetter, jobId } = parseResult.data;

    // Verify job exists if jobId is provided
    if (jobId) {
      const jobExists = await prisma.job.findUnique({
        where: { id: jobId },
      });
      if (!jobExists) {
        res.status(400).json({ message: 'The specified job does not exist' });
        return;
      }
    }

    // Save candidate to database
    // Store resumePath as relative to easily manage paths across hosting environments
    const relativeResumePath = path.relative(path.join(__dirname, '../..'), req.file.path).replace(/\\/g, '/');

    const candidate = await prisma.candidate.create({
      data: {
        name,
        email,
        phone,
        coverLetter,
        jobId: jobId || null,
        resumePath: relativeResumePath,
        status: CandidateStatus.APPLIED,
      },
    });

    res.status(201).json({
      message: 'Application submitted successfully',
      candidateId: candidate.id,
    });
  } catch (error) {
    // If database operation fails, delete the uploaded file from disk to avoid orphaned files
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (unlinkErr) {
        console.error('Failed to clean up file on error:', unlinkErr);
      }
    }
    next(error);
  }
};

// 2. Protected: List all candidates (with filtering & search)
export const getCandidates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId, status, search } = req.query;

    const filterConditions: any = {};

    if (jobId && typeof jobId === 'string') {
      filterConditions.jobId = jobId;
    }

    if (status && typeof status === 'string' && Object.values(CandidateStatus).includes(status as CandidateStatus)) {
      filterConditions.status = status as CandidateStatus;
    }

    if (search && typeof search === 'string') {
      filterConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const candidates = await prisma.candidate.findMany({
      where: filterConditions,
      include: {
        job: {
          select: {
            title: true,
            department: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(candidates);
  } catch (error) {
    next(error);
  }
};

// 3. Protected: Get candidate details by ID
export const getCandidateById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      include: {
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!candidate) {
      res.status(404).json({ message: 'Candidate not found' });
      return;
    }

    res.status(200).json(candidate);
  } catch (error) {
    next(error);
  }
};

// 4. Protected: Download resume
export const downloadResume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: {
        resumePath: true,
        name: true,
      },
    });

    if (!candidate) {
      res.status(404).json({ message: 'Candidate not found' });
      return;
    }

    const absolutePath = path.join(__dirname, '../..', candidate.resumePath);

    if (!fs.existsSync(absolutePath)) {
      res.status(404).json({ message: 'Resume file not found on server' });
      return;
    }

    // Resolve mime type or let Express handle it.
    // Set attachment filename
    const ext = path.extname(absolutePath);
    const downloadName = `${candidate.name.replace(/\s+/g, '_')}_Resume${ext}`;
    
    res.download(absolutePath, downloadName);
  } catch (error) {
    next(error);
  }
};

// 5. Protected: Update candidate status
export const updateCandidateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map(issue => issue.message),
      });
      return;
    }

    const existingCandidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!existingCandidate) {
      res.status(404).json({ message: 'Candidate not found' });
      return;
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: { status: parseResult.data.status },
    });

    res.status(200).json({
      message: 'Status updated successfully',
      candidate: updatedCandidate,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Protected: Update candidate notes
export const updateCandidateNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const parseResult = updateNotesSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map(issue => issue.message),
      });
      return;
    }

    const existingCandidate = await prisma.candidate.findUnique({
      where: { id },
    });

    if (!existingCandidate) {
      res.status(404).json({ message: 'Candidate not found' });
      return;
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id },
      data: { notes: parseResult.data.notes },
    });

    res.status(200).json({
      message: 'Notes updated successfully',
      candidate: updatedCandidate,
    });
  } catch (error) {
    next(error);
  }
};

// 7. Protected: Delete candidate (and associated file from disk)
export const deleteCandidate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const candidate = await prisma.candidate.findUnique({
      where: { id },
      select: {
        id: true,
        resumePath: true,
      },
    });

    if (!candidate) {
      res.status(404).json({ message: 'Candidate not found' });
      return;
    }

    // Delete candidate from database first
    await prisma.candidate.delete({
      where: { id },
    });

    // Delete resume file from server disk
    const absolutePath = path.join(__dirname, '../..', candidate.resumePath);
    if (fs.existsSync(absolutePath)) {
      try {
        fs.unlinkSync(absolutePath);
        console.log(`Deleted file: ${absolutePath}`);
      } catch (unlinkErr) {
        console.error(`Failed to delete resume file at ${absolutePath}:`, unlinkErr);
      }
    }

    res.status(200).json({ message: 'Candidate and associated resume deleted successfully' });
  } catch (error) {
    next(error);
  }
};
