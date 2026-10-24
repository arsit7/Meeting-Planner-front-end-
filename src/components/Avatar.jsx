import { useEffect, useState } from 'react';
import { fetchAvatarBlob } from '../api/users.js';

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** Shows the user's uploaded avatar (fetched with auth) or their initials. */
export default function Avatar({ user, size = 36 }) {
  const [src, setSrc] = useState(null);
  const avatarUrl = user?.avatarUrl;

  useEffect(() => {
    if (!avatarUrl) {
      setSrc(null);
      return undefined;
    }
    let objectUrl = null;
    let cancelled = false;
    fetchAvatarBlob(avatarUrl)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => !cancelled && setSrc(null));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatarUrl]);

  const style = { width: size, height: size, fontSize: size * 0.4 };
  return src ? (
    <img className="avatar" src={src} alt={`${user.name}'s avatar`} style={style} />
  ) : (
    <span className="avatar avatar-fallback" style={style} aria-label={`${user?.name ?? 'User'}'s avatar`}>
      {initials(user?.name)}
    </span>
  );
}
