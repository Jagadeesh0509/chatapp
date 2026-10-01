import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useChat } from '../context/ChatContext';
import { IconLogo, IconEye, IconEyeOff, IconShield } from '../components/Icons';
import LegalModals from '../components/LegalModals';
import AuthShowcase from '../components/AuthShowcase';
import '../styles/auth.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [legalModalTab, setLegalModalTab] = useState(null);

  const navigate = useNavigate();
  const { login } = useChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(
        username.trim(),
        email.trim(),
        password
      );
      const responseData = response.data.data || response.data;
      const { token, user } = responseData;

      if (!token || !user) {
        setError('Invalid registration response from server');
        return;
      }

      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.data?.errors) {
        if (Array.isArray(err.response.data.errors)) {
          errorMessage =
            err.response.data.errors[0]?.msg ||
            err.response.data.errors[0]?.message ||
            errorMessage;
        } else if (typeof err.response.data.errors === 'object') {
          const firstError = Object.values(err.response.data.errors)[0];
          errorMessage = firstError || errorMessage;
        }
      } else {
        errorMessage =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          errorMessage;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-viewport">
      <div className="auth-split-layout">
        {/* Left Side: Brand Showcase & Animations */}
        <div className="auth-left-pane">
          <AuthShowcase />
        </div>

        {/* Right Side: Register Card */}
        <div className="auth-right-pane">
          <div className="auth-card-wrapper">
            <div className="auth-brand-center">
              <div className="auth-logo-badge">
                <IconLogo size={28} className="auth-logo-svg" />
              </div>
              <h1>Create Aura Account</h1>
              <p>Join your workspace and start real-time messaging</p>
            </div>

        {error && (
          <div className="auth-alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-card">
          <div className="form-group">
            <label htmlFor="reg-username">Username</label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_chen"
              minLength="3"
              maxLength="20"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Work Email</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <div className="password-input-wrap">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                minLength="6"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm-password">Confirm Password</label>
            <input
              id="reg-confirm-password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              minLength="6"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner-wrap">
                <span className="btn-spinner" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-security-notice">
          <IconShield size={13} />
          <span>Encrypted passwords with salted bcrypt hashes</span>
        </div>

        <div className="auth-footer-nav">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">
              Sign in here
            </Link>
          </p>

          <div className="auth-legal-row">
            <button
              type="button"
              className="legal-inline-btn"
              onClick={() => setLegalModalTab('privacy')}
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              type="button"
              className="legal-inline-btn"
              onClick={() => setLegalModalTab('terms')}
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  {legalModalTab && (
    <LegalModals
      initialTab={legalModalTab}
      onClose={() => setLegalModalTab(null)}
    />
  )}
</div>
  );
}
