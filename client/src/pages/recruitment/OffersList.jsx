import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import "../../styles/recruitment.css";

const OffersList = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "" });

  useEffect(() => {
    fetchOffers();
  }, [filters]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);

      const response = await axios.get(`/recruitment/offers?${params}`);
      setOffers(response.data.data);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const expireOffer = async (offerId) => {
    if (window.confirm("Mark this offer as expired?")) {
      try {
        await axios.put(`/recruitment/offers/${offerId}/expire`);
        fetchOffers();
      } catch (error) {
        console.error("Error expiring offer:", error);
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="recruitment-container">
      <h1>Job Offers</h1>

      <div className="filters">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      <table className="offers-table">
        <thead>
          <tr>
            <th>Job Title</th>
            <th>Salary</th>
            <th>Start Date</th>
            <th>Status</th>
            <th>Response</th>
            <th>Sent Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.length === 0 ? (
            <tr><td colSpan="7">No offers found</td></tr>
          ) : (
            offers.map((offer) => (
              <tr key={offer._id}>
                <td>{offer.jobTitle}</td>
                <td>KES {offer.salaryOffered.toLocaleString()}</td>
                <td>{new Date(offer.startDate).toLocaleDateString()}</td>
                <td><span className={`badge badge-${offer.status.toLowerCase()}`}>{offer.status}</span></td>
                <td>{offer.response || "-"}</td>
                <td>{new Date(offer.sentDate).toLocaleDateString()}</td>
                <td>
                  {offer.status === "Pending" && (
                    <button onClick={() => expireOffer(offer._id)} className="btn-small btn-danger">Expire</button>
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

export default OffersList;
