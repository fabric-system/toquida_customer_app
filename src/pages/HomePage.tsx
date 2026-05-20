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
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const tagsQ = useQuery({
    queryKey: ['tags'],
    queryFn: () => backend.getTags(),
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
  });

  const vq = useQuery({
    queryKey: ['verification'],
    queryFn: () => backend.getVerification(),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const companionQ = useQuery({
    queryKey: ['companion-messages'],
    queryFn: () => backend.getCompanionMessages(),
    enabled: Boolean(vq.data?.all_complete),
    refetchInterval: 60000,
  });

  const faceQ = useQuery({
    queryKey: ['face-enrollment'],
    queryFn: () => backend.getFaceEnrollment(),
  });

  const verifyProgress = vq.data?.progress;
  const verifyPct =
    verifyProgress && verifyProgress.total > 0
      ? Math.round((verifyProgress.completed / verifyProgress.total) * 100)
      : 0;
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
              As of{' '}
              {balanceQ.dataUpdatedAt
                ? new Date(balanceQ.dataUpdatedAt).toLocaleString()
                : '—'}
              {balanceQ.data?.stale ? ' · balance may be stale' : ''}
            </p>
          </>
        )}
      </section>

      <section className="card">
        <h2 className="card-title">Account</h2>
        <dl className="kv">
          <div>
            <dt>Verification</dt>
            <dd>
              {verificationLabel(vq.data?.status ?? user?.verification_status)}
              {verifyProgress ? ` · ${verifyProgress.completed}/${verifyProgress.total}` : ''}
            </dd>
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
        {!vq.data?.all_complete ? (
          <>
            <div className="verify-progress" aria-hidden>
              <div className="verify-progress__bar" style={{ width: `${verifyPct}%` }} />
            </div>
            <p className="muted fineprint">{vq.data?.message ?? 'Complete your profile steps.'}</p>
          </>
        ) : null}
        <div className="row-links">
          <Link to="/profile">Profile & verification</Link>
          <Link to="/face">Face & kiosk code</Link>
          <Link to="/tags">Tag details</Link>
        </div>
      </section>

      {companionQ.data?.[0] ? (
        <section className="card companion-card">
          <h2 className="card-title">From {companionQ.data[0].from_name}</h2>
          <p>{companionQ.data[0].body}</p>
          <Link to="/profile">See all messages</Link>
        </section>
      ) : null}

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
