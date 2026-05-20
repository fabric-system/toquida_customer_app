import { type FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { appName } from '../config';

export function RegisterPage() {
  const { token, ready, register, busy, error, clearError } = useAuth();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const nav = useNavigate();

  if (ready && token) return <Navigate to="/home" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await register(
        phone.trim(),
        password,
        displayName.trim(),
        acceptTerms,
        email.trim() || undefined,
      );
      nav('/home', { replace: true });
    } catch {
      /* error state */
    }
  }

  return (
    <div className="page page--padded">
      <h1 className="page-title">Create account</h1>
      <p className="muted page-lead">
        Sign up with your name and mobile number. Email is optional. Top-up and RFID linking happen
        at the carwash kiosk — not in this app yet.
      </p>
      <form className="stack gap-md" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">Your name</span>
          <input
            className="input"
            type="text"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How we greet you in the app"
          />
        </label>
        <label className="field">
          <span className="field-label">Mobile number</span>
          <input
            className="input"
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09XX XXX XXXX"
          />
        </label>
        <label className="field">
          <span className="field-label">
            Email <span className="muted">(optional)</span>
          </span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label className="field">
          <span className="field-label">Password</span>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="muted fineprint">At least 8 characters.</span>
        </label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            required
          />
          <span className="fineprint">
            I agree to the terms of use and privacy notice for {appName} carwash accounts.
          </span>
        </label>
        {error ? (
          <p className="banner banner--error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn--primary" disabled={busy || !acceptTerms}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: '1.25rem' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}
