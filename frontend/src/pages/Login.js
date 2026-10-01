import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useChat } from '../context/ChatContext';
import { IconLogo, IconEye, IconEyeOff, IconShield } from '../components/Icons';
import LegalModals from '../components/LegalModals';
import AuthShowcase from '../components/AuthShowcase';
import '../styles/auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [legalModalTab, setLegalModalTab] = useState(null); // 'privacy' | 'terms' | null

  const navigate = useNavigate();
  const { login } = useChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(email.trim(), password);
      const responseData = response.data.data || response.data;
      const { token, user } = responseData;

      if (!token || !user) {
        setError('Invalid credentials response from server.');
        return;
      }

      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Unable to sign in. Please verify your email and password.';
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

        {/* Right Side: Sign In Card */}
        <div className="auth-right-pane">
          <div className="auth-card-wrapper">
            <div className="auth-brand-center">
              <div className="auth-logo-badge">
                <IconLogo size={28} className="auth-logo-svg" />
              </div>
              <h1>Sign In to Aura</h1>
              <p>Real-time team collaboration and private messaging</p>
            </div>

        {error && (
          <div className="auth-alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form-card">
          <div className="form-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="login-password">Password</label>
            </div>
            <div className="password-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
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

          <button
            type="submit"
            className="btn btn-primary btn-large auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner-wrap">
                <span className="btn-spinner" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Security Badge */}
        <div className="auth-security-notice">
          <IconShield size={13} />
          <span>Encrypted session • TLS 1.3 Transport Security</span>
        </div>

        <div className="auth-footer-nav">
          <p>
            Don&rsquo;t have an account?{' '}
            <Link to="/register" className="auth-switch-link">
              Create account
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
