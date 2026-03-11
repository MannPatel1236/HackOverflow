import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, admin, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-white h-[52px] flex items-center">
      <div className="w-full px-5 sm:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-[9px] group mb-[3px]">
          <div className="w-[26px] h-[26px] rounded-full border-2 border-burg relative flex items-center justify-center shrink-0 animate-[spin_14s_linear_infinite]">
            <div className="w-[7px] h-[7px] rounded-full bg-burg"></div>
          </div>
          <span className="font-serif text-[17px] font-bold text-text tracking-[0.3px]">
            Civic<span className="text-burg">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-[10px]">
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
        <div className="flex items-center gap-[10px]">
          {(user || admin) ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-[10px]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-burg-2 to-[#6B1010] flex items-center justify-center text-[13px] font-bold text-white">
                  {user?.name?.[0] || admin?.name?.[0] || 'U'}
                </div>
                <div className="flex flex-col">
                  <p className="text-[13px] text-muted leading-tight">
                    {user?.name || admin?.name || (user?.phone?.slice(-4) ? `···${user.phone.slice(-4)}` : '')}
                  </p>
                  <p className="text-[10px] text-dim capitalize leading-tight">
                    {admin ? admin.role.replace('_', ' ') : 'Citizen'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="text-xs text-muted hover:text-burg transition-colors px-3 py-1.5 rounded"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="px-[18px] py-[7px] bg-navy text-white rounded font-semibold text-xs cursor-pointer hover:bg-[#2a2a2a] transition-colors whitespace-nowrap">
                Login / Sign Up
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
      className={`px-3 py-1.5 text-[13px] font-medium transition-all duration-200 ${
        active
          ? 'text-burg'
          : 'text-muted hover:text-text'
      }`}
    >
      {children}
    </Link>
  );
}
