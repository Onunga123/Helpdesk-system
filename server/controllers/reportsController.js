const asyncHandler = require("express-async-handler");
const JobPosting = require("../models/jobPostingModel");
const Applicant = require("../models/applicantModel");
const Application = require("../models/applicationModel");
const Interview = require("../models/interviewModel");
const Offer = require("../models/offerModel");
const {
  percent,
  parseAnalyticsFilters,
  buildJobQuery,
  buildApplicationQuery,
  buildInterviewQuery,
  buildOfferQuery,
} = require("../utils/analyticsFilters");

const queryHasResults = (query) => query._id !== null;

const emptyQueryResult = async (Model, query) => {
  if (query._id === null) return 0;
  return Model.countDocuments(query);
};

const buildEmptyFunnel = () => ({
  total: 0,
  submitted: { count: 0, percentage: 0 },
  shortlisted: { count: 0, percentage: 0 },
  interviewed: { count: 0, percentage: 0 },
  selected: { count: 0, percentage: 0 },
  offered: { count: 0, percentage: 0 },
  hired: { count: 0, percentage: 0 },
  rejected: { count: 0, percentage: 0 },
  funnel: ["Submitted", "Shortlisted", "Interviewed", "Selected", "Offered", "Hired"].map((stage, index) => ({
    stage,
    key: stage.toLowerCase(),
    count: 0,
    percentageOfTotal: 0,
    conversionFromPrevious: index === 0 ? 100 : 0,
  })),
});

const getRecruitmentDashboard = asyncHandler(async (req, res) => {
  const filters = parseAnalyticsFilters(req.query);
  const jobQuery = buildJobQuery(filters);
  const appQuery = await buildApplicationQuery(Application, JobPosting, filters);
  const interviewQuery = await buildInterviewQuery(Application, JobPosting, filters);
  const offerQuery = await buildOfferQuery(Application, JobPosting, filters);

  const applications = queryHasResults(appQuery)
    ? await Application.find(appQuery).select("applicantId")
    : [];
  const uniqueApplicantIds = new Set(applications.map((app) => String(app.applicantId)));

  const [
    totalJobs,
    publishedJobs,
    totalApplications,
    totalInterviews,
    totalOffers,
    shortlisted,
    acceptedOffers,
    hiredApplicants,
  ] = await Promise.all([
    emptyQueryResult(JobPosting, jobQuery),
    emptyQueryResult(JobPosting, { ...jobQuery, status: "Published" }),
    emptyQueryResult(Application, appQuery),
    emptyQueryResult(Interview, interviewQuery),
    emptyQueryResult(Offer, offerQuery),
    emptyQueryResult(Application, { ...appQuery, status: "Shortlisted" }),
    emptyQueryResult(Offer, { ...offerQuery, status: "Accepted" }),
    Applicant.countDocuments({ status: "Hired", ...(filters.dateRange ? filters.applicantCreatedFilter : {}) }),
  ]);

  const hired = Math.max(acceptedOffers, hiredApplicants);
  const totalApplicants =
    filters.period === "all" && !filters.department && !filters.jobId && !filters.status
      ? await Applicant.countDocuments()
      : uniqueApplicantIds.size;

  res.json({
    success: true,
    data: {
      totalJobs,
      publishedJobs,
      totalApplicants,
      totalApplications,
      shortlisted,
      totalInterviews,
      totalOffers,
      acceptedOffers,
      hired,
      hiringConversionRate: percent(hired, totalApplications, 2),
      filters: {
        period: filters.period,
        department: filters.department,
        jobId: filters.jobId,
        status: filters.status,
      },
    },
  });
});

const getJobPostingAnalytics = asyncHandler(async (req, res) => {
  const filters = parseAnalyticsFilters(req.query);
  const jobQuery = buildJobQuery(filters);
  const jobs = await JobPosting.find(jobQuery)
    .select("jobTitle department applicantCount status createdAt deadline")
    .sort({ createdAt: -1 });

  const analytics = await Promise.all(
    jobs.map(async (job) => {
      const applications = await Application.find({ jobId: job._id });
      const applicationIds = applications.map((app) => app._id);
      const applicationCount = applications.length;
      const shortlisted = applications.filter((app) =>
        ["Shortlisted", "Selected", "Offered"].includes(app.status)
      ).length;
      const selected = applications.filter((app) => ["Selected", "Offered"].includes(app.status)).length;

      const [interviews, offers, hired] = await Promise.all([
        applicationIds.length
          ? Interview.countDocuments({ applicationId: { $in: applicationIds } })
          : 0,
        applicationIds.length
          ? Offer.countDocuments({ applicationId: { $in: applicationIds } })
          : 0,
        applicationIds.length
          ? Offer.countDocuments({ applicationId: { $in: applicationIds }, status: "Accepted" })
          : 0,
      ]);

      const daysOpen = Math.max(0, Math.floor((new Date() - job.createdAt) / (1000 * 60 * 60 * 24)));
      const deadlineRemaining = Math.floor((job.deadline - new Date()) / (1000 * 60 * 60 * 24));

      return {
        jobId: job._id,
        jobTitle: job.jobTitle,
        department: job.department,
        applicantCount: applicationCount || job.applicantCount || 0,
        shortlisted,
        selected,
        interviews,
        offers,
        hired,
        conversionRate: percent(hired, applicationCount, 1),
        status: job.status,
        daysOpen,
        deadlineRemaining,
      };
    })
  );

  res.json({ success: true, data: analytics });
});

const getApplicationMetrics = asyncHandler(async (req, res) => {
  const filters = parseAnalyticsFilters(req.query);
  const appQuery = await buildApplicationQuery(Application, JobPosting, filters);

  if (!queryHasResults(appQuery)) {
    return res.json({ success: true, data: buildEmptyFunnel() });
  }

  const applications = await Application.find(appQuery).select("_id status");
  const applicationIds = applications.map((app) => app._id);
  const total = applications.length;

  const shortlisted = applications.filter((app) =>
    ["Shortlisted", "Selected", "Offered"].includes(app.status)
  ).length;
  const selected = applications.filter((app) => ["Selected", "Offered"].includes(app.status)).length;
  const offered = applications.filter((app) => app.status === "Offered").length;

  const interviewedIds = await Interview.distinct("applicationId", {
    applicationId: { $in: applicationIds },
  });
  const interviewed = interviewedIds.length;

  const hired = await Offer.countDocuments({
    applicationId: { $in: applicationIds },
    status: "Accepted",
  });

  const rejected = applications.filter((app) => app.status === "Rejected").length;
  const submitted = applications.filter((app) => app.status === "Submitted").length;

  const funnel = [
    { stage: "Submitted", key: "submitted", count: total },
    { stage: "Shortlisted", key: "shortlisted", count: shortlisted },
    { stage: "Interviewed", key: "interviewed", count: interviewed },
    { stage: "Selected", key: "selected", count: selected },
    { stage: "Offered", key: "offered", count: offered },
    { stage: "Hired", key: "hired", count: hired },
  ].map((item, index, arr) => ({
    ...item,
    percentageOfTotal: percent(item.count, total),
    conversionFromPrevious: index === 0 ? 100 : percent(item.count, arr[index - 1].count),
  }));

  res.json({
    success: true,
    data: {
      total,
      submitted: { count: submitted, percentage: percent(submitted, total) },
      shortlisted: { count: shortlisted, percentage: percent(shortlisted, total) },
      interviewed: { count: interviewed, percentage: percent(interviewed, total) },
      selected: { count: selected, percentage: percent(selected, total) },
      offered: { count: offered, percentage: percent(offered, total) },
      hired: { count: hired, percentage: percent(hired, total) },
      rejected: { count: rejected, percentage: percent(rejected, total) },
      funnel,
    },
  });
});

const getInterviewMetrics = asyncHandler(async (req, res) => {
  const filters = parseAnalyticsFilters(req.query);
  const interviewQuery = await buildInterviewQuery(Application, JobPosting, filters);

  if (!queryHasResults(interviewQuery)) {
    return res.json({
      success: true,
      data: {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        totalInterviews: 0,
        completionRate: 0,
        recommendations: { proceed: 0, reject: 0, onHold: 0 },
        recommendationRates: { proceed: 0, reject: 0, onHold: 0 },
      },
    });
  }

  const [scheduled, completed, cancelled] = await Promise.all([
    Interview.countDocuments({ ...interviewQuery, status: "Scheduled" }),
    Interview.countDocuments({ ...interviewQuery, status: "Completed" }),
    Interview.countDocuments({ ...interviewQuery, status: "Cancelled" }),
  ]);

  const completedInterviews = await Interview.find({ ...interviewQuery, status: "Completed" }).select(
    "recommendation"
  );

  const recommendations = {
    proceed: completedInterviews.filter((item) => item.recommendation === "Proceed").length,
    reject: completedInterviews.filter((item) => item.recommendation === "Reject").length,
    onHold: completedInterviews.filter((item) => item.recommendation === "On Hold").length,
  };

  res.json({
    success: true,
    data: {
      scheduled,
      completed,
      cancelled,
      totalInterviews: scheduled + completed + cancelled,
      completionRate: percent(completed, scheduled + completed),
      recommendations,
      recommendationRates: {
        proceed: percent(recommendations.proceed, completed),
        reject: percent(recommendations.reject, completed),
        onHold: percent(recommendations.onHold, completed),
      },
    },
  });
});

const getOfferAnalytics = asyncHandler(async (req, res) => {
  const filters = parseAnalyticsFilters(req.query);
  const offerQuery = await buildOfferQuery(Application, JobPosting, filters);

  if (!queryHasResults(offerQuery)) {
    return res.json({
      success: true,
      data: {
        pending: 0,
        accepted: 0,
        rejected: 0,
        expired: 0,
        awaitingResponse: 0,
        total: 0,
        acceptanceRate: 0,
      },
    });
  }

  const [pending, approved, onHold, accepted, rejected, expired] = await Promise.all([
    Offer.countDocuments({ ...offerQuery, status: "Pending" }),
    Offer.countDocuments({ ...offerQuery, status: "Approved" }),
    Offer.countDocuments({ ...offerQuery, status: "On Hold" }),
    Offer.countDocuments({ ...offerQuery, status: "Accepted" }),
    Offer.countDocuments({ ...offerQuery, status: "Rejected" }),
    Offer.countDocuments({ ...offerQuery, status: "Expired" }),
  ]);

  const awaitingResponse = pending + approved + onHold;
  const total = pending + approved + onHold + accepted + rejected + expired;
  const decided = accepted + rejected + expired;

  res.json({
    success: true,
    data: {
      pending,
      approved,
      onHold,
      accepted,
      rejected,
      expired,
      awaitingResponse,
      total,
      acceptanceRate: percent(accepted, decided, 2),
    },
  });
});

const getApplicantDemographics = asyncHandler(async (req, res) => {
  const filters = parseAnalyticsFilters(req.query);
  const matchStage = filters.dateRange ? { $match: { createdAt: filters.dateRange } } : null;
  const pipelineBase = matchStage ? [matchStage] : [];

  const byEducation = await Applicant.aggregate([
    ...pipelineBase,
    { $group: { _id: "$educationLevel", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const byStatus = await Applicant.aggregate([
    ...pipelineBase,
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const experienceRanges = await Applicant.aggregate([
    ...pipelineBase,
    {
      $bucket: {
        groupBy: "$yearsOfExperience",
        boundaries: [0, 2, 5, 10, 20],
        default: "20+",
        output: { count: { $sum: 1 } },
      },
    },
  ]);

  res.json({
    success: true,
    data: { byEducation, byStatus, experienceRanges },
  });
});

const getRecruitmentTrends = asyncHandler(async (req, res) => {
  const filters = parseAnalyticsFilters(req.query);
  const appQuery = await buildApplicationQuery(Application, JobPosting, filters);

  if (!queryHasResults(appQuery)) {
    return res.json({
      success: true,
      data: { applicationsOverTime: [], applicantsOverTime: [] },
    });
  }

  const combinedMatch = { ...appQuery };

  const applicationsOverTime = await Application.aggregate([
    { $match: combinedMatch },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$applicationDate" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } },
  ]);

  const applicantsOverTime = await Application.aggregate([
    { $match: combinedMatch },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$applicationDate" } },
          applicantId: "$applicantId",
        },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: "$_id", count: 1, _id: 0 } },
  ]);

  res.json({
    success: true,
    data: { applicationsOverTime, applicantsOverTime },
  });
});

const getRecruitmentInsights = asyncHandler(async (req, res) => {
  const filters = parseAnalyticsFilters(req.query);
  const appQuery = await buildApplicationQuery(Application, JobPosting, filters);
  const interviewQuery = await buildInterviewQuery(Application, JobPosting, filters);
  const offerQuery = await buildOfferQuery(Application, JobPosting, filters);
  const jobQuery = buildJobQuery(filters);

  if (!queryHasResults(appQuery)) {
    return res.json({
      success: true,
      data: { insights: ["No recruitment activity matches the selected filters."] },
    });
  }

  const insights = [];
  const totalApplications = await Application.countDocuments(appQuery);
  insights.push(`${totalApplications} application${totalApplications === 1 ? "" : "s"} recorded in the selected scope.`);

  const [scheduled, completed] = await Promise.all([
    emptyQueryResult(Interview, { ...interviewQuery, status: "Scheduled" }),
    emptyQueryResult(Interview, { ...interviewQuery, status: "Completed" }),
  ]);

  if (scheduled + completed > 0) {
    insights.push(
      `Interview completion rate is ${percent(completed, scheduled + completed)}% (${completed} completed of ${scheduled + completed} scheduled/completed).`
    );
  }

  const completedInterviews = await Interview.find({ ...interviewQuery, status: "Completed" }).select("recommendation");
  const proceedCount = completedInterviews.filter((item) => item.recommendation === "Proceed").length;
  if (proceedCount > 0) {
    insights.push(`${proceedCount} candidate${proceedCount === 1 ? "" : "s"} recommended to proceed after interview.`);
  }

  const [awaitingResponse, expiredOffers] = await Promise.all([
    Offer.countDocuments({
      ...offerQuery,
      status: { $in: ["Pending", "Approved", "On Hold"] },
    }),
    Offer.countDocuments({ ...offerQuery, status: "Expired" }),
  ]);

  if (awaitingResponse > 0) {
    insights.push(`${awaitingResponse} offer${awaitingResponse === 1 ? "" : "s"} awaiting candidate response.`);
  }

  if (expiredOffers > 0) {
    insights.push(
      `${expiredOffers} offer${expiredOffers === 1 ? " has" : "s have"} expired and may need follow-up or re-issuing.`
    );
  }

  const jobs = await JobPosting.find(jobQuery).select("jobTitle applicantCount");
  if (jobs.length > 0) {
    const sorted = [...jobs].sort((a, b) => (b.applicantCount || 0) - (a.applicantCount || 0));
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    if (highest?.applicantCount > 0) {
      insights.push(`Highest application volume: ${highest.jobTitle} (${highest.applicantCount} applications).`);
    }

    if (lowest && lowest._id !== highest._id && (lowest.applicantCount || 0) === 0) {
      insights.push(`Low application volume: ${lowest.jobTitle} has received no applications yet.`);
    }
  }

  res.json({ success: true, data: { insights } });
});

const getAnalyticsFilterOptions = asyncHandler(async (req, res) => {
  const departments = await JobPosting.distinct("department");
  const jobs = await JobPosting.find()
    .select("jobTitle department status")
    .sort({ jobTitle: 1 });

  res.json({
    success: true,
    data: {
      departments: departments.filter(Boolean).sort(),
      jobs: jobs.map((job) => ({
        id: job._id,
        jobTitle: job.jobTitle,
        department: job.department,
        status: job.status,
      })),
      jobStatuses: ["Draft", "Published", "Closed"],
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
  getRecruitmentTrends,
  getRecruitmentInsights,
  getAnalyticsFilterOptions,
};
