import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  FaUniversity,
  FaUser,
  FaTicketAlt,
  FaBell,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaSpinner,
  FaTimesCircle,
  FaUserCog,
} from 'react-icons/fa';
import { registerUser } from '../../redux/slices/authSlice';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'student',
    department: '',
    password: '',
    confirmPassword: '',
  });

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const passwordStrength = useMemo(() => {
    const pwd = formData.password || '';
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    const level = score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';
    return { score, level };
  }, [formData.password]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setStatus({ type: 'error', message: 'Password and confirm password do not match.' });
      return;
    }

    try {
      setIsLoading(true);
      await dispatch(
        registerUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          department: formData.department.trim(),
          password: formData.password,
        })
      ).unwrap();
      setStatus({ type: 'success', message: 'Account created successfully. Redirecting...' });
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      const message = typeof error === 'string' ? error : error?.message || 'Registration failed. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell-register">
        <aside className="auth-branding auth-branding-register">
          <div className="auth-branding-content">
            <div className="auth-logo">
              <FaUniversity />
            </div>
            <h2 className="auth-brand-title">Turkana University College</h2>
            <p className="auth-brand-system">ICT Help Desk System</p>
            <div className="auth-brand-divider" />
            <ul className="auth-feature-list">
              <li>
                <FaUser />
                <span>Create your institutional account</span>
              </li>
              <li>
                <FaTicketAlt />
                <span>Submit ICT support requests instantly</span>
              </li>
              <li>
                <FaBell />
                <span>Get real time updates on your tickets</span>
              </li>
            </ul>
          </div>
          <div className="auth-brand-bottom">
            <p className="auth-brand-login-link">
              Already registered? <Link to="/login">Sign in to your account</Link>
            </p>
            <p className="auth-brand-footer">Powered by TUC ICT Department</p>
          </div>
        </aside>

        <section className="auth-card auth-form-panel auth-form-panel-register">
          <div className="auth-card-accent" />
          <p className="auth-welcome">Get Started</p>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Fill in your details to request access to the system</p>

          {status.type === 'error' && status.message ? (
            <div className="alert alert-error auth-alert">
              <div className="auth-alert-left">
                <FaTimesCircle />
                <span>{status.message}</span>
              </div>
              <button
                type="button"
                className="auth-alert-close"
                onClick={() => setStatus({ type: '', message: '' })}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          ) : null}

          {status.type === 'success' && status.message ? (
            <div className="alert alert-success auth-alert auth-alert-success">
              <span>{status.message}</span>
            </div>
          ) : null}

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="auth-section-divider">
              <span><FaUser /> Personal Information</span>
            </div>

            <div className="form-group">
              <div className="input-icon-wrap">
                <span className="input-icon"><FaUser /></span>
                <input
                  className="form-control"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  placeholder="Full Name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon-wrap">
                <span className="input-icon"><FaEnvelope /></span>
                <input
                  className="form-control"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={onChange}
                  placeholder="Email Address"
                  autoComplete="email"
                  required
                />
              </div>
              <p className="auth-field-hint">Use your institutional email e.g. you@tuc.ac.ke</p>
            </div>

            <div className="form-group">
              <div className="input-icon-wrap">
                <span className="input-icon"><FaPhone /></span>
                <input
                  className="form-control"
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={onChange}
                  placeholder="Phone Number"
                />
              </div>
            </div>

            <div className="auth-section-divider">
              <span><FaUserCog /> Account Details</span>
            </div>

            <div className="form-group">
              <div className="input-icon-wrap">
                <span className="input-icon"><FaBriefcase /></span>
                <select
                  className="form-control"
                  name="role"
                  value={formData.role}
                  onChange={onChange}
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon-wrap">
                <span className="input-icon"><FaBriefcase /></span>
                <input
                  className="form-control"
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={onChange}
                  placeholder="e.g. Computer Science, ICT, Finance"
                />
              </div>
            </div>

            <div className="auth-password-row">
              <div className="form-group">
                <div className="input-icon-wrap">
                  <span className="input-icon"><FaLock /></span>
                  <input
                    className="form-control"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={onChange}
                    placeholder="Password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-right auth-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                <div className="auth-strength">
                  <div className="auth-strength-bars">
                    {[1, 2, 3, 4].map((step) => (
                      <span
                        key={step}
                        className={`auth-strength-segment ${passwordStrength.score >= step ? `on ${passwordStrength.level.toLowerCase()}` : ''}`}
                      />
                    ))}
                  </div>
                  <span className="auth-strength-label">{passwordStrength.level}</span>
                </div>
              </div>

              <div className="form-group">
                <div className="input-icon-wrap">
                  <span className="input-icon"><FaLock /></span>
                  <input
                    className="form-control"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={onChange}
                    placeholder="Confirm Password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-right auth-toggle-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block btn-lg auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <FaSpinner className="spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <FaArrowRight />
                </>
              )}
            </button>

            <p className="auth-terms-note">
              By creating an account you agree to the TUC ICT acceptable use policy
            </p>
          </form>

          <p className="auth-footer auth-footer-centered">
            Already have an account? <Link to="/login">Sign in here</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Register;