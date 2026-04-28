import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

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
      const response = await API.post('/auth/login', formData);
      const user = response?.data?.data;

      if (!user?.token) {
        setStatus({ type: 'error', message: 'Login response is invalid. Try again.' });
        return;
      }

      localStorage.setItem('user', JSON.stringify(user));
      setStatus({ type: 'success', message: 'Login successful. Redirecting...' });
      navigate('/dashboard');
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Login failed. Please try again.';
      setStatus({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>TUC ICT Help Desk</h1>
        <p>Sign in to continue</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={onChange}
            placeholder="Email"
          />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={onChange}
            placeholder="Password"
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        {status.message ? (
          <p className={status.type === 'error' ? 'auth-message error' : 'auth-message success'}>
            {status.message}
          </p>
        ) : null}
        <p className="auth-footer">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;