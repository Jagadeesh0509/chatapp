import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useChat } from '../context/ChatContext';
import '../styles/auth.css';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useChat();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.register(username, email, password);
      // Handle both old format and new format with standardized response
      const responseData = response.data.data || response.data;
      const { token, user } = responseData;
      
      if (!token || !user) {
        setError('Invalid response from server');
        console.error('Invalid response structure:', response.data);
        return;
      }
      
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      // Handle field-level validation errors and standard errors
      let errorMessage = 'Registration failed';
      
      if (err.response?.data?.errors) {
        // If it's an array of validation errors
        if (Array.isArray(err.response.data.errors)) {
          errorMessage = err.response.data.errors[0]?.msg || err.response.data.errors[0]?.message || errorMessage;
        } else if (typeof err.response.data.errors === 'object') {
          // If it's an object with field-level errors
          const firstError = Object.values(err.response.data.errors)[0];
          errorMessage = firstError || errorMessage;
        }
      } else {
        errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || errorMessage;
      }
      
      setError(errorMessage);
      console.error('Registration error details:', {
        status: err.response?.status,
        message: errorMessage,
        response: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Create Account</h1>
          <p>Join our chat community</p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              minLength="3"
              maxLength="20"
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              minLength="6"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              minLength="6"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
}
