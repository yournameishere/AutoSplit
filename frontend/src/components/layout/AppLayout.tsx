import { NavLink, Outlet } from 'react-router-dom';
import WalletConnectBar from '../wallet/WalletConnectBar';

const links = [
  { label: 'Product', href: '/' },
  { label: 'Pay', href: '/pay/1' },
  { label: 'Owner', href: '/dashboard/owner' },
  { label: 'Member', href: '/dashboard/member' },
];

export default function AppLayout() {
  return (
    <div className="relative min-h-screen bg-night text-white">
      <div className="noise" />
      <div className="hero-glow" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-display text-2xl font-semibold">
            <span className="h-10 w-10 rounded-full bg-gradient-to-br from-aurora to-sunset shadow-card" />
            AutoSplit
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm uppercase tracking-wide text-white/70">
            {links.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                className={({ isActive }) =>
                  `transition hover:text-white ${
                    isActive ? 'text-white' : ''
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <WalletConnectBar />
        </header>
        <main className="flex-1 pb-16">
          <Outlet />
        </main>
        <footer className="mt-auto border-t border-white/10 py-6 text-sm text-white/50">
          Built for Massa • {new Date().getFullYear()}
        </footer>
      </div>
    </div>
  );
}


