import { Link, Navigate } from 'react-router-dom';
import { appName } from '../config';
import { useAuth } from '../auth/useAuth';

export function WelcomePage() {
  const { token, ready } = useAuth();
  if (!ready) {
    return (
      <div className="page-center muted" role="status">
        Loading…
      </div>
    );
  }
  if (token) return <Navigate to="/home" replace />;
  return (
    <div className="page page--padded">
      <div className="hero-block">
        <h1 className="hero-title">{appName}</h1>
        <p className="hero-sub">
          Create your account here. Add credits and link your RFID tag at the carwash kiosk when
          you visit — top-up in the app is coming later.
        </p>
      </div>
      <div className="stack gap-md">
        <Link className="btn btn--primary" to="/login">
          Sign in
        </Link>
        <Link className="btn btn--secondary" to="/register">
          Create account
        </Link>
      </div>
    </div>
  );
}
