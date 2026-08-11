const asyncHandler = require("express-async-handler");
const JobPosting = require("../models/jobPostingModel");
const Applicant = require("../models/applicantModel");
const Application = require("../models/applicationModel");
const Interview = require("../models/interviewModel");
const Offer = require("../models/offerModel");

const getRecruitmentDashboard = asyncHandler(async (req, res) => {
  const [jobsCount, applicantsCount, applicationsCount, interviewsCount, offersCount] = await Promise.all([
    JobPosting.countDocuments(),
    Applicant.countDocuments(),
    Application.countDocuments(),
    Interview.countDocuments(),
    Offer.countDocuments(),
  ]);

  const publishedJobs = await JobPosting.countDocuments({ status: "Published" });
  const acceptedOffers = await Offer.countDocuments({ status: "Accepted" });

  res.json({
    success: true,
    data: {
      totalJobs: jobsCount,
      publishedJobs,
      totalApplicants: applicantsCount,
      totalApplications: applicationsCount,
      totalInterviews: interviewsCount,
      totalOffers: offersCount,
      acceptedOffers,
      conversionRate: applicantsCount > 0 ? ((acceptedOffers / applicantsCount) * 100).toFixed(2) : 0,
    },
  });
});

const getJobPostingAnalytics = asyncHandler(async (req, res) => {
  const jobs = await JobPosting.find()
    .select("jobTitle applicantCount status createdAt deadline")
    .sort({ createdAt: -1 });

  const analytics = await Promise.all(
    jobs.map(async (job) => {
      const applications = await Application.find({ jobId: job._id });
      const shortlisted = applications.filter((app) => app.status === "Shortlisted").length;
      const selected = applications.filter((app) => app.status === "Selected").length;

      return {
        jobId: job._id,
        jobTitle: job.jobTitle,
        applicantCount: job.applicantCount,
        shortlisted,
        selected,
        status: job.status,
        daysOpen: Math.floor((new Date() - job.createdAt) / (1000 * 60 * 60 * 24)),
        deadlineRemaining: Math.floor((job.deadline - new Date()) / (1000 * 60 * 60 * 24)),
      };
    })
  );

  res.json({ success: true, data: analytics });
});

const getApplicationMetrics = asyncHandler(async (req, res) => {
  const [submitted, shortlisted, selected, rejected, offered] = await Promise.all([
    Application.countDocuments({ status: "Submitted" }),
    Application.countDocuments({ status: "Shortlisted" }),
    Application.countDocuments({ status: "Selected" }),
    Application.countDocuments({ status: "Rejected" }),
    Application.countDocuments({ status: "Offered" }),
  ]);

  const total = submitted + shortlisted + selected + rejected + offered;

  res.json({
    success: true,
    data: {
      submitted: { count: submitted, percentage: total > 0 ? ((submitted / total) * 100).toFixed(1) : 0 },
      shortlisted: { count: shortlisted, percentage: total > 0 ? ((shortlisted / total) * 100).toFixed(1) : 0 },
      selected: { count: selected, percentage: total > 0 ? ((selected / total) * 100).toFixed(1) : 0 },
      rejected: { count: rejected, percentage: total > 0 ? ((rejected / total) * 100).toFixed(1) : 0 },
      offered: { count: offered, percentage: total > 0 ? ((offered / total) * 100).toFixed(1) : 0 },
      total,
    },
  });
});

const getInterviewMetrics = asyncHandler(async (req, res) => {
  const [scheduled, completed, cancelled] = await Promise.all([
    Interview.countDocuments({ status: "Scheduled" }),
    Interview.countDocuments({ status: "Completed" }),
    Interview.countDocuments({ status: "Cancelled" }),
  ]);

  const completedInterviews = await Interview.find({ status: "Completed" })
    .select("recommendation")
    .limit(100);

  const recommendations = {
    proceed: completedInterviews.filter((i) => i.recommendation === "Proceed").length,
    reject: completedInterviews.filter((i) => i.recommendation === "Reject").length,
    onHold: completedInterviews.filter((i) => i.recommendation === "On Hold").length,
  };

  res.json({
    success: true,
    data: {
      scheduled,
      completed,
      cancelled,
      recommendations,
      totalInterviews: scheduled + completed + cancelled,
    },
  });
});

const getOfferAnalytics = asyncHandler(async (req, res) => {
  const [pending, accepted, rejected, expired] = await Promise.all([
    Offer.countDocuments({ status: "Pending" }),
    Offer.countDocuments({ status: "Accepted" }),
    Offer.countDocuments({ status: "Rejected" }),
    Offer.countDocuments({ status: "Expired" }),
  ]);

  const total = pending + accepted + rejected + expired;
  const acceptanceRate = total > 0 ? ((accepted / total) * 100).toFixed(2) : 0;

  res.json({
    success: true,
    data: {
      pending,
      accepted,
      rejected,
      expired,
      total,
      acceptanceRate,
    },
  });
});

const getApplicantDemographics = asyncHandler(async (req, res) => {
  const byEducation = await Applicant.aggregate([
    {
      $group: {
        _id: "$educationLevel",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const byStatus = await Applicant.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const experienceRanges = await Applicant.aggregate([
    {
      $bucket: {
        groupBy: "$yearsOfExperience",
        boundaries: [0, 2, 5, 10, 20],
        default: "20+",
        output: {
          count: { $sum: 1 },
        },
      },
    },
  ]);

  res.json({
    success: true,
    data: {
      byEducation,
      byStatus,
      experienceRanges,
    },
  });
});

module.exports = {
  getRecruitmentDashboard,
  getJobPostingAnalytics,
  getApplicationMetrics,
  getInterviewMetrics,
  getOfferAnalytics,
  getApplicantDemographics,
};
