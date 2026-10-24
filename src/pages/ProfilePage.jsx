import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { uploadAvatar } from '../api/users.js';
import { getErrorMessage } from '../api/errors.js';
import Avatar from '../components/Avatar.jsx';
import Alert from '../components/Alert.jsx';
import { useDocumentTitle } from '../utils/ui.js';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const AVATAR_SIZE = 120;

const formatSize = (bytes) => (bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  useDocumentTitle('Profile');

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clearSelection = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const selectFile = (chosen) => {
    setSuccess('');
    if (!chosen) return;
    if (!ALLOWED_TYPES.includes(chosen.type)) {
      setError(`“${chosen.name}” isn't a supported image. Please choose a PNG, JPEG, GIF or WebP file.`);
      clearSelection();
    } else if (chosen.size > MAX_BYTES) {
      setError(`“${chosen.name}” is ${formatSize(chosen.size)}. Please choose an image of 2 MB or less.`);
      clearSelection();
    } else {
      setError('');
      setFile(chosen);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!uploading) selectFile(e.dataTransfer.files?.[0]);
  };

  const handleSave = async () => {
    setUploading(true);
    setError('');
    try {
      const updated = await uploadAvatar(file);
      updateUser(updated);
      setSuccess('Your profile picture was updated.');
      clearSelection();
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't upload your picture."));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl">
      <div className="page-header">
        <div>
          <h1>Your profile</h1>
          <p className="muted">Manage how you appear to people you meet with.</p>
        </div>
      </div>
      <Alert type="error" onDismiss={() => setError('')}>
        {error}
      </Alert>
      <Alert type="success" onDismiss={() => setSuccess('')}>
        {success}
      </Alert>

      <div className="card overflow-hidden p-0">
        <div className="relative h-32 bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_120%,rgb(255_255_255/0.25),transparent_50%)]" />
        </div>
        <div className="flex flex-col items-center gap-5 px-6 pb-6 text-center sm:flex-row sm:items-end sm:text-left">
        <div
          className="relative -mt-16 shrink-0 rounded-full"
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <button
            type="button"
            className={`group relative block cursor-pointer rounded-full border-0 bg-white p-1 shadow-lg transition-all duration-200 hover:shadow-xl hover:ring-4 hover:ring-indigo-200 disabled:cursor-progress ${
              dragging ? 'ring-4 ring-indigo-400' : ''
            }`}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile picture"
            title="Change profile picture"
          >
            {preview ? (
              <img className="avatar block" src={preview} alt="" style={{ width: AVATAR_SIZE, height: AVATAR_SIZE }} />
            ) : (
              <Avatar user={user} size={AVATAR_SIZE} />
            )}
            <span
              className={`absolute inset-1 flex items-center justify-center rounded-full bg-slate-900/55 text-sm font-semibold text-white transition-opacity duration-200 ${
                uploading || dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
              }`}
              aria-hidden="true"
            >
              {uploading ? <span className="spinner border-white/30 border-t-white" /> : 'Change'}
            </span>
            <span
              className="absolute right-1 bottom-1 flex size-9 items-center justify-center rounded-full border-[3px] border-white bg-indigo-600 text-white shadow-md transition-transform duration-200 group-hover:scale-110 group-hover:bg-indigo-700"
              aria-hidden="true"
            >
              <PencilIcon />
            </span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={(e) => selectFile(e.target.files?.[0])}
            hidden
            tabIndex={-1}
          />
        </div>

        <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
          <h2 className="text-xl">{user.name}</h2>
          <p className="muted mt-0.5">{user.email}</p>
          {user.createdAt && (
            <p className="muted small mt-1">
              Member since {new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          )}
        </div>
        </div>

        <div className="border-t border-slate-100 px-6 py-5">
          {file ? (
            <div className="flex animate-fade-in flex-col gap-3 rounded-xl bg-indigo-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="m-0 text-sm [overflow-wrap:anywhere]">
                <strong>New photo:</strong> {file.name} <span className="muted">({formatSize(file.size)})</span>
              </p>
              <div className="flex shrink-0 justify-center gap-2">
                <button type="button" className="btn btn-primary" onClick={handleSave} disabled={uploading} aria-busy={uploading}>
                  {uploading && <span className="btn-spinner" aria-hidden="true" />}
                  {uploading ? 'Saving…' : 'Save photo'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={clearSelection} disabled={uploading}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="muted small m-0 text-center sm:text-left">
              Click your photo or drop an image on it to change it. PNG, JPEG, GIF or WebP, up to 2 MB.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
