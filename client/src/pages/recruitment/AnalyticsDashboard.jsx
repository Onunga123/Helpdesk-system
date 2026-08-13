import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import "../../styles/analytics.css";
import "../../styles/recruitment.css";

const PERIOD_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "year", label: "This year" },
  { value: "prev_year", label: "Previous year" },
  { value: "custom", label: "Custom range" },
];

const FUNNEL_COLORS = ["#dbeafe", "#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"];

const buildQueryString = (filters) => {
  const params = new URLSearchParams();
  if (filters.period && filters.period !== "all") params.append("period", filters.period);
  if (filters.period === "custom") {
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
  }
  if (filters.department) params.append("department", filters.department);
  if (filters.jobId) params.append("jobId", filters.jobId);
  if (filters.status) params.append("status", filters.status);
  const query = params.toString();
  return query ? `?${query}` : "";
};

const TrendChart = ({ title, help, data, emptyLabel }) => {
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="analytics-card">
      <div className="analytics-card-header">
        <h2>{title}</h2>
        {help && <p className="analytics-help">{help}</p>}
      </div>
      {data.length === 0 ? (
        <p className="analytics-empty">{emptyLabel}</p>
      ) : (
        <div className="trend-chart" role="img" aria-label={title}>
          {data.map((item) => (
            <div className="trend-bar-wrap" key={item.date}>
              <div className="trend-bar" style={{ height: `${(item.count / max) * 100}%` }} title={`${item.date}: ${item.count}`} />
              <span className="trend-label">{item.date.slice(5)}</span>
              <span className="trend-value">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [filters, setFilters] = useState({
    period: "all",
    startDate: "",
    endDate: "",
    department: "",
    jobId: "",
    status: "",
  });
  const [filterOptions, setFilterOptions] = useState({ departments: [], jobs: [], jobStatuses: [] });
  const [dashboard, setDashboard] = useState(null);
  const [jobAnalytics, setJobAnalytics] = useState([]);
  const [appMetrics, setAppMetrics] = useState(null);
  const [interviewMetrics, setInterviewMetrics] = useState(null);
  const [offerMetrics, setOfferMetrics] = useState(null);
  const [trends, setTrends] = useState({ applicationsOverTime: [], applicantsOverTime: [] });
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const query = useMemo(() => buildQueryString(filters), [filters]);

  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await axios.get("/analytics/filters");
      setFilterOptions(response.data.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAllAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [dash, jobs, apps, interviews, offers, trendRes, insightRes] = await Promise.all([
        axios.get(`/analytics/dashboard${query}`),
        axios.get(`/analytics/jobs${query}`),
        axios.get(`/analytics/applications${query}`),
        axios.get(`/analytics/interviews${query}`),
        axios.get(`/analytics/offers${query}`),
        axios.get(`/analytics/trends${query}`),
        axios.get(`/analytics/insights${query}`),
      ]);

      setDashboard(dash.data.data);
      setJobAnalytics(jobs.data.data);
      setAppMetrics(apps.data.data);
      setInterviewMetrics(interviews.data.data);
      setOfferMetrics(offers.data.data);
      setTrends(trendRes.data.data);
      setInsights(insightRes.data.data.insights || []);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to load analytics";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  const kpiCards = dashboard
    ? [
        { label: "Total Jobs", value: dashboard.totalJobs, sub: `${dashboard.publishedJobs} published`, help: "All job postings in scope" },
        { label: "Published Jobs", value: dashboard.publishedJobs, sub: "Live vacancies", help: "Jobs currently open to applicants" },
        { label: "Total Applicants", value: dashboard.totalApplicants, sub: "Unique profiles", help: "Distinct candidate profiles" },
        { label: "Total Applications", value: dashboard.totalApplications, sub: "Submitted applications", help: "Applications submitted for vacancies" },
        { label: "Shortlisted", value: dashboard.shortlisted, sub: "Applications", help: "Applications currently shortlisted" },
        { label: "Interviews", value: dashboard.totalInterviews, sub: "All statuses", help: "Scheduled, completed, and cancelled interviews" },
        { label: "Offers", value: dashboard.totalOffers, sub: "All offer records", help: "Offers created in the selected scope" },
        { label: "Accepted / Hired", value: dashboard.hired, sub: `${dashboard.acceptedOffers} accepted offers`, help: "Accepted offers or hired candidates" },
        { label: "Hiring Conversion", value: `${dashboard.hiringConversionRate}%`, sub: "Hires / applications", help: "Percentage of applications resulting in a hire" },
      ]
    : [];

  if (loading) {
    return <div className="analytics-container"><div className="loading">Loading analytics...</div></div>;
  }

  return (
    <div className="analytics-container">
      <header className="analytics-header">
        <div>
          <h1>Recruitment Analytics</h1>
          <p className="analytics-subtitle">Track hiring performance, funnel conversion, and vacancy outcomes.</p>
        </div>
      </header>

      <section className="analytics-filters" aria-label="Analytics filters">
        <div className="analytics-filter-row">
          <label>
            Period
            <select
              value={filters.period}
              onChange={(e) => setFilters((prev) => ({ ...prev, period: e.target.value }))}
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          {filters.period === "custom" && (
            <>
              <label>
                From
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                />
              </label>
            </>
          )}
          <label>
            Department
            <select
              value={filters.department}
              onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
            >
              <option value="">All departments</option>
              {filterOptions.departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </label>
          <label>
            Job / Vacancy
            <select
              value={filters.jobId}
              onChange={(e) => setFilters((prev) => ({ ...prev, jobId: e.target.value }))}
            >
              <option value="">All jobs</option>
              {filterOptions.jobs.map((job) => (
                <option key={job.id} value={job.id}>{job.jobTitle}</option>
              ))}
            </select>
          </label>
          <label>
            Job Status
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All statuses</option>
              {filterOptions.jobStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div className="analytics-error" role="alert">
          {error}
        </div>
      )}

      {dashboard && (
        <section className="kpi-grid" aria-label="Recruitment KPI overview">
          {kpiCards.map((card) => (
            <div className="kpi-card" key={card.label} title={card.help}>
              <h3>{card.value}</h3>
              <p>{card.label}</p>
              <span className="kpi-sub">{card.sub}</span>
            </div>
          ))}
        </section>
      )}

      {insights.length > 0 && (
        <section className="analytics-card insights-card full-width">
          <h2>Recruitment Insights</h2>
          <ul className="insights-list">
            {insights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="analytics-grid">
        {appMetrics && (
          <div className="analytics-card funnel-card">
            <div className="analytics-card-header">
              <h2>Application Funnel</h2>
              <p className="analytics-help">
                Cumulative progression from submission to hire. Conversion shows movement from the previous stage.
              </p>
            </div>
            {appMetrics.total === 0 ? (
              <p className="analytics-empty">No applications in the selected scope.</p>
            ) : (
              <div className="funnel-list">
                {appMetrics.funnel.map((stage, index) => (
                  <div className="funnel-step" key={stage.key}>
                    <div className="funnel-step-header">
                      <span className="funnel-stage">{stage.stage}</span>
                      <span className="funnel-count">{stage.count}</span>
                    </div>
                    <div className="bar-container">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${stage.percentageOfTotal}%`,
                          background: FUNNEL_COLORS[index] || FUNNEL_COLORS[FUNNEL_COLORS.length - 1],
                        }}
                      />
                    </div>
                    <div className="funnel-meta">
                      <span>{stage.percentageOfTotal}% of applications</span>
                      {index > 0 && <span>{stage.conversionFromPrevious}% from previous stage</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {interviewMetrics && (
          <div className="analytics-card">
            <div className="analytics-card-header">
              <h2>Interview Analytics</h2>
              <p className="analytics-help">Completion rate is based on completed interviews vs scheduled + completed.</p>
            </div>
            <div className="interview-stats">
              <div className="stat-item">
                <span className="stat-label">Scheduled</span>
                <span className="stat-value">{interviewMetrics.scheduled}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{interviewMetrics.completed}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Cancelled</span>
                <span className="stat-value">{interviewMetrics.cancelled}</span>
              </div>
            </div>
            <p className="analytics-inline-metric">Completion rate: <strong>{interviewMetrics.completionRate}%</strong></p>
            <div className="recommendations">
              <h4>Interview Recommendations</h4>
              <div className="rec-items">
                <div>Proceed: {interviewMetrics.recommendations.proceed} ({interviewMetrics.recommendationRates.proceed}%)</div>
                <div>On Hold: {interviewMetrics.recommendations.onHold} ({interviewMetrics.recommendationRates.onHold}%)</div>
                <div>Reject: {interviewMetrics.recommendations.reject} ({interviewMetrics.recommendationRates.reject}%)</div>
              </div>
            </div>
          </div>
        )}

        {offerMetrics && (
          <div className="analytics-card">
            <div className="analytics-card-header">
              <h2>Offer Analytics</h2>
              <p className="analytics-help">
                Acceptance rate uses decided offers (accepted, rejected, expired). Expired offers may require follow-up.
              </p>
            </div>
            <div className="offer-stats">
              <div className="offer-stat">
                <span className="label">Pending</span>
                <span className="value">{offerMetrics.pending}</span>
              </div>
              <div className="offer-stat">
                <span className="label">Accepted</span>
                <span className="value highlight">{offerMetrics.accepted}</span>
              </div>
              <div className="offer-stat">
                <span className="label">Rejected</span>
                <span className="value">{offerMetrics.rejected}</span>
              </div>
              <div className="offer-stat">
                <span className="label">Expired</span>
                <span className="value">{offerMetrics.expired}</span>
              </div>
            </div>
            <div className="acceptance-rate">
              <span>Acceptance rate: {offerMetrics.acceptanceRate}%</span>
              <div className="rate-bar">
                <div className="rate-fill" style={{ width: `${offerMetrics.acceptanceRate}%` }} />
              </div>
            </div>
            {offerMetrics.awaitingResponse > 0 && (
              <p className="analytics-inline-note">
                {offerMetrics.awaitingResponse} offer{offerMetrics.awaitingResponse === 1 ? "" : "s"} awaiting candidate response.
              </p>
            )}
            {offerMetrics.expired > 0 && (
              <p className="analytics-inline-note warning">
                {offerMetrics.expired} expired offer{offerMetrics.expired === 1 ? "" : "s"} may need re-issuing or follow-up.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="analytics-grid trends-grid">
        <TrendChart
          title="Applications Over Time"
          help="Daily application volume in the selected scope."
          data={trends.applicationsOverTime || []}
          emptyLabel="No application trend data for the selected filters."
        />
        <TrendChart
          title="Applicants Over Time"
          help="Unique applicants applying per day."
          data={trends.applicantsOverTime || []}
          emptyLabel="No applicant trend data for the selected filters."
        />
      </div>

      <section className="analytics-card full-width">
        <div className="analytics-card-header">
          <h2>Job Posting Performance</h2>
          <p className="analytics-help">Conversion rate = hired / applications for each vacancy.</p>
        </div>
        {jobAnalytics.length === 0 ? (
          <p className="analytics-empty">No job postings match the selected filters.</p>
        ) : (
          <>
            <div className="table-wrap analytics-desktop-table">
              <table className="performance-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Status</th>
                    <th>Applications</th>
                    <th>Shortlisted</th>
                    <th>Interviews</th>
                    <th>Offers</th>
                    <th>Hired</th>
                    <th>Days Open</th>
                    <th>Days Until Deadline</th>
                    <th>Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {jobAnalytics.map((job) => (
                    <tr key={job.jobId}>
                      <td><strong>{job.jobTitle}</strong><small className="job-dept">{job.department}</small></td>
                      <td><span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span></td>
                      <td>{job.applicantCount}</td>
                      <td>{job.shortlisted}</td>
                      <td>{job.interviews}</td>
                      <td>{job.offers}</td>
                      <td>{job.hired}</td>
                      <td>{job.daysOpen}</td>
                      <td className={job.deadlineRemaining < 0 ? "expired" : ""}>{job.deadlineRemaining}</td>
                      <td>{job.conversionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="analytics-mobile-cards">
              {jobAnalytics.map((job) => (
                <article className="job-performance-card" key={`mobile-${job.jobId}`}>
                  <div className="job-performance-header">
                    <div>
                      <h3>{job.jobTitle}</h3>
                      <p>{job.department}</p>
                    </div>
                    <span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span>
                  </div>
                  <div className="job-performance-metrics">
                    <div><span>Applications</span><strong>{job.applicantCount}</strong></div>
                    <div><span>Shortlisted</span><strong>{job.shortlisted}</strong></div>
                    <div><span>Interviews</span><strong>{job.interviews}</strong></div>
                    <div><span>Offers</span><strong>{job.offers}</strong></div>
                    <div><span>Hired</span><strong>{job.hired}</strong></div>
                    <div><span>Conversion</span><strong>{job.conversionRate}%</strong></div>
                    <div><span>Days open</span><strong>{job.daysOpen}</strong></div>
                    <div className={job.deadlineRemaining < 0 ? "expired" : ""}>
                      <span>Deadline</span>
                      <strong>{job.deadlineRemaining} days</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default AnalyticsDashboard;
