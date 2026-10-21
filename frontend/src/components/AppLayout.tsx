import { Link, NavLink, Outlet } from 'react-router';

const NAV_ITEMS = [
  { to: '/', label: 'Jogadores' },
  { to: '/clubes', label: 'Clubes' },
  { to: '/partidas', label: 'Partidas' },
  { to: '/classificacao', label: 'Classificação' },
];

function navLinkClassName({ isActive }: { isActive: boolean }): string {
  const base = 'block rounded-md px-3 py-2 text-sm font-medium';
  return isActive
    ? `${base} bg-blue-50 text-blue-700`
    : `${base} text-slate-600 hover:bg-slate-100 hover:text-slate-900`;
}

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <span
              aria-hidden="true"
              className="flex size-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white"
            >
              P
            </span>
            Passe
          </Link>
          <nav aria-label="Menu principal">
            <ul className="flex flex-wrap gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={navLinkClassName}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
