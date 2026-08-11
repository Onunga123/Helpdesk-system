import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import "../../styles/applicant-portal.css";

const BrowseJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("");

  useEffect(() => {
    fetchPublishedJobs();
  }, [filterDept]);

  const fetchPublishedJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ status: "Published" });
      if (filterDept) params.append("department", filterDept);

      const response = await axios.get(`/recruitment/jobs?${params}`);
      setJobs(response.data.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) =>
    job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading available positions...</div>;

  return (
    <div className="applicant-portal">
      <div className="jobs-browse-container">
        <h1>Available Positions</h1>
        <p className="subtitle">Find your next opportunity at TUC</p>

        <div className="search-filters">
          <input
            type="text"
            placeholder="Search by job title or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="filter-select"
          >
            <option value="">All Departments</option>
            <option value="ICT">ICT</option>
            <option value="Finance">Finance</option>
            <option value="HR">HR</option>
            <option value="Academic">Academic</option>
          </select>
        </div>

        <div className="jobs-browse-grid">
          <div className="jobs-list">
            {filteredJobs.length === 0 ? (
              <p className="no-results">No positions match your search</p>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job._id}
                  className={`job-item ${selectedJob?._id === job._id ? "active" : ""}`}
                  onClick={() => setSelectedJob(job)}
                >
                  <h3>{job.jobTitle}</h3>
                  <p className="department">{job.department}</p>
                  <p className="deadline">
                    Closes: {new Date(job.deadline).toLocaleDateString()}
                  </p>
                  <span className="applicant-count">{job.applicantCount} applications</span>
                </div>
              ))
            )}
          </div>

          <div className="job-details">
            {selectedJob ? (
              <>
                <h2>{selectedJob.jobTitle}</h2>
                <p className="department-badge">{selectedJob.department}</p>

                <div className="job-info">
                  <div className="info-section">
                    <h4>Position Type</h4>
                    <p>{selectedJob.jobType}</p>
                  </div>

                  <div className="info-section">
                    <h4>Salary Range</h4>
                    <p>
                      KES {selectedJob.salary?.min?.toLocaleString() || "TBD"} - KES{" "}
                      {selectedJob.salary?.max?.toLocaleString() || "TBD"}
                    </p>
                  </div>

                  <div className="info-section">
                    <h4>Application Deadline</h4>
                    <p>{new Date(selectedJob.deadline).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="job-description">
                  <h4>About This Position</h4>
                  <p>{selectedJob.description}</p>
                </div>

                <div className="job-requirements">
                  <h4>Requirements</h4>
                  <p>{selectedJob.requirements}</p>
                </div>

                <button className="btn-apply">Apply Now</button>
              </>
            ) : (
              <div className="no-selection">
                <p>Select a position to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseJobs;
