import React, { useEffect, useState } from 'react';
import './Login.css';

const SAVED_LOGIN_KEY = 'prepai-login';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    const savedLogin = localStorage.getItem(SAVED_LOGIN_KEY);

    if (!savedLogin) {
      return;
    }

    try {
      const { email: savedEmail, password: savedPassword } = JSON.parse(savedLogin);

      setEmail(savedEmail || '');
      setPassword(savedPassword || '');
      setRememberMe(true);
    } catch {
      localStorage.removeItem(SAVED_LOGIN_KEY);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (rememberMe) {
      localStorage.setItem(SAVED_LOGIN_KEY, JSON.stringify({ email, password }));
    } else {
      localStorage.removeItem(SAVED_LOGIN_KEY);
    }

    onLogin({ email, rememberMe });
  };

  const handleRememberChange = (e) => {
    const shouldRemember = e.target.checked;

    setRememberMe(shouldRemember);

    if (!shouldRemember) {
      localStorage.removeItem(SAVED_LOGIN_KEY);
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
            <h2>Login to your account</h2>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
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

            <button type="submit" className="primary-button">
              Login
            </button>
          </form>

          <p className="signup-copy">
            New here? <button type="button">Create an account</button>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Login;
