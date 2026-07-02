import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { EnquiryStatus } from '@prisma/client';

// Validation schema for creating an enquiry (Public form)
const createEnquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  subject: z.string().min(3, 'Subject must be at least 3 characters long'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

// Validation schema for updating enquiry status
const updateStatusSchema = z.object({
  status: z.nativeEnum(EnquiryStatus),
});

// 1. Public: Submit a contact enquiry
export const submitEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parseResult = createEnquirySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.issues.map(issue => issue.message),
      });
      return;
    }

    const newEnquiry = await prisma.enquiry.create({
      data: parseResult.data,
    });

    res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiryId: newEnquiry.id,
    });
  } catch (error) {
    next(error);
  }
};

// 2. Protected: List all enquiries (with status filter)
export const getEnquiries = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query;

    const filterConditions: any = {};
    if (status && typeof status === 'string' && Object.values(EnquiryStatus).includes(status as EnquiryStatus)) {
      filterConditions.status = status as EnquiryStatus;
    }

    const enquiries = await prisma.enquiry.findMany({
      where: filterConditions,
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json(enquiries);
  } catch (error) {
    next(error);
  }
};

// 3. Protected: Get details of a single enquiry
export const getEnquiryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const enquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!enquiry) {
      res.status(404).json({ message: 'Enquiry not found' });
      return;
    }

    res.status(200).json(enquiry);
  } catch (error) {
    next(error);
  }
};

// 4. Protected: Update status of an enquiry
export const updateEnquiryStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const existingEnquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!existingEnquiry) {
      res.status(404).json({ message: 'Enquiry not found' });
      return;
    }

    const updatedEnquiry = await prisma.enquiry.update({
      where: { id },
      data: { status: parseResult.data.status },
    });

    res.status(200).json({
      message: 'Status updated successfully',
      enquiry: updatedEnquiry,
    });
  } catch (error) {
    next(error);
  }
};

// 5. Protected: Delete an enquiry
export const deleteEnquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params as { id: string };

    const existingEnquiry = await prisma.enquiry.findUnique({
      where: { id },
    });

    if (!existingEnquiry) {
      res.status(404).json({ message: 'Enquiry not found' });
      return;
    }

    await prisma.enquiry.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    next(error);
  }
};
