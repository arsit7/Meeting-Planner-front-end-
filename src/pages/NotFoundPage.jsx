import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="narrow card empty-card">
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/meetings" className="btn btn-primary">
        Go to meetings
      </Link>
    </section>
  );
}
