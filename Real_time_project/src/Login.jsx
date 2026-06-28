import React, { useEffect, useState } from 'react';
import './Login.css';

const SAVED_EMAIL_KEY = 'prepai-email'; // ✅ Only email saved, never password
const API_URL = 'http://localhost:5000/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    // ✅ Only restore email, never password
    const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const body = isRegister
        ? { name, email, password }
        : { email, password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
        setLoading(false);
        return;
      }

      // ✅ Store JWT token (not password)
      localStorage.setItem('prepai-token', data.token);

      // ✅ Only save email for remember-me
      if (rememberMe) {
        localStorage.setItem(SAVED_EMAIL_KEY, email);
      } else {
        localStorage.removeItem(SAVED_EMAIL_KEY);
      }

      onLogin({ user: data.user, token: data.token });
    } catch (err) {
      setError('Cannot connect to server. Make sure the backend is running.');
    }

    setLoading(false);
  };

  const handleRememberChange = (e) => {
    const shouldRemember = e.target.checked;
    setRememberMe(shouldRemember);
    if (!shouldRemember) {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }
  };

  return (
    <div className="login-page">
      <section className="login-shell" aria-label="Login">
        <div className="login-panel login-intro">
          <div className="brand-mark">
            <span className="brand-mark-dot"></span>
            PrepAI
          </div>
          <h1>Practice interviews with sharper feedback.</h1>
          <p>
            Sign in to continue your mock interview session, review skill scores,
            and keep your preparation streak moving.
          </p>
          <div className="login-highlights" aria-label="Platform highlights">
            <div>
              <strong>Live</strong>
              <span>timed sessions</span>
            </div>
            <div>
              <strong>AI</strong>
              <span>answer coaching</span>
            </div>
            <div>
              <strong>68%</strong>
              <span>progress saved</span>
            </div>
          </div>
        </div>

        <div className="login-panel login-card">
          <div className="login-card-header">
            <p>Welcome back</p>
            <h2>{isRegister ? 'Create your account' : 'Login to your account'}</h2>
          </div>

          {/* ✅ Error message display */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.4)',
              color: '#EF4444',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* ✅ Name field for register */}
            {isRegister && (
              <label className="field-group" htmlFor="name">
                <span>Full name</span>
                <input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
            )}

            <label className="field-group" htmlFor="email">
              <span>Email address</span>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label className="field-group" htmlFor="password">
              <span>Password</span>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  minLength="6"
                />
                <button
                  type="button"
                  className="ghost-action"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {!isRegister && (
              <div className="form-row">
                <label className="remember-control">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleRememberChange}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="text-button">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading
                ? (isRegister ? 'Creating account...' : 'Logging in...')
                : (isRegister ? 'Create Account' : 'Login')}
            </button>
          </form>

          <p className="signup-copy">
            {isRegister ? 'Already have an account? ' : 'New here? '}
            <button type="button" onClick={() => { setIsRegister(r => !r); setError(''); }}>
              {isRegister ? 'Login' : 'Create an account'}
            </button>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;
