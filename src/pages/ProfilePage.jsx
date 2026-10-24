import { useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { uploadAvatar } from '../api/users.js';
import { getErrorMessage } from '../api/errors.js';
import Avatar from '../components/Avatar.jsx';
import Alert from '../components/Alert.jsx';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleChoose = (e) => {
    setSuccess('');
    const chosen = e.target.files?.[0] ?? null;
    if (chosen && !ALLOWED_TYPES.includes(chosen.type)) {
      setError('Please choose a PNG, JPEG, GIF or WebP image.');
      setFile(null);
    } else if (chosen && chosen.size > MAX_BYTES) {
      setError('Image must be at most 2 MB.');
      setFile(null);
    } else {
      setError('');
      setFile(chosen);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose an image first.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const updated = await uploadAvatar(file);
      updateUser(updated);
      setSuccess('Profile picture updated.');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(getErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="narrow">
      <h1>Your profile</h1>
      <div className="card profile-card">
        <Avatar user={user} size={96} />
        <div>
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          {user.createdAt && (
            <p className="muted small">Member since {new Date(user.createdAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      <form className="card form" onSubmit={handleUpload}>
        <h2>Profile picture</h2>
        <p className="muted small">PNG, JPEG, GIF or WebP, up to 2 MB.</p>
        <Alert type="error">{error}</Alert>
        <Alert type="success">{success}</Alert>
        <div className="field">
          <label htmlFor="avatar-input">Choose image</label>
          <input
            id="avatar-input"
            ref={inputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleChoose}
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </form>
    </section>
  );
}
