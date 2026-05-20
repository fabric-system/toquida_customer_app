import { useQuery } from '@tanstack/react-query';
import * as backend from '../api/backend';

export function TransactionsPage() {
  const q = useQuery({
    queryKey: ['transactions'],
    queryFn: () => backend.getTransactions(),
  });

  return (
    <div className="page page--padded">
      <h1 className="page-title">Activity</h1>
      <p className="muted page-lead">Recent balance changes from the backend ledger (not raw kiosk logs).</p>
      {q.isLoading ? (
        <p className="muted">Loading…</p>
      ) : q.isError ? (
        <p className="banner banner--error">Could not load history.</p>
      ) : !q.data?.length ? (
        <p className="muted">No transactions yet.</p>
      ) : (
        <ul className="tx-list">
          {q.data.map((t) => (
            <li key={t.transaction_id} className="tx-item">
              <div>
                <span className="tx-summary">{t.summary ?? t.type}</span>
                <span className="muted fineprint">
                  {new Date(t.created_at).toLocaleString()}
                </span>
              </div>
              <span className={t.amount < 0 ? 'tx-amount tx-amount--neg' : 'tx-amount'}>
                {t.amount > 0 ? '+' : ''}
                {t.unit} {t.amount.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
