import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, matchPath, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';

const COLLAPSED_KEY = 'mp.sidebarCollapsed';

const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    title: 'Meetings',
    items: [
      // Active for the list and any single meeting, but not for the "new meeting" form.
      {
        to: '/meetings',
        label: 'All meetings',
        icon: 'calendar',
        isActive: (path) => path.startsWith('/meetings') && path !== '/meetings/new',
      },
      { to: '/meetings/new', label: 'New meeting', icon: 'plus' },
    ],
  },
  {
    title: 'Account',
    items: [{ to: '/profile', label: 'Profile', icon: 'user' }],
  },
];

/** Breadcrumb trail for the top bar, derived from the current path. */
function breadcrumbs(pathname) {
  if (pathname === '/dashboard') return ['Dashboard'];
  if (pathname === '/profile') return ['Account', 'Profile'];
  if (pathname === '/meetings') return ['Meetings', 'All meetings'];
  if (pathname === '/meetings/new') return ['Meetings', 'New meeting'];
  if (matchPath('/meetings/:id/edit', pathname)) return ['Meetings', 'Details', 'Edit'];
  if (matchPath('/meetings/:id', pathname)) return ['Meetings', 'Details'];
  return ['Not found'];
}

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the mobile drawer and user menu whenever the page changes.
  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // Storage unavailable (private mode); the preference just isn't remembered.
    }
  }, [collapsed]);

  useEffect(() => {
    if (!drawerOpen && !menuOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setMenuOpen(false);
      }
    };
    const handleClick = (e) => {
      if (menuOpen && !menuRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [drawerOpen, menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const crumbs = breadcrumbs(pathname);
  // Labels hide only on large screens when collapsed; the mobile drawer always shows them.
  const whenExpanded = collapsed ? 'lg:hidden' : '';
  const navItemBase = `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium no-underline transition-all duration-150 ${
    collapsed ? 'lg:justify-center lg:px-0' : ''
  }`;
  const navItemIdle = 'cursor-pointer border-0 bg-transparent text-slate-400 hover:bg-white/5 hover:text-white';

  return (
    <div className="min-h-screen">
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 shadow-2xl transition-[width,transform] duration-300 lg:shadow-none ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${collapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        <div className={`flex h-16 items-center justify-between px-5 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <Link to="/dashboard" className="flex items-center gap-3 font-bold text-white no-underline">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 shadow-lg shadow-indigo-900/50">
              <Icon name="calendar" size={18} strokeWidth={2.2} />
            </span>
            <span className={`text-[0.95rem] tracking-tight ${whenExpanded}`}>Meeting Planner</span>
          </Link>
          <button
            type="button"
            className="icon-button text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className={`mb-2 px-3 text-[0.68rem] font-semibold tracking-widest text-slate-500 uppercase ${whenExpanded}`}>
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = item.isActive ? item.isActive(pathname) : pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={`${navItemBase} ${
                        active
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50'
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className={`transition-transform duration-150 ${active ? '' : 'group-hover:scale-110'}`}>
                        <Icon name={item.icon} />
                      </span>
                      <span className={whenExpanded}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-3">
          {/* <Link
            to="/profile"
            title={collapsed ? user?.name : undefined}
            className={`mb-2 flex items-center gap-3 rounded-xl p-2 no-underline transition hover:bg-white/5 ${
              collapsed ? 'lg:justify-center' : ''
            }`}
          >
            <Avatar user={user} size={36} />
            <span className={`min-w-0 ${whenExpanded}`}>
              <strong className="block truncate text-sm text-white">{user?.name}</strong>
              <span className="block truncate text-xs text-slate-400">{user?.email}</span>
            </span>
          </Link> */}
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? 'Log out' : undefined}
            className={`${navItemBase} cursor-pointer border-0 bg-transparent text-slate-400 hover:bg-red-500/10 hover:text-red-300`}
          >
            <Icon name="logout" />
            <span className={whenExpanded}>Log out</span>
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            className={`${navItemBase} ${navItemIdle} hidden lg:flex`}
          >
            <Icon name={collapsed ? 'expand' : 'collapse'} />
            <span className={whenExpanded}>Collapse</span>
          </button>
        </div>
      </aside>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 animate-[fade-in_0.2s_ease-out] bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`transition-[padding] duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/70 bg-white/80 px-4 backdrop-blur-md lg:px-8">
          <button
            type="button"
            className="icon-button lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <Icon name="menu" />
          </button>

          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm text-slate-500">
            {crumbs.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1.5 truncate">
                {i > 0 && <Icon name="chevronRight" size={14} className="shrink-0 text-slate-300" />}
                <span className={i === crumbs.length - 1 ? 'font-semibold text-slate-900' : ''}>{crumb}</span>
              </span>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/meetings/new" className="btn btn-primary btn-sm hidden sm:inline-flex">
              <Icon name="plus" size={16} strokeWidth={2.4} />
              New meeting
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pr-2.5 pl-1 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:shadow-sm"
              >
                <Avatar user={user} size={30} />
                <span className="hidden sm:inline">{user?.name?.split(' ')[0]}</span>
                <Icon
                  name="chevronDown"
                  size={16}
                  className={`text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-64 origin-top-right animate-pop-in overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 px-3 pt-2 pb-3">
                    <Avatar user={user} size={40} />
                    <div className="min-w-0">
                      <strong className="block truncate text-sm text-slate-900">{user?.name}</strong>
                      <span className="block truncate text-xs text-slate-500">{user?.email}</span>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    role="menuitem"
                    className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 no-underline transition hover:bg-slate-100"
                  >
                    <Icon name="user" size={18} className="text-slate-400" />
                    Your profile
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-0 bg-transparent px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <Icon name="logout" size={18} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">
          <div key={pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
