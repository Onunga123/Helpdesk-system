import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import "../../styles/applicant-portal.css";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const applicantId = localStorage.getItem("applicantId");

  useEffect(() => {
    fetchMyApplications();
  }, []);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/recruitment/applications/applicant/${applicantId}`);
      setApplications(response.data.data);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading your applications...</div>;

  const getStatusColor = (status) => {
    switch (status) {
      case "Submitted":
        return "status-submitted";
      case "Shortlisted":
        return "status-shortlisted";
      case "Selected":
        return "status-selected";
      case "Offered":
        return "status-offered";
      case "Rejected":
        return "status-rejected";
      default:
        return "";
    }
  };

  return (
    <div className="applicant-portal">
      <div className="my-applications-container">
        <h1>My Applications</h1>
        <p className="subtitle">Track your application status</p>

        {applications.length === 0 ? (
          <div className="no-applications">
            <p>You haven't submitted any applications yet</p>
            <a href="/recruitment/browse" className="btn-browse">Browse Positions</a>
          </div>
        ) : (
          <div className="applications-timeline">
            {applications.map((app) => (
              <div key={app._id} className="application-card">
                <div className="app-header">
                  <h3>{app.jobId?.jobTitle}</h3>
                  <span className={`status-badge ${getStatusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>

                <div className="app-details">
                  <div className="detail-row">
                    <span className="label">Department:</span>
                    <span className="value">{app.jobId?.department}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Applied On:</span>
                    <span className="value">
                      {new Date(app.applicationDate).toLocaleDateString()}
                    </span>
                  </div>
                  {app.rating && (
                    <div className="detail-row">
                      <span className="label">Interview Rating:</span>
                      <span className="value">⭐ {app.rating}/5</span>
                    </div>
                  )}
                </div>

                {app.coverLetter && (
                  <div className="cover-letter">
                    <h4>Your Cover Letter</h4>
                    <p>{app.coverLetter.substring(0, 200)}...</p>
                  </div>
                )}

                <div className="app-timeline">
                  <div className={`timeline-item ${app.status !== "Submitted" ? "completed" : ""}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <p>Application Submitted</p>
                      <span>{new Date(app.applicationDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className={`timeline-item ${["Shortlisted", "Selected", "Offered"].includes(app.status) ? "completed" : ""}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <p>Under Review</p>
                    </div>
                  </div>

                  <div className={`timeline-item ${app.status === "Offered" ? "completed" : ""}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <p>Interview & Offer</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplications;
