import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export function RequireAuth() {
  const { token, ready } = useAuth();
  const loc = useLocation();

  if (!ready) {
    return (
      <div className="page-center muted" role="status">
        Loading…
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  return <Outlet />;
}
