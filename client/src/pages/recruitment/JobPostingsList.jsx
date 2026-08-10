import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import "../../styles/recruitment.css";

const JobPostingsList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", jobType: "" });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.jobType) params.append("jobType", filters.jobType);

      const response = await axios.get(`/recruitment/jobs?${params}`);
      setJobs(response.data.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const publishJob = async (jobId) => {
    try {
      await axios.put(`/recruitment/jobs/${jobId}/publish`);
      fetchJobs();
    } catch (error) {
      console.error("Error publishing job:", error);
    }
  };

  const closeJob = async (jobId) => {
    try {
      await axios.put(`/recruitment/jobs/${jobId}/close`);
      fetchJobs();
    } catch (error) {
      console.error("Error closing job:", error);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="recruitment-container">
      <h1>Job Postings</h1>

      <div className="filters">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
          <option value="Closed">Closed</option>
        </select>

        <select value={filters.jobType} onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}>
          <option value="">All Types</option>
          <option value="Academic">Academic</option>
          <option value="Administrative">Administrative</option>
          <option value="Technical">Technical</option>
          <option value="Support">Support</option>
        </select>
      </div>

      <div className="jobs-grid">
        {jobs.length === 0 ? (
          <p>No jobs found</p>
        ) : (
          jobs.map((job) => (
            <div key={job._id} className="job-card">
              <h3>{job.jobTitle}</h3>
              <p className="department">{job.department}</p>
              <p className="description">{job.description.substring(0, 100)}...</p>
              <div className="job-meta">
                <span className={`badge badge-${job.status.toLowerCase()}`}>{job.status}</span>
                <span className="applicants">{job.applicantCount} Applications</span>
              </div>
              <p className="deadline">Deadline: {new Date(job.deadline).toLocaleDateString()}</p>
              <div className="job-actions">
                {job.status === "Draft" && (
                  <button onClick={() => publishJob(job._id)} className="btn-publish">Publish</button>
                )}
                {job.status === "Published" && (
                  <button onClick={() => closeJob(job._id)} className="btn-close">Close</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobPostingsList;
