require('../config/loadEnv')();

const connectDB = require('../config/db');
const Applicant = require('../models/applicantModel');
const Application = require('../models/applicationModel');
const JobPosting = require('../models/jobPostingModel');
const generateToken = require('../utils/generateToken');
const axios = require('axios');

async function main() {
  await connectDB();

  const applicant = await Applicant.findOne({ email: 'onungachristopher363@gmail.com' });
  if (!applicant) {
    console.error('Applicant not found');
    process.exit(1);
  }

  const applied = await Application.find({ applicantId: applicant._id }).select('jobId');
  const appliedJobIds = applied.map((a) => a.jobId);

  let job = await JobPosting.findOne({
    status: 'Published',
    _id: { $nin: appliedJobIds },
  });

  if (!job) {
    console.log('No unapplied published job — using HR Portal Test Job (may fail if already applied)');
    job = await JobPosting.findById('6a7d24f4043004c8e5a74c39');
  }

  const token = generateToken(applicant._id, 'applicant');
  const cvPath =
    applicant.profile?.documents?.cvPath ||
    applicant.resumePath ||
    '/uploads/resumes/test.pdf';

  console.log('Submitting application for job:', job?.jobTitle, String(job?._id));
  console.log('Applicant phone:', applicant.phone);

  try {
    const res = await axios.post(
      'http://localhost:5000/api/recruitment/applications',
      {
        jobId: String(job._id),
        applicantId: String(applicant._id),
        cvPath,
        coverLetter: 'Test cover letter for SMS debugging.',
        applicationQuestions: [{ question: 'Why?', answer: 'Because testing.' }],
        consent: {
          privacyConsent: true,
          accuracyDeclaration: true,
          verificationAuthorization: true,
        },
        profileUpdates: {
          firstName: applicant.firstName,
          lastName: applicant.lastName,
          email: applicant.email,
          phone: applicant.phone,
          yearsOfExperience: applicant.yearsOfExperience || 2,
          educationLevel: applicant.educationLevel || 'Bachelor',
        },
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    console.log('SUCCESS', res.status, res.data.success);
  } catch (error) {
    console.log('ERROR', error.response?.status, error.response?.data?.message || error.message);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
