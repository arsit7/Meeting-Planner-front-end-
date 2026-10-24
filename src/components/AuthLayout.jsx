import Icon from './Icon.jsx';

const FEATURES = [
  { icon: 'calendar', text: 'Schedule meetings in seconds' },
  { icon: 'users', text: 'Invite participants by email' },
  { icon: 'trend', text: 'See your meeting activity at a glance' },
];

/** Split-screen frame for the login and signup forms: brand panel on large screens, form on the right. */
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-white">
      <aside className="relative hidden w-[46%] max-w-2xl flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white lg:flex">
        <div className="pointer-events-none absolute -top-32 -left-24 size-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 -bottom-32 size-[28rem] rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden="true" />

        <div className="relative flex items-center gap-3 text-lg font-bold">
          <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <Icon name="calendar" size={20} strokeWidth={2.2} />
          </span>
          Meeting Planner
        </div>

        <div className="relative">
          <h2 className="max-w-md text-4xl leading-tight font-bold tracking-tight text-white">
            Plan better meetings, together.
          </h2>
          <ul className="mt-8 list-none space-y-4 p-0">
            {FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-indigo-100">
                <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                  <Icon name={f.icon} size={18} />
                </span>
                {f.text}
              </li>
            ))}
          </ul>

          <div className="mt-10 max-w-sm rotate-[-2deg] rounded-2xl bg-white/95 p-4 text-slate-800 shadow-2xl shadow-indigo-950/40 transition-transform duration-300 hover:rotate-0">
            <div className="flex items-center gap-3">
              <div className="date-block size-12">
                <span className="date-block-month">Today</span>
                <span className="date-block-day text-base">10:00</span>
              </div>
              <div className="min-w-0">
                <p className="m-0 font-semibold">Sprint planning</p>
                <p className="m-0 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="live-dot" aria-hidden="true" /> 5 participants joined
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-indigo-200">© {new Date().getFullYear()} Meeting Planner</p>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-10 sm:px-8 lg:bg-white">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 flex items-center gap-2.5 font-bold text-slate-900 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <Icon name="calendar" size={18} strokeWidth={2.2} />
            </span>
            Meeting Planner
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
