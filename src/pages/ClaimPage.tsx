import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { ClaimAction } from '../api/types';
import * as backend from '../api/backend';

export function ClaimPage() {
  const qc = useQueryClient();
  const [action, setAction] = useState<ClaimAction>('link_tag');
  const [last, setLast] = useState<Awaited<ReturnType<typeof backend.createClaimCode>> | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: () => backend.createClaimCode({ action }),
    onSuccess: (data) => {
      setLast(data);
      void qc.invalidateQueries({ queryKey: ['tags'] });
    },
  });

  return (
    <div className="page page--padded">
      <h1 className="page-title">Kiosk claim code</h1>
      <p className="muted page-lead">
        Generate a one-time code to enter or scan at the site kiosk. The kiosk and backend complete
        tag linking — this app never controls hardware.
      </p>

      <fieldset className="segmented">
        <legend className="sr-only">Claim type</legend>
        <label className="segment">
          <input
            type="radio"
            name="action"
            checked={action === 'link_tag'}
            onChange={() => setAction('link_tag')}
          />
          Link tag
        </label>
        <label className="segment">
          <input
            type="radio"
            name="action"
            checked={action === 'dispense_tag'}
            onChange={() => setAction('dispense_tag')}
          />
          Dispense tag
        </label>
      </fieldset>

      <button
        type="button"
        className="btn btn--primary"
        disabled={mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? 'Generating…' : 'Generate code'}
      </button>

      {mutation.isError ? (
        <p className="banner banner--error" role="alert">
          {mutation.error instanceof Error ? mutation.error.message : 'Failed to generate code'}
        </p>
      ) : null}

      {last ? (
        <section className="card claim-result" aria-live="polite">
          <p className="muted fineprint">Present at kiosk before expiry.</p>
          <p className="claim-code" translate="no">
            {last.display_code}
          </p>
          <dl className="kv fineprint">
            <div>
              <dt>Action</dt>
              <dd>{last.action}</dd>
            </div>
            <div>
              <dt>Expires</dt>
              <dd>{new Date(last.expires_at).toLocaleString()}</dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
