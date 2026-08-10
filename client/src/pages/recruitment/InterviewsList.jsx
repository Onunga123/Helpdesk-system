import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import "../../styles/recruitment.css";

const InterviewsList = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "" });

  useEffect(() => {
    fetchInterviews();
  }, [filters]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);

      const response = await axios.get(`/recruitment/interviews?${params}`);
      setInterviews(response.data.data);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const completeInterview = async (interviewId) => {
    const notes = prompt("Enter interview notes:");
    if (!notes) return;

    const recommendation = prompt("Enter recommendation (Proceed/Reject/On Hold):");
    if (!recommendation) return;

    try {
      await axios.put(`/recruitment/interviews/${interviewId}/complete`, {
        interviewNotes: notes,
        recommendation,
      });
      fetchInterviews();
    } catch (error) {
      console.error("Error completing interview:", error);
    }
  };

  const cancelInterview = async (interviewId) => {
    if (window.confirm("Cancel this interview?")) {
      try {
        await axios.put(`/recruitment/interviews/${interviewId}/cancel`);
        fetchInterviews();
      } catch (error) {
        console.error("Error cancelling interview:", error);
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="recruitment-container">
      <h1>Interviews</h1>

      <div className="filters">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <table className="interviews-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Type</th>
            <th>Location</th>
            <th>Status</th>
            <th>Recommendation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {interviews.length === 0 ? (
            <tr><td colSpan="7">No interviews found</td></tr>
          ) : (
            interviews.map((interview) => (
              <tr key={interview._id}>
                <td>{new Date(interview.interviewDate).toLocaleDateString()}</td>
                <td>{interview.interviewTime}</td>
                <td>{interview.interviewType}</td>
                <td>{interview.location}</td>
                <td><span className={`badge badge-${interview.status.toLowerCase()}`}>{interview.status}</span></td>
                <td>{interview.recommendation || "-"}</td>
                <td>
                  {interview.status === "Scheduled" && (
                    <>
                      <button onClick={() => completeInterview(interview._id)} className="btn-small">Complete</button>
                      <button onClick={() => cancelInterview(interview._id)} className="btn-small btn-danger">Cancel</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InterviewsList;
