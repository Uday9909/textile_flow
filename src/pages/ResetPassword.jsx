// ============================================================
// TextileFlow MES — Reset Password Page
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle } from 'lucide-react';
import { resetPassword } from '../api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Auto-redirect to login after successful reset
  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => navigate('/login'), 3000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const validate = () => {
    const errors = {};

    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!validate()) {
      return;
    }

    setStatus('loading');

    try {
      await resetPassword(token, password);
      setStatus('success');
      setMessage('Your password has been reset successfully.');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>TextileFlow MES</h1>
          <p className="login-subtitle">Set New Password</p>
        </div>

        {status === 'success' ? (
          <div className="login-form">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
              <CheckCircle
                size={48}
                style={{ color: 'var(--priority-low)' }}
              />
            </div>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              textAlign: 'center',
              lineHeight: 1.6,
            }}>
              {message}
            </p>
            <p style={{
              color: 'var(--text-tertiary)',
              fontSize: 'var(--font-size-sm)',
              textAlign: 'center',
              marginTop: 'var(--space-2)',
            }}>
              Redirecting to login...
            </p>
            <Link
              to="/login"
              className="login-btn"
              style={{
                textDecoration: 'none',
                marginTop: 'var(--space-2)',
              }}
            >
              <ArrowLeft size={18} />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (validationErrors.password) {
                    setValidationErrors((prev) => ({ ...prev, password: '' }));
                  }
                }}
                placeholder="At least 8 characters"
                required
                autoFocus
              />
              {validationErrors.password && (
                <span style={{
                  color: '#ef4444',
                  fontSize: 'var(--font-size-xs)',
                  marginTop: 'var(--space-1)',
                }}>
                  {validationErrors.password}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (validationErrors.confirmPassword) {
                    setValidationErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }
                }}
                placeholder="Re-enter new password"
                required
              />
              {validationErrors.confirmPassword && (
                <span style={{
                  color: '#ef4444',
                  fontSize: 'var(--font-size-xs)',
                  marginTop: 'var(--space-1)',
                }}>
                  {validationErrors.confirmPassword}
                </span>
              )}
            </div>

            {status === 'error' && (
              <div className="login-error">{message}</div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={status === 'loading'}
            >
              <Lock size={18} />
              {status === 'loading' ? 'Resetting...' : 'Reset Password'}
            </button>

            <div style={{
              textAlign: 'center',
              marginTop: 'var(--space-2)',
            }}>
              <Link
                to="/login"
                style={{
                  color: 'var(--accent-primary)',
                  fontSize: 'var(--font-size-sm)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1)',
                }}
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
