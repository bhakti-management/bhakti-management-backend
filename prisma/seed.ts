import { PrismaClient, Role, JobType, JobStatus, CandidateStatus, EnquiryStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data (in reverse order of relations)
  console.log('Cleaning existing data...');
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Superadmin User
  console.log('Creating admin user...');
  const adminPassword = 'AdminPassword123!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bhaktimanagement.com',
      name: 'Super Admin',
      passwordHash,
      role: Role.SUPERADMIN,
    },
  });
  console.log(`✅ Created admin user: ${admin.email} (Password: ${adminPassword})`);

  // 3. Create Sample Jobs
  console.log('Creating sample jobs...');
  const job1 = await prisma.job.create({
    data: {
      title: 'Senior Software Engineer (Node.js)',
      description: 'We are looking for a Senior Software Engineer with strong Node.js and TypeScript skills to build scalable APIs.',
      department: 'Technology',
      location: 'Mumbai, India (Hybrid)',
      type: JobType.FULL_TIME,
      salaryRange: '₹12,00,000 - ₹18,00,000 per annum',
      status: JobStatus.PUBLISHED,
      requirements: [
        '5+ years of experience with Node.js and Express/NestJS',
        'Strong database design skills using PostgreSQL or MySQL',
        'Experience with TypeScript and modern ORMs like Prisma',
        'Good understanding of microservices architecture and Docker',
      ],
      benefits: [
        'Flexible working hours & hybrid work options',
        'Comprehensive health insurance policy',
        'Annual learning & development allowance',
        'Performance-based annual bonus',
      ],
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: 'Human Resources Consultant',
      description: 'Join our team to manage recruitment, training, and talent acquisition consulting for our corporate clients.',
      department: 'HR Consultancy',
      location: 'Pune, India (On-site)',
      type: JobType.FULL_TIME,
      salaryRange: '₹6,00,000 - ₹9,00,000 per annum',
      status: JobStatus.PUBLISHED,
      requirements: [
        '3+ years of experience in recruitment or HR consulting',
        'Excellent communication and interpersonal skills',
        'Proven track record of managing end-to-end recruitment pipelines',
        'Degree in HR Management, Business Administration, or related field',
      ],
      benefits: [
        'Paid time off (PTO) & wellness days',
        'Performance incentives for successful placements',
        'Regular team outings and collaborative environment',
      ],
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: 'Frontend React Developer (Internship)',
      description: 'Learn and build modern responsive web interfaces using React, Tailwind CSS, and TypeScript.',
      department: 'Technology',
      location: 'Remote',
      type: JobType.INTERNSHIP,
      salaryRange: '₹15,000 - ₹25,000 per month',
      status: JobStatus.DRAFT, // Still in draft
      requirements: [
        'Basic understanding of HTML, CSS, and JavaScript',
        'Familiarity with React and Git version control',
        'Eager to learn and collaborate with senior engineers',
      ],
      benefits: [
        'Certificate of internship and letter of recommendation',
        'Mentorship from experienced senior developers',
        'High potential for full-time conversion',
      ],
    },
  });
  console.log(`✅ Created ${[job1, job2, job3].length} sample jobs.`);

  // 4. Create Sample Candidates/Applications
  console.log('Creating sample candidates...');
  const candidate1 = await prisma.candidate.create({
    data: {
      name: 'Rohan Sharma',
      email: 'rohan.sharma@example.com',
      phone: '+919876543210',
      resumePath: '/uploads/resumes/rohan_sharma_resume.pdf',
      coverLetter: 'I am highly interested in the Senior Software Engineer role. I have extensive experience with Express and PostgreSQL.',
      status: CandidateStatus.APPLIED,
      jobId: job1.id,
      notes: 'Initial application submitted. Resume looks very relevant.',
    },
  });

  const candidate2 = await prisma.candidate.create({
    data: {
      name: 'Aditi Patel',
      email: 'aditi.patel@example.com',
      phone: '+919812345678',
      resumePath: '/uploads/resumes/aditi_patel_resume.pdf',
      coverLetter: 'I have worked in recruiter roles for 4 years and would love to join your HR consultancy division.',
      status: CandidateStatus.SHORTLISTED,
      jobId: job2.id,
      notes: 'Interview scheduled for next Tuesday at 3 PM. Candidate has good consulting background.',
    },
  });
  console.log(`✅ Created ${[candidate1, candidate2].length} sample candidates.`);

  // 5. Create Sample Enquiries
  console.log('Creating sample enquiries...');
  const enquiry1 = await prisma.enquiry.create({
    data: {
      name: 'Corporate Client Corp',
      email: 'contact@corporateclient.com',
      phone: '+912233445566',
      subject: 'Talent Acquisition Partnership Inquiry',
      message: 'Hello, we are looking to hire a team of 10 developers for our new office. We want to partner with Bhakti Management for recruitment consultancy services. Please contact us to discuss.',
      status: EnquiryStatus.UNREAD,
    },
  });

  const enquiry2 = await prisma.enquiry.create({
    data: {
      name: 'Amit Verma',
      email: 'amit.verma@example.com',
      phone: '+919988776655',
      subject: 'Inquiry regarding Job Openings',
      message: 'Dear Team, I wanted to inquire if there are any openings in Sales or Business Development. Thank you.',
      status: EnquiryStatus.READ,
    },
  });
  console.log(`✅ Created ${[enquiry1, enquiry2].length} sample enquiries.`);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
