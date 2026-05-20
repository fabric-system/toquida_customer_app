import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import * as backend from '../api/backend';

type SupportChatProps = {
  branchId: string;
  branchName: string;
};

export function SupportChat({ branchId, branchName }: SupportChatProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const messagesQ = useQuery({
    queryKey: ['support-messages', branchId],
    queryFn: () => backend.getSupportMessages(branchId),
    enabled: open,
    refetchInterval: open ? 8000 : false,
  });

  const sendM = useMutation({
    mutationFn: (body: string) =>
      backend.sendSupportMessage({ branch_id: branchId, body }),
    onSuccess: () => {
      setDraft('');
      void qc.invalidateQueries({ queryKey: ['support-messages', branchId] });
    },
  });

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messagesQ.data, open]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sendM.isPending) return;
    sendM.mutate(text);
  }

  return (
    <div className="support-chat">
      <button
        type="button"
        className="btn btn--secondary btn--compact"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide chat' : 'Chat with admin'}
      </button>

      {open ? (
        <section className="support-chat__panel card card--tight">
          <h3 className="support-chat__title">Support chat · {branchName}</h3>
          <p className="muted fineprint">
            Send a message to the branch admin. Replies appear here when available.
          </p>

          <div ref={scrollRef} className="support-chat__messages" aria-live="polite">
            {messagesQ.isLoading ? (
              <p className="muted fineprint">Loading messages…</p>
            ) : !messagesQ.data?.length ? (
              <p className="muted fineprint">No messages yet. Say hi and we will get back to you.</p>
            ) : (
              messagesQ.data.map((msg) => (
                <div
                  key={msg.message_id}
                  className={`support-chat__bubble support-chat__bubble--${msg.direction}`}
                >
                  <p>{msg.body}</p>
                  <time className="support-chat__time">
                    {new Date(msg.created_at).toLocaleString()}
                  </time>
                </div>
              ))
            )}
          </div>

          <form className="support-chat__composer" onSubmit={onSubmit}>
            <input
              className="input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type your message…"
              maxLength={2000}
              disabled={sendM.isPending}
            />
            <button
              type="submit"
              className="btn btn--primary btn--compact"
              disabled={!draft.trim() || sendM.isPending}
            >
              {sendM.isPending ? 'Sending…' : 'Send'}
            </button>
          </form>

          {sendM.isError ? (
            <p className="banner banner--error">
              {sendM.error instanceof Error ? sendM.error.message : 'Could not send message'}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
