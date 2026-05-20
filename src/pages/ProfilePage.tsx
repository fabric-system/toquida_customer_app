import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import * as backend from '../api/backend';
import { useAuth } from '../auth/useAuth';
import { verificationLabel } from '../ui/format';

export function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState(user?.display_name ?? '');

  const vq = useQuery({
    queryKey: ['verification'],
    queryFn: () => backend.getVerification(),
  });

  const save = useMutation({
    mutationFn: () => backend.patchMe({ display_name: name.trim() || null }),
    onSuccess: async (me) => {
      setName(me.display_name ?? '');
      await refreshMe();
      void qc.invalidateQueries({ queryKey: ['me'] });
    },
  });
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <div className="page page--padded">
      <h1 className="page-title">Profile</h1>
      <form
        key={user?.user_id ?? 'profile'}
        className="stack gap-md"
        onSubmit={onSubmit}
      >
        <label className="field">
          <span className="field-label">Display name</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
        <button type="submit" className="btn btn--secondary" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
        {save.isError ? (
          <p className="banner banner--error" role="alert">
            {save.error instanceof Error ? save.error.message : 'Save failed'}
          </p>
        ) : null}
        {save.isSuccess ? (
          <p className="banner banner--ok" role="status">
            Saved.
          </p>
        ) : null}
      </form>

      <section className="card" style={{ marginTop: '1.5rem' }}>
        <h2 className="card-title">Verification</h2>
        <p>{verificationLabel(user?.verification_status)}</p>
        {vq.data?.message ? <p className="muted fineprint">{vq.data.message}</p> : null}
      </section>

      <ul className="link-list" style={{ marginTop: '1.5rem' }}>
        <li>
          <Link to="/face">Face enrollment (kiosk)</Link>
        </li>
        <li>
          <Link to="/tags">RFID tags</Link>
        </li>
        <li>
          <Link to="/branches">Branches</Link>
        </li>
        <li>
          <Link to="/help">Help</Link>
        </li>
      </ul>
    </div>
  );
}
