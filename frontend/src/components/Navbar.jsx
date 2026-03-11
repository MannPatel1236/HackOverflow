import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, admin, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
            <span className="text-white text-sm font-bold">CA</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Civic<span className="text-indigo-400">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {user && (
            <>
              <NavLink to="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
              <NavLink to="/file-complaint" active={isActive('/file-complaint')}>File Complaint</NavLink>
            </>
          )}
          {admin && (
            <>
              <NavLink to="/admin" active={isActive('/admin')}>
                {admin.role === 'super_admin' ? 'Super Admin' : `${admin.state} Admin`}
              </NavLink>
            </>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {(user || admin) ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-200">
                  {user?.name || admin?.name || (user?.phone?.slice(-4) ? `···${user.phone.slice(-4)}` : '')}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {admin ? admin.role.replace('_', ' ') : 'Citizen'}
                </p>
              </div>
              <button
                onClick={logout}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost text-sm">Sign in</Link>
              <Link to="/file-complaint" className="btn-primary text-sm hidden md:block">
                File Complaint
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-indigo-600/20 text-indigo-400'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      {children}
    </Link>
  );
}
