import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import "../../styles/analytics.css";

const AnalyticsDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [jobAnalytics, setJobAnalytics] = useState([]);
  const [appMetrics, setAppMetrics] = useState(null);
  const [interviewMetrics, setInterviewMetrics] = useState(null);
  const [offerMetrics, setOfferMetrics] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  const fetchAllAnalytics = async () => {
    try {
      setLoading(true);
      const [dash, jobs, apps, interviews, offers, demo] = await Promise.all([
        axios.get("/analytics/dashboard"),
        axios.get("/analytics/jobs"),
        axios.get("/analytics/applications"),
        axios.get("/analytics/interviews"),
        axios.get("/analytics/offers"),
        axios.get("/analytics/demographics"),
      ]);

      setDashboard(dash.data.data);
      setJobAnalytics(jobs.data.data);
      setAppMetrics(apps.data.data);
      setInterviewMetrics(interviews.data.data);
      setOfferMetrics(offers.data.data);
      setDemographics(demo.data.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  return (
    <div className="analytics-container">
      <h1>Recruitment Analytics</h1>

      {dashboard && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <h3>{dashboard.totalJobs}</h3>
            <p>Total Jobs</p>
            <span className="kpi-sub">{dashboard.publishedJobs} Published</span>
          </div>
          <div className="kpi-card">
            <h3>{dashboard.totalApplicants}</h3>
            <p>Total Applicants</p>
            <span className="kpi-sub">{dashboard.totalApplications} Applications</span>
          </div>
          <div className="kpi-card">
            <h3>{dashboard.totalInterviews}</h3>
            <p>Interviews</p>
            <span className="kpi-sub">In Progress</span>
          </div>
          <div className="kpi-card">
            <h3>{dashboard.acceptedOffers}</h3>
            <p>Accepted Offers</p>
            <span className="kpi-sub">{dashboard.conversionRate}% Conversion</span>
          </div>
        </div>
      )}

      <div className="analytics-grid">
        {appMetrics && (
          <div className="analytics-card">
            <h2>Application Status</h2>
            <div className="metric-bars">
              <div className="metric-bar">
                <div className="bar-label">
                  <span>Submitted</span>
                  <span>{appMetrics.submitted.count}</span>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{width: appMetrics.submitted.percentage + "%", background: "#fff9c4"}}
                  ></div>
                </div>
                <span className="bar-percent">{appMetrics.submitted.percentage}%</span>
              </div>

              <div className="metric-bar">
                <div className="bar-label">
                  <span>Shortlisted</span>
                  <span>{appMetrics.shortlisted.count}</span>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{width: appMetrics.shortlisted.percentage + "%", background: "#b3e5fc"}}
                  ></div>
                </div>
                <span className="bar-percent">{appMetrics.shortlisted.percentage}%</span>
              </div>

              <div className="metric-bar">
                <div className="bar-label">
                  <span>Selected</span>
                  <span>{appMetrics.selected.count}</span>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{width: appMetrics.selected.percentage + "%", background: "#c8e6c9"}}
                  ></div>
                </div>
                <span className="bar-percent">{appMetrics.selected.percentage}%</span>
              </div>

              <div className="metric-bar">
                <div className="bar-label">
                  <span>Offered</span>
                  <span>{appMetrics.offered.count}</span>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{width: appMetrics.offered.percentage + "%", background: "#b2dfdb"}}
                  ></div>
                </div>
                <span className="bar-percent">{appMetrics.offered.percentage}%</span>
              </div>

              <div className="metric-bar">
                <div className="bar-label">
                  <span>Rejected</span>
                  <span>{appMetrics.rejected.count}</span>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar-fill" 
                    style={{width: appMetrics.rejected.percentage + "%", background: "#ffccbc"}}
                  ></div>
                </div>
                <span className="bar-percent">{appMetrics.rejected.percentage}%</span>
              </div>
            </div>
          </div>
        )}

        {interviewMetrics && (
          <div className="analytics-card">
            <h2>Interview Status</h2>
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
            {interviewMetrics.recommendations && (
              <div className="recommendations">
                <h4>Recommendations</h4>
                <div className="rec-items">
                  <div>Proceed: {interviewMetrics.recommendations.proceed}</div>
                  <div>On Hold: {interviewMetrics.recommendations.onHold}</div>
                  <div>Reject: {interviewMetrics.recommendations.reject}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {offerMetrics && (
          <div className="analytics-card">
            <h2>Offer Analytics</h2>
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
              <span>Acceptance Rate: {offerMetrics.acceptanceRate}%</span>
              <div className="rate-bar">
                <div 
                  className="rate-fill" 
                  style={{width: offerMetrics.acceptanceRate + "%"}}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {jobAnalytics.length > 0 && (
        <div className="analytics-card full-width">
          <h2>Job Posting Performance</h2>
          <table className="performance-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Status</th>
                <th>Applications</th>
                <th>Shortlisted</th>
                <th>Selected</th>
                <th>Days Open</th>
                <th>Days Until Deadline</th>
              </tr>
            </thead>
            <tbody>
              {jobAnalytics.map((job) => (
                <tr key={job.jobId}>
                  <td><strong>{job.jobTitle}</strong></td>
                  <td><span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span></td>
                  <td>{job.applicantCount}</td>
                  <td>{job.shortlisted}</td>
                  <td>{job.selected}</td>
                  <td>{job.daysOpen}</td>
                  <td className={job.deadlineRemaining < 0 ? "expired" : ""}>{job.deadlineRemaining}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
