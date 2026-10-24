import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

/** "← Back" link shown above page content. */
export default function BackLink({ to, children }) {
  return (
    <Link to={to} className="back-link">
      <Icon name="arrowLeft" size={16} />
      {children}
    </Link>
  );
}
