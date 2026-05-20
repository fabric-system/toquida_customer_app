import { useQuery } from '@tanstack/react-query';
import * as backend from '../api/backend';

export function TagsPage() {
  const q = useQuery({
    queryKey: ['tags'],
    queryFn: () => backend.getTags(),
  });

  return (
    <div className="page page--padded">
      <h1 className="page-title">RFID tags</h1>
      <p className="muted page-lead">Tag lifecycle is finalized by the kiosk and backend after claim redemption.</p>
      {q.isLoading ? (
        <p className="muted">Loading…</p>
      ) : q.isError ? (
        <p className="banner banner--error">Could not load tags.</p>
      ) : !q.data?.length ? (
        <p className="muted">No tags on this account yet.</p>
      ) : (
        <ul className="card-list">
          {q.data.map((t) => (
            <li key={t.tag_id} className="card card--tight">
              <p className="card-title" style={{ fontSize: '1rem' }}>
                {t.label ?? t.tag_id}
              </p>
              <dl className="kv fineprint">
                <div>
                  <dt>Status</dt>
                  <dd>{t.status}</dd>
                </div>
                {t.linked_at ? (
                  <div>
                    <dt>Linked</dt>
                    <dd>{new Date(t.linked_at).toLocaleString()}</dd>
                  </div>
                ) : null}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
