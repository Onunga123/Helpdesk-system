const percent = (part, whole, digits = 1) => {
  if (!whole || whole <= 0 || !part) return 0;
  return Number(((part / whole) * 100).toFixed(digits));
};

const parseAnalyticsFilters = (query = {}) => {
  const now = new Date();
  let start = null;
  let end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const { period, startDate, endDate, department, jobId, status } = query;

  if (period === "7d") {
    start = new Date(now);
    start.setDate(start.getDate() - 7);
  } else if (period === "30d") {
    start = new Date(now);
    start.setDate(start.getDate() - 30);
  } else if (period === "90d") {
    start = new Date(now);
    start.setDate(start.getDate() - 90);
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  } else if (period === "prev_year") {
    start = new Date(now.getFullYear() - 1, 0, 1);
    end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  } else if (period === "custom" && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  }

  if (start) {
    start.setHours(0, 0, 0, 0);
  }

  const dateRange = start ? { $gte: start, $lte: end } : null;

  return {
    period: period || "all",
    start,
    end,
    department: department?.trim() || "",
    jobId: jobId?.trim() || "",
    status: status?.trim() || "",
    dateRange,
    applicationDateFilter: dateRange ? { applicationDate: dateRange } : {},
    jobCreatedFilter: dateRange ? { createdAt: dateRange } : {},
    interviewDateFilter: dateRange ? { interviewDate: dateRange } : {},
    offerCreatedFilter: dateRange ? { createdAt: dateRange } : {},
    applicantCreatedFilter: dateRange ? { createdAt: dateRange } : {},
  };
};

const buildJobQuery = (filters) => {
  const query = { ...filters.jobCreatedFilter };
  if (filters.department) query.department = filters.department;
  if (filters.status) query.status = filters.status;
  if (filters.jobId) query._id = filters.jobId;
  return query;
};

const getJobIdsForFilters = async (JobPosting, filters) => {
  if (filters.jobId) return [filters.jobId];
  if (!filters.department && !filters.status) return null;

  const jobs = await JobPosting.find({
    ...(filters.department ? { department: filters.department } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  }).select("_id");

  return jobs.map((job) => job._id);
};

const buildApplicationQuery = async (Application, JobPosting, filters) => {
  const query = { ...filters.applicationDateFilter };
  const jobIds = await getJobIdsForFilters(JobPosting, filters);

  if (filters.jobId) {
    query.jobId = filters.jobId;
  } else if (jobIds) {
    query.jobId = { $in: jobIds };
  }

  return query;
};

const buildInterviewQuery = async (Application, JobPosting, filters) => {
  const query = { ...filters.interviewDateFilter };
  const appQuery = await buildApplicationQuery(Application, JobPosting, filters);
  const applications = await Application.find(appQuery).select("_id");
  const applicationIds = applications.map((app) => app._id);

  if (applicationIds.length === 0) {
    return { _id: null };
  }

  query.applicationId = { $in: applicationIds };
  return query;
};

const buildOfferQuery = async (Application, JobPosting, filters) => {
  const query = { ...filters.offerCreatedFilter };
  const appQuery = await buildApplicationQuery(Application, JobPosting, filters);
  const applications = await Application.find(appQuery).select("_id");
  const applicationIds = applications.map((app) => app._id);

  if (applicationIds.length === 0) {
    return { _id: null };
  }

  query.applicationId = { $in: applicationIds };
  return query;
};

module.exports = {
  percent,
  parseAnalyticsFilters,
  buildJobQuery,
  buildApplicationQuery,
  buildInterviewQuery,
  buildOfferQuery,
  getJobIdsForFilters,
};
