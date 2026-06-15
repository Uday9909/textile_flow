// ============================================================
// TextileFlow MES — Forgot Password Page
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      await forgotPassword(email);
      setStatus('success');
      setMessage('If an account with that email exists, a reset link has been sent.');
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
          <p className="login-subtitle">Forgot Password</p>
        </div>

        {status === 'success' ? (
          <div className="login-form">
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              textAlign: 'center',
              lineHeight: 1.6,
            }}>
              {message}
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
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoFocus
              />
            </div>

            {status === 'error' && (
              <div className="login-error">{message}</div>
            )}

            <button
              type="submit"
              className="login-btn"
              disabled={status === 'loading'}
            >
              <Mail size={18} />
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
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
