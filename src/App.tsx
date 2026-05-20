import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import { AppShell } from './layout/AppShell';
import { BranchesPage } from './pages/BranchesPage';
import { FaceEnrollmentPage } from './pages/FaceEnrollmentPage';
import { HelpPage } from './pages/HelpPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { TagsPage } from './pages/TagsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { WelcomePage } from './pages/WelcomePage';
import { RequireAuth } from './routes/RequireAuth';

function RootRedirect() {
  const { token, ready } = useAuth();
  if (!ready) {
    return (
      <div className="page-center muted" role="status">
        Loading…
      </div>
    );
  }
  return <Navigate to={token ? '/home' : '/welcome'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/face" element={<FaceEnrollmentPage />} />
          <Route path="/claim" element={<Navigate to="/face" replace />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/branches" element={<BranchesPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
