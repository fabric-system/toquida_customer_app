import { type FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function LoginPage() {
  const { token, ready, login, busy, error, clearError } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const nav = useNavigate();
  const loc = useLocation();
  const from = (loc.state as { from?: string } | null)?.from ?? '/home';

  if (ready && token) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login(loginId.trim(), password);
      nav(from, { replace: true });
    } catch {
      /* error state */
    }
  }

  return (
    <div className="page page--padded">
      <h1 className="page-title">Sign in</h1>
      <p className="muted page-lead">
        Use your mobile number or email with your password.
      </p>
      <form className="stack gap-md" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Mobile number or email</span>
          <input
            className="input"
            type="text"
            autoComplete="username"
            required
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            placeholder="09XX XXX XXXX or you@example.com"
          />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? (
          <p className="banner banner--error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: '1.25rem' }}>
        No account? <Link to="/register">Create one</Link>
      </p>
    </div>
  );
}
