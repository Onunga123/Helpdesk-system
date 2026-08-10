import React, { useState } from "react";
import axios from "../../api/axios";
import "../../styles/applicant-auth.css";

const ApplicantAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    yearsOfExperience: 0,
    educationLevel: "Bachelor",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post("/recruitment/applicants/login", {
          email: formData.email,
        });
        localStorage.setItem("applicantToken", response.data.token);
        localStorage.setItem("applicantId", response.data.applicantId);
        window.location.href = "/recruitment/portal";
      } else {
        await axios.post("/recruitment/applicants", formData);
        alert("Registration successful! Please log in.");
        setIsLogin(true);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          yearsOfExperience: 0,
          educationLevel: "Bachelor",
        });
      }
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="applicant-auth-container">
      <div className="auth-card">
        <h1>TUC Recruitment Portal</h1>
        <p className="subtitle">Turkana University College</p>

        <div className="auth-toggle">
          <button
            className={isLogin ? "active" : ""}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={!isLogin ? "active" : ""}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <input
                type="number"
                name="yearsOfExperience"
                placeholder="Years of Experience"
                value={formData.yearsOfExperience}
                onChange={handleChange}
                required
              />
              <select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleChange}
              >
                <option value="High School">High School</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="PhD">PhD</option>
              </select>
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required={!isLogin}
          />

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "Loading..." : isLogin ? "Login" : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplicantAuth;
