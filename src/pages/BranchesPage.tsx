import { useQuery } from '@tanstack/react-query';
import { SupportChat } from '../components/SupportChat';
import * as backend from '../api/backend';

export function BranchesPage() {
  const q = useQuery({
    queryKey: ['branches'],
    queryFn: () => backend.getBranches(),
  });

  return (
    <div className="page page--padded">
      <h1 className="page-title">Branches</h1>
      <p className="muted page-lead">Locations, hours, and support chat with branch admin.</p>
      {q.isLoading ? (
        <p className="muted">Loading…</p>
      ) : q.isError ? (
        <p className="banner banner--error">Could not load branches.</p>
      ) : !q.data?.length ? (
        <p className="muted">No branches published yet.</p>
      ) : (
        <ul className="card-list">
          {q.data.map((b) => (
            <li key={b.branch_id} className="card card--tight">
              <h2 className="card-title" style={{ fontSize: '1.05rem' }}>
                {b.name}
              </h2>
              {b.address ? <p className="fineprint">{b.address}</p> : null}
              {b.hours ? (
                <p className="muted fineprint">
                  <strong>Hours:</strong> {b.hours}
                </p>
              ) : null}
              <SupportChat branchId={b.branch_id} branchName={b.name} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
