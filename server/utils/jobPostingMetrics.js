const Application = require("../models/applicationModel");
const Interview = require("../models/interviewModel");
const Offer = require("../models/offerModel");

const SHORTLISTED_STATUSES = ["Shortlisted", "Selected", "Offered"];

const enrichJobPostingsWithMetrics = async (jobs) => {
  if (!jobs.length) return [];

  const jobIds = jobs.map((job) => job._id);
  const applications = await Application.find({ jobId: { $in: jobIds } }).select("jobId status");

  const appsByJob = {};
  for (const app of applications) {
    const key = String(app.jobId);
    if (!appsByJob[key]) appsByJob[key] = [];
    appsByJob[key].push(app);
  }

  const applicationIds = applications.map((app) => app._id);
  const [interviews, offers] = await Promise.all([
    applicationIds.length
      ? Interview.find({ applicationId: { $in: applicationIds } }).select("applicationId")
      : [],
    applicationIds.length
      ? Offer.find({ applicationId: { $in: applicationIds } }).select("applicationId")
      : [],
  ]);

  const interviewAppIds = new Set(interviews.map((item) => String(item.applicationId)));
  const offerAppIds = new Set(offers.map((item) => String(item.applicationId)));

  return jobs.map((job) => {
    const jobObj = typeof job.toObject === "function" ? job.toObject() : { ...job };
    const jobApps = appsByJob[String(job._id)] || [];
    const applicationCount = jobApps.length;
    const shortlisted = jobApps.filter((app) => SHORTLISTED_STATUSES.includes(app.status)).length;

    let interviewCount = 0;
    let offerCount = 0;
    for (const app of jobApps) {
      const appId = String(app._id);
      if (interviewAppIds.has(appId)) interviewCount += 1;
      if (offerAppIds.has(appId)) offerCount += 1;
    }

    return {
      ...jobObj,
      applicantCount: applicationCount || jobObj.applicantCount || 0,
      recruitmentMetrics: {
        applications: applicationCount,
        shortlisted,
        interviews: interviewCount,
        offers: offerCount,
      },
    };
  });
};

module.exports = {
  enrichJobPostingsWithMetrics,
  SHORTLISTED_STATUSES,
};
