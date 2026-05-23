import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as backend from '../api/backend';
import { useAuth } from '../auth/useAuth';
import { useStuffLabel } from '../hooks/useStuffLabel';
import { fileToCompressedDataUrl } from '../utils/imageUpload';

export function HomePage() {
  const { user } = useAuth();
  const { tabLabel: stuffTabLabel, nickname } = useStuffLabel();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [draft, setDraft] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);

  const feedQ = useQuery({
    queryKey: ['feed'],
    queryFn: () => backend.getFeed(),
    refetchOnWindowFocus: true,
  });

  const vq = useQuery({
    queryKey: ['verification'],
    queryFn: () => backend.getVerification(),
    refetchInterval: 30000,
  });

  const tagsQ = useQuery({
    queryKey: ['tags'],
    queryFn: () => backend.getTags(),
    refetchInterval: 15000,
  });

  const faceQ = useQuery({
    queryKey: ['face-enrollment'],
    queryFn: () => backend.getFaceEnrollment(),
  });

  const createPost = useMutation({
    mutationFn: () =>
      backend.createFeedPost({
        body: draft.trim(),
        image_data_url: imageDataUrl ?? undefined,
      }),
    onSuccess: () => {
      setDraft('');
      setImagePreview(null);
      setImageDataUrl(null);
      setPostError(null);
      void qc.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (err) => {
      setPostError(err instanceof Error ? err.message : 'Could not post');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    createPost.mutate();
  }

  async function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file?.type.startsWith('image/')) {
      setPostError('Please choose an image file.');
      return;
    }
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 960, 0.8);
      setImageDataUrl(dataUrl);
      setImagePreview(dataUrl);
      setPostError(null);
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Could not read image.');
    }
  }

  const primaryTag = tagsQ.data?.[0];
  const showGettingStarted =
    !vq.data?.all_complete ||
    !primaryTag ||
    primaryTag.status === 'unassigned';

  const posts = feedQ.data?.items ?? [];

  return (
    <div className="page page--padded page--feed">
      <header className="page-header page-header--compact">
        <h1 className="page-title">Feed</h1>
        <p className="muted page-lead">
          Share what you did with your stuff{nickname ? ` — ${nickname} can reply` : ''}.
        </p>
      </header>

      {showGettingStarted ? (
        <section className="card card--info feed-banner">
          <p className="fineprint">
            Finish setup to unlock AI replies —{' '}
            <Link to="/profile">Profile</Link>, <Link to="/companion">{stuffTabLabel}</Link>
            {!faceQ.data || faceQ.data.status !== 'enrolled' ? (
              <>
                , <Link to="/face">Face & kiosk</Link>
              </>
            ) : null}
            .
          </p>
        </section>
      ) : null}

      <form className="card card--elevated feed-composer" onSubmit={onSubmit}>
        <label className="field">
          <span className="sr-only">Post</span>
          <textarea
            className="input input--textarea feed-composer__input"
            rows={3}
            placeholder={
              nickname
                ? `What did you do with ${nickname} today?`
                : 'What did you do with your stuff today?'
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
          />
        </label>
        {imagePreview ? (
          <figure className="feed-composer__preview">
            <img src={imagePreview} alt="" />
            <button
              type="button"
              className="feed-composer__remove-img"
              onClick={() => {
                setImagePreview(null);
                setImageDataUrl(null);
              }}
            >
              Remove photo
            </button>
          </figure>
        ) : null}
        <div className="feed-composer__actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => fileRef.current?.click()}
          >
            Photo
          </button>
          <button
            type="submit"
            className="btn btn--primary btn--sm"
            disabled={!draft.trim() || createPost.isPending}
          >
            {createPost.isPending ? 'Posting…' : 'Post'}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void onPickImage(e)}
        />
        {postError ? (
          <p className="banner banner--error" role="alert">
            {postError}
          </p>
        ) : null}
      </form>

      <section className="feed-list" aria-label="Your posts">
        {feedQ.isLoading ? (
          <p className="muted fineprint">Loading feed…</p>
        ) : !posts.length ? (
          <p className="muted fineprint card card--elevated feed-empty">
            No posts yet. Share an oil change, wash day, or ride —{' '}
            {nickname ? `${nickname} may reply` : 'your stuff can reply once verified'}.
          </p>
        ) : (
          posts.map((post) => (
            <article key={post.post_id} className="card card--elevated feed-item">
              <header className="feed-item__head">
                <span className="feed-item__author">{user?.display_name || 'You'}</span>
                <time className="muted fineprint">
                  {new Date(post.created_at).toLocaleString()}
                </time>
              </header>
              <p className="feed-item__body">{post.body}</p>
              {post.image_data_url ? (
                <img src={post.image_data_url} alt="" className="feed-item__img" />
              ) : null}
              {post.reply ? (
                <div className="feed-item__reply">
                  <p className="feed-item__reply-from">{post.reply.from_name}</p>
                  <p className="companion-list__body">{post.reply.body}</p>
                  <time className="muted fineprint">
                    {new Date(post.reply.created_at).toLocaleString()}
                  </time>
                </div>
              ) : (
                <p className="muted fineprint">Waiting for a reply…</p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
