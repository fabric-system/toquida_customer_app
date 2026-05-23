import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as backend from '../api/backend';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../auth/useAuth';
import { useStuffLabel } from '../hooks/useStuffLabel';
import { formatRelativeTime } from '../ui/format';
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

  const displayName = user?.display_name?.trim() || 'You';

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
    <div className="page page--feed">
      {showGettingStarted ? (
        <section className="feed-banner soc-card">
          <p className="feed-banner__text">
            Finish setup for AI replies —{' '}
            <Link to="/profile">Profile</Link>, <Link to="/companion">{stuffTabLabel}</Link>
            {!faceQ.data || faceQ.data.status !== 'enrolled' ? (
              <>
                , <Link to="/face">Face</Link>
              </>
            ) : null}
          </p>
        </section>
      ) : null}

      <form className="feed-composer soc-card" onSubmit={onSubmit}>
        <div className="feed-composer__row">
          <UserAvatar name={displayName} size="md" />
          <label className="feed-composer__field-wrap">
            <span className="sr-only">Write a post</span>
            <textarea
              className="feed-composer__field"
              rows={2}
              placeholder={
                nickname
                  ? `Share something about ${nickname}…`
                  : 'Share something about your stuff…'
              }
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
            />
          </label>
        </div>

        {imagePreview ? (
          <figure className="feed-composer__preview">
            <img src={imagePreview} alt="" />
            <button
              type="button"
              className="feed-composer__preview-remove"
              aria-label="Remove photo"
              onClick={() => {
                setImagePreview(null);
                setImageDataUrl(null);
              }}
            >
              ×
            </button>
          </figure>
        ) : null}

        <div className="feed-composer__toolbar">
          <button
            type="button"
            className="feed-toolbar-btn"
            onClick={() => fileRef.current?.click()}
          >
            <span className="feed-toolbar-btn__icon feed-toolbar-btn__icon--photo" aria-hidden />
            Photo
          </button>
          <button
            type="submit"
            className="feed-toolbar-btn feed-toolbar-btn--post"
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
          <p className="feed-composer__error" role="alert">
            {postError}
          </p>
        ) : null}
      </form>

      <section className="feed-stream" aria-label="Feed">
        {feedQ.isLoading ? (
          <div className="feed-skeleton soc-card" aria-hidden>
            <div className="feed-skeleton__line feed-skeleton__line--short" />
            <div className="feed-skeleton__line" />
            <div className="feed-skeleton__line feed-skeleton__line--medium" />
          </div>
        ) : !posts.length ? (
          <div className="feed-empty soc-card">
            <p className="feed-empty__title">Your feed is empty</p>
            <p className="feed-empty__text">
              Post a wash, ride, or maintenance update
              {nickname ? ` — ${nickname} can reply` : ''}.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.post_id} className="feed-post soc-card">
              <header className="feed-post__header">
                <UserAvatar name={displayName} size="md" />
                <div className="feed-post__meta">
                  <span className="feed-post__name">{displayName}</span>
                  <time className="feed-post__time" dateTime={post.created_at}>
                    {formatRelativeTime(post.created_at)}
                  </time>
                </div>
              </header>

              <p className="feed-post__body">{post.body}</p>

              {post.image_data_url ? (
                <div className="feed-post__media-wrap">
                  <img src={post.image_data_url} alt="" className="feed-post__media" />
                </div>
              ) : null}

              {post.reply ? (
                <div className="feed-post__comments">
                  <div className="feed-comment">
                    <UserAvatar
                      name={post.reply.from_name}
                      variant="stuff"
                      size="sm"
                      imageUrl={user?.vehicle_hero_image}
                    />
                    <div className="feed-comment__bubble">
                      <span className="feed-comment__name">{post.reply.from_name}</span>
                      <p className="feed-comment__text">{post.reply.body}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="feed-post__pending muted">Waiting for a reply…</p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
