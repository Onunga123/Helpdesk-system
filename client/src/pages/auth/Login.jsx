import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  FaUniversity,
  FaTicketAlt,
  FaShieldAlt,
  FaChartLine,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaTimesCircle,
  FaArrowRight,
  FaSpinner,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { loginUser } from '../../redux/slices/authSlice';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!formData.email || !formData.password) {
      setStatus({ type: 'error', message: 'Please enter both email and password.' });
      return;
    }

    try {
      setIsLoading(true);
      await dispatch(loginUser(formData)).unwrap();
      setStatus({ type: 'success', message: 'Login successful. Redirecting...' });
      navigate('/dashboard');
    } catch (error) {
      const message = typeof error === 'string' ? error : error?.message || 'Login failed. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-branding">
          <div className="auth-branding-content">
            <div className="auth-logo">
              <FaUniversity />
            </div>
            <h2 className="auth-brand-title">Turkana University College</h2>
            <p className="auth-brand-system">ICT Help Desk System</p>
            <div className="auth-brand-divider" />
            <ul className="auth-feature-list">
              <li>
                <FaTicketAlt />
                <span>Submit and track ICT support requests</span>
              </li>
              <li>
                <FaShieldAlt />
                <span>Secure role-based access control</span>
              </li>
              <li>
                <FaChartLine />
                <span>Real-time analytics and reporting</span>
              </li>
            </ul>
          </div>
          <p className="auth-brand-footer">Powered by TUC ICT Department</p>
        </aside>

        <section className="auth-card auth-form-panel">
          <div className="auth-card-accent" />
          <p className="auth-welcome">Welcome Back</p>
          <h1 className="auth-title">Sign in to your account</h1>
          <p className="auth-subtitle">Enter your credentials to access the system</p>

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

          <form className="auth-form" onSubmit={onSubmit}>
            <div className="form-group">
              <div className="input-icon-wrap">
                <span className="input-icon">
                  <FaEnvelope />
                </span>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={onChange}
                  placeholder="Email address"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="input-icon-wrap">
                <span className="input-icon">
                  <FaLock />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  value={formData.password}
                  onChange={onChange}
                  placeholder="Password"
                  autoComplete="current-password"
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
            </div>

            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => toast('Contact your administrator to reset your password')}
            >
              Forgot Password?
            </button>

            <button type="submit" className="btn btn-primary btn-block btn-lg auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <FaSpinner className="spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <FaArrowRight />
                </>
              )}
            </button>
          </form>

          <div className="divider auth-divider">
            <span>or</span>
          </div>

          <p className="auth-footer auth-footer-centered">
            Don&apos;t have an account? <Link to="/register">Register here</Link>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Login;