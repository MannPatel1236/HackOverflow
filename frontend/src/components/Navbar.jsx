import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { Menu, X, LogOut, Shield, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, admin, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-[100] border-b border-border bg-white/80 backdrop-blur-xl h-[72px] flex items-center">
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
             <div className="w-2 h-2 rounded-full bg-white" />
          </div>
          <span className="font-sans text-xl font-extrabold text-navy tracking-tight uppercase">
            CIVIC<span className="text-burg">AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {user && (
            <>
              <NavLink to="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
              <NavLink to="/file-complaint" active={isActive('/file-complaint')}>Report Incident</NavLink>
            </>
          )}
          {admin && (
            <NavLink to="/admin" active={isActive('/admin')}>
              {admin.role === 'super_admin' ? 'Federal Oversight' : 'Regional Command'}
            </NavLink>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {(user || admin) ? (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3 pl-2 py-1 pr-1 bg-off rounded-full border border-border group hover:bg-white transition-all duration-300">
                <span className="text-xs font-bold text-navy px-2 uppercase tracking-wide">
                  {user?.name || admin?.name || 'User'}
                </span>
                <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-[10px] font-black group-hover:bg-burg transition-colors">
                  {user?.name?.[0] || admin?.name?.[0] || 'U'}
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2.5 rounded-full bg-off text-muted hover:text-burg hover:bg-burg/5 transition-all duration-300"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" className="btn-primary py-2.5 px-6">
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Toggle */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-navy p-2">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[72px] bg-white z-[90] p-8 lg:hidden border-t border-border"
          >
            <div className="flex flex-col gap-8 max-w-lg mx-auto">
               {(user || admin) && (
                 <div className="flex items-center gap-4 pb-8 border-b border-border">
                    <div className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center text-xl font-black">
                       {user?.name?.[0] || admin?.name?.[0]}
                    </div>
                    <div>
                        <p className="text-xl font-extrabold text-navy tracking-tight">{user?.name || admin?.name}</p>
                        <p className="text-sm font-medium text-muted uppercase tracking-wider">{admin ? admin.role : 'Citizen Account'}</p>
                    </div>
                 </div>
               )}

              <div className="flex flex-col gap-4">
                {user && (
                  <>
                    <MobileNavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard View</MobileNavLink>
                    <MobileNavLink to="/file-complaint" onClick={() => setMenuOpen(false)}>Report Case</MobileNavLink>
                  </>
                )}
                {admin && (
                  <MobileNavLink to="/admin" onClick={() => setMenuOpen(false)}>Operations Center</MobileNavLink>
                )}
              </div>

              {(user || admin) ? (
                <button onClick={logout} className="btn-primary w-full py-5">Sign Out</button>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary w-full py-5 text-center">Get Started</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`px-4 py-2 text-sm font-bold transition-all duration-300 rounded-xl ${
        active ? 'bg-off text-navy' : 'text-muted hover:text-navy hover:bg-off/50'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ to, onClick, children }) {
   return (
      <Link to={to} onClick={onClick} className="text-3xl font-extrabold text-navy tracking-tight flex justify-between items-center group transition-colors hover:text-burg">
         {children} <ChevronRight size={24} className="text-burg opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
      </Link>
   );
}
