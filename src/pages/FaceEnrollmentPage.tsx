import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as backend from '../api/backend';

function waitForVideoFrame(video: HTMLVideoElement, timeoutMs = 5000): Promise<void> {
  if (video.videoWidth > 0 && video.videoHeight > 0) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('Camera preview did not start. Try Open camera again.'));
    }, timeoutMs);

    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        cleanup();
        resolve();
      }
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('playing', onReady);
    };

    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('playing', onReady);
    onReady();
  });
}

export function FaceEnrollmentPage() {
  const qc = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const [lastClaimCode, setLastClaimCode] = useState<string | null>(null);

  const statusQ = useQuery({
    queryKey: ['face-enrollment'],
    queryFn: () => backend.getFaceEnrollment(),
  });

  const tagsQ = useQuery({
    queryKey: ['tags'],
    queryFn: () => backend.getTags(),
    refetchInterval: 8000,
  });

  const hasLinkedTag = (tagsQ.data ?? []).some((t) =>
    ['active', 'linked'].includes(t.status),
  );

  const attachStream = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) {
      throw new Error('Camera preview is not ready yet.');
    }
    video.srcObject = stream;
    video.muted = true;
    try {
      await video.play();
    } catch {
      // iOS sometimes needs a user gesture; Open camera click already happened.
    }
    await waitForVideoFrame(video);
    setFrameReady(true);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setFrameReady(false);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser does not support camera access. Try Chrome or Safari.');
      return;
    }
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraReady(true);
      await attachStream(stream);
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Allow camera for this site in browser settings.'
          : err instanceof Error
            ? err.message
            : 'Camera access is required for face enrollment.';
      setCameraError(msg);
      setCameraReady(false);
      setFrameReady(false);
    }
  }, [attachStream]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setCameraReady(false);
    setFrameReady(false);
  }, []);

  const captureBase64 = useCallback(async (): Promise<string> => {
    const video = videoRef.current;
    if (!video) {
      throw new Error('Camera preview is not ready.');
    }
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      await waitForVideoFrame(video);
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not capture photo.');
    }
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const comma = dataUrl.indexOf(',');
    const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
    if (!base64) {
      throw new Error('Could not capture photo.');
    }
    return base64;
  }, []);

  const enrollM = useMutation({
    mutationFn: async () => {
      const image_base64 = await captureBase64();
      return backend.enrollFace({ image_base64, accept_biometrics: true });
    },
    onSuccess: (data) => {
      stopCamera();
      if (data.claim_code?.display_code) {
        setLastClaimCode(data.claim_code.display_code);
      }
      void qc.invalidateQueries({ queryKey: ['face-enrollment'] });
    },
  });

  const resetM = useMutation({
    mutationFn: () => backend.resetFaceEnrollment(),
    onSuccess: () => {
      setLastClaimCode(null);
      void qc.invalidateQueries({ queryKey: ['face-enrollment'] });
    },
  });

  const enrolled = statusQ.data?.status === 'enrolled';
  const claimCode =
    lastClaimCode ?? statusQ.data?.claim_code?.display_code ?? null;

  return (
    <div className="page page--padded">
      <h1 className="page-title">Face enrollment</h1>
      <p className="muted page-lead">
        Register your face so the kiosk recognizes you. Your claim code appears here after enrollment
        — use it at the kiosk when you are ready to link and get your tag. Link and dispense happen
        only at the kiosk, not in this app.
      </p>

      {statusQ.isLoading ? <p className="muted">Checking enrollment…</p> : null}
      {enrolled ? (
        <section className="card card--info">
          <h2 className="card-title">Face enrolled</h2>
          <p className="fineprint">
            Updated {statusQ.data?.updated_at ? new Date(statusQ.data.updated_at).toLocaleString() : '—'}
          </p>
          {hasLinkedTag ? (
            <p className="fineprint">
              Your RFID tag is linked. Use it at the kiosk coin machine — no claim code needed.
            </p>
          ) : claimCode ? (
            <p className="fineprint">
              Your kiosk claim code: <strong>{claimCode}</strong>
              <br />
              No expiry — claim at the site whenever you are ready. Enter this code at the kiosk after
              it recognizes your face.
            </p>
          ) : statusQ.isFetching ? (
            <p className="fineprint muted">Loading your claim code…</p>
          ) : (
            <p className="fineprint muted">
              No active claim code right now. If you still need to link a tag, contact branch support.
            </p>
          )}
          <div className="row-links">
            <Link to="/home">Back to home</Link>
            {!hasLinkedTag ? (
              <button
                type="button"
                className="link-button"
                disabled={resetM.isPending}
                onClick={() => {
                  if (
                    window.confirm(
                      'Remove face enrollment and claim code so you can register again?',
                    )
                  ) {
                    resetM.mutate();
                  }
                }}
              >
                {resetM.isPending ? 'Resetting…' : 'Reset & enroll again'}
              </button>
            ) : null}
          </div>
          {resetM.isError ? (
            <p className="banner banner--error">
              {resetM.error instanceof Error ? resetM.error.message : 'Reset failed'}
            </p>
          ) : null}
        </section>
      ) : null}

      {!enrolled ? (
        <>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>I consent to biometric face enrollment for kiosk recognition.</span>
          </label>

          <div className="face-capture">
            <video
              ref={videoRef}
              className={`face-capture__video${cameraReady ? ' face-capture__video--live' : ''}`}
              playsInline
              muted
              autoPlay
            />
            {!cameraReady ? (
              <button type="button" className="btn btn--primary" onClick={() => void startCamera()}>
                Open camera
              </button>
            ) : (
              <div className="row-links">
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={!accepted || !frameReady || enrollM.isPending}
                  onClick={() => enrollM.mutate()}
                >
                  {enrollM.isPending ? 'Saving…' : frameReady ? 'Capture & save face' : 'Starting camera…'}
                </button>
                <button type="button" className="btn btn--ghost" onClick={stopCamera}>
                  Stop camera
                </button>
              </div>
            )}
          </div>

          {cameraError ? <p className="banner banner--error">{cameraError}</p> : null}
          {enrollM.isError ? (
            <p className="banner banner--error">
              {enrollM.error instanceof Error ? enrollM.error.message : 'Enrollment failed'}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
