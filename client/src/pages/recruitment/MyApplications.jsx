import React, { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/axios";
import "../../styles/applicant-portal.css";

const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const applicantId = localStorage.getItem("applicantId");

  useEffect(() => {
    if (applicantId) {
      fetchMyApplications();
    } else {
      setLoading(false);
    }
  }, [applicantId]);

  const fetchMyApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/recruitment/applications/applicant/${applicantId}`);
      setApplications(response.data.data);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load your applications");
    } finally {
      setLoading(false);
    }
  };

  if (!applicantId) {
    return <Navigate to="/recruitment/auth" replace />;
  }

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

  if (loading) {
    return (
      <div className="applicant-page">
        <div className="loading">Loading your applications...</div>
      </div>
    );
  }

  return (
    <div className="applicant-page">
      <header className="applicant-page-header">
        <h1>My applications</h1>
        <p className="subtitle">Track where each application stands in the hiring process</p>
      </header>

      {applications.length === 0 ? (
        <div className="no-applications">
          <strong>You have not submitted any applications yet</strong>
          Browse open positions and apply to get started.
          <Link to="/recruitment/browse" className="btn-browse">
            Browse positions
          </Link>
        </div>
      ) : (
        <div className="applications-timeline">
          {applications.map((app) => (
            <article key={app._id} className="application-card">
              <div className="app-header">
                <h3>{app.jobId?.jobTitle}</h3>
                <span className={`status-badge ${getStatusColor(app.status)}`}>{app.status}</span>
              </div>

              <div className="app-details">
                <div className="detail-row">
                  <span className="label">Department</span>
                  <span className="value">{app.jobId?.department}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Applied on</span>
                  <span className="value">{new Date(app.applicationDate).toLocaleDateString()}</span>
                </div>
                {app.rating && (
                  <div className="detail-row">
                    <span className="label">Interview rating</span>
                    <span className="value">{app.rating}/5</span>
                  </div>
                )}
              </div>

              {app.coverLetter && (
                <div className="cover-letter">
                  <h4>Your cover letter</h4>
                  <p>{app.coverLetter.substring(0, 200)}...</p>
                </div>
              )}

              <div className="app-timeline" aria-label="Application progress">
                <div className={`timeline-item ${app.status !== "Submitted" ? "completed" : ""}`}>
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <p>Submitted</p>
                    <span>{new Date(app.applicationDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div
                  className={`timeline-item ${
                    ["Shortlisted", "Selected", "Offered"].includes(app.status) ? "completed" : ""
                  }`}
                >
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <p>Under review</p>
                  </div>
                </div>

                <div className={`timeline-item ${app.status === "Offered" ? "completed" : ""}`}>
                  <div className="timeline-marker" />
                  <div className="timeline-content">
                    <p>Interview &amp; offer</p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyApplications;
