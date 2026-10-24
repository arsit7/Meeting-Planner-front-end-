import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { useDocumentTitle } from '../utils/ui.js';

export default function NotFoundPage() {
  useDocumentTitle('Page not found');
  return (
    <section className="card empty-card mx-auto mt-10 max-w-xl">
      <div className="empty-icon" aria-hidden="true">
        <Icon name="search" size={30} />
      </div>
      <h1>Page not found</h1>
      <p className="muted">This page doesn't exist. The link may be broken, or the page may have moved.</p>
      <Link to="/dashboard" className="btn btn-primary">
        Go to dashboard
      </Link>
    </section>
  );
}
