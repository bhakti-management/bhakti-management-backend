import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { JobType, JobStatus } from '@prisma/client';

// Zod validation schemas
const jobTypeEnum = z.nativeEnum(JobType);
const jobStatusEnum = z.nativeEnum(JobStatus);

const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  department: z.string().min(2, 'Department must be at least 2 characters long'),
  location: z.string().min(2, 'Location must be at least 2 characters long'),
  type: jobTypeEnum.default(JobType.FULL_TIME),
  salaryRange: z.string().optional(),
  status: jobStatusEnum.default(JobStatus.DRAFT),
  requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
  benefits: z.array(z.string()).optional().default([]),
});

const updateJobSchema = createJobSchema.partial();

// 1. Public: Get all published jobs
export const getPublishedJobs = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: JobStatus.PUBLISHED,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

// 2. Admin: Get all jobs (drafts, closed, published)
export const getAdminJobs = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

// 3. Public/Admin: Get a single job by ID
export const getJobById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    res.status(200).json(job);
  } catch (error) {
    next(error);
  }
};

// 4. Admin: Create a new job
export const createJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createJobSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map(issue => issue.message),
      });
      return;
    }

    const newJob = await prisma.job.create({
      data: parseResult.data,
    });

    res.status(201).json({
      message: 'Job created successfully',
      job: newJob,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Admin: Update a job by ID
export const updateJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    
    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const parseResult = updateJobSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map(issue => issue.message),
      });
      return;
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: parseResult.data,
    });

    res.status(200).json({
      message: 'Job updated successfully',
      job: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

// 6. Admin: Delete a job by ID
export const deleteJob = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    // Check if job exists
    const existingJob = await prisma.job.findUnique({
      where: { id },
    });

    if (!existingJob) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    await prisma.job.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};
