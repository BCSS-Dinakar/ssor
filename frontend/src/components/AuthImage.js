import { useState, useEffect } from 'react';

/**
 * Renders an image stored privately in MinIO.
 *
 * The DB holds only the permanent object key. On render we call the permanent
 * backend link (`urlFetcher`), which returns a fresh, time-limited signed URL,
 * and set it as the <img> src. The signed URL points straight at MinIO and
 * carries its own signature, so no auth cookie is needed on the image request.
 *
 * @param {string}   filename   permanent object key stored in the DB.
 * @param {function} urlFetcher async (filename) => signed URL string
 *                              (e.g. organizationApi.getSignedUrl).
 */
export default function AuthImage({ filename, urlFetcher, alt = '', className = '', fallback = '/images/placeholder.jpg' }) {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!filename) return undefined;
    let active = true;
    setSrc(null);
    setFailed(false);

    urlFetcher(filename)
      .then((url) => { if (active) setSrc(url); })
      .catch(() => { if (active) setFailed(true); });

    return () => { active = false; };
  }, [filename, urlFetcher]);

  if (failed) return <img src={fallback} alt={alt} className={className} />;
  if (!src) return <div className={`${className} animate-pulse bg-slate-100`} />;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
