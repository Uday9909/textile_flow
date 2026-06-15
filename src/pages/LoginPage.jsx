// ============================================================
// TextileFlow MES — Login Page
// ============================================================

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login, status, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect to main app when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/', { replace: true });
    }
  }, [status, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>TextileFlow MES</h1>
          <p className="login-subtitle">Manufacturing Execution System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="login-btn"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              'Signing in...'
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>

          <div style={{
            textAlign: 'center',
            marginTop: 'var(--space-4)',
          }}>
            <Link
              to="/forgot-password"
              style={{
                color: 'var(--accent-primary)',
                fontSize: 'var(--font-size-sm)',
                textDecoration: 'none',
              }}
            >
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
