import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import * as backend from '../api/backend';
import { useAuth } from '../auth/useAuth';
import { verificationLabel } from '../ui/format';

export function HomePage() {
  const { user } = useAuth();

  const balanceQ = useQuery({
    queryKey: ['balance'],
    queryFn: () => backend.getBalance(),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const tagsQ = useQuery({
    queryKey: ['tags'],
    queryFn: () => backend.getTags(),
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
  });

  const faceQ = useQuery({
    queryKey: ['face-enrollment'],
    queryFn: () => backend.getFaceEnrollment(),
  });

  const primaryTag = tagsQ.data?.[0];
  const balance = balanceQ.data?.balance ?? null;
  const showGettingStarted =
    balanceQ.isSuccess && balance === 0 && (!primaryTag || primaryTag.status === 'unassigned');

  return (
    <div className="page page--padded">
      <p className="muted greeting">Hello{user?.display_name ? `, ${user.display_name}` : ''}</p>
      {showGettingStarted ? (
        <section className="card card--info">
          <h2 className="card-title">Getting started</h2>
          <p className="fineprint">
            Your account is ready. Enroll your face in the app — you will get a claim code to use at
            the kiosk when you are ready to link your tag. Add credits at the{' '}
            <strong>carwash kiosk</strong> (coin/top-up).
          </p>
          <div className="row-links">
            <Link to="/face">{faceQ.data?.status === 'enrolled' ? 'Face & code' : 'Enroll face'}</Link>
            <Link to="/branches">Find a branch</Link>
          </div>
        </section>
      ) : null}
      <section className="card">
        <h2 className="card-title">Balance</h2>
        {balanceQ.isLoading ? (
          <p className="muted">Loading balance…</p>
        ) : balanceQ.isError ? (
          <p className="banner banner--error">Could not load balance.</p>
        ) : (
          <>
            <p className="balance-amount">
              {balanceQ.data?.unit} {balanceQ.data?.balance?.toLocaleString()}
            </p>
            <p className="muted fineprint">
              As of {balanceQ.data?.as_of ? new Date(balanceQ.data.as_of).toLocaleString() : '—'}
              {balanceQ.data?.stale ? ' · may be stale' : ''}
            </p>
          </>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Account</h2>
        <dl className="kv">
          <div>
            <dt>Verification</dt>
            <dd>{verificationLabel(user?.verification_status)}</dd>
          </div>
          <div>
            <dt>Tag</dt>
            <dd>
              {tagsQ.isLoading
                ? 'Loading…'
                : primaryTag
                  ? `${primaryTag.status}${primaryTag.label ? ` · ${primaryTag.label}` : ''}`
                  : 'No tag linked yet'}
            </dd>
          </div>
        </dl>
        <div className="row-links">
          <Link to="/face">Face & kiosk code</Link>
          <Link to="/tags">Tag details</Link>
        </div>
      </section>

      <section className="card">
        <h2 className="card-title">Shortcuts</h2>
        <ul className="link-list">
          <li>
            <Link to="/transactions">Transaction history</Link>
          </li>
          <li>
            <Link to="/branches">Branches</Link>
          </li>
          <li>
            <Link to="/help">Help</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
