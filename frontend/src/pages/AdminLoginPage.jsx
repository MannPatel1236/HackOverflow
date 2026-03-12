import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminLogin } from '../utils/api';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) return setError('Email and password required');
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(email, password);
      loginAdmin(res.data.token, res.data.admin);
      navigate('/admin');
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Topbar */}
      <div className="bg-white border-b border-border px-12 h-[52px] flex items-center justify-between">
        <Link to="/" className="bg-transparent border border-border rounded-[4px] px-[14px] py-[6px] text-[12px] font-semibold text-text cursor-pointer flex items-center gap-[6px] transition-all duration-150 hover:border-burg hover:text-burg">
          ← Back
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-[460px] bg-white rounded-[8px] border border-border overflow-hidden shadow-[0_16px_56px_rgba(0,0,0,0.09)] animate-fade-in">
          {/* Card Head */}
          <div className="bg-navy px-[28px] py-[26px] text-center">
            <div className="flex items-center justify-center gap-[9px] mb-[3px]">
              <div className="w-[20px] h-[20px] rounded-full border-2 border-burg relative flex items-center justify-center shrink-0">
                <div className="w-[5px] h-[5px] rounded-full bg-burg"></div>
              </div>
              <span className="font-serif text-[17px] text-white font-bold">
                Civic<span className="text-burg">AI</span>
              </span>
            </div>
            <div className="text-[11px] text-white/33 uppercase tracking-[1px] mb-2">
              Official Dashboard
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-bg border border-amber/20 text-amber text-[10px] font-bold tracking-widest uppercase">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><rect x="2" y="9" width="4" height="13"/><rect x="18" y="9" width="4" height="13"/><rect x="10" y="13" width="4" height="9"/><path d="M18 22V5.86a2 2 0 0 0-.9-1.67L12.9 1.6a2 2 0 0 0-1.8 0L6.9 4.19A2 2 0 0 0 6 5.86V22"/></svg>
              Municipal Officer Portal
            </div>
          </div>

          <div className="p-[28px]">
            <div className="mb-[14px]">
              <label className="block text-[11px] font-semibold text-text mb-[4px]">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@municipality.gov.in"
                className="input"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="mb-[14px]">
              <label className="block text-[11px] font-semibold text-text mb-[4px]">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {error && (
              <div className="bg-burg-bg border border-burg/20 rounded-[5px] px-[12px] py-[8px] mb-[14px]">
                <p className="text-burg text-[12px]">{error}</p>
              </div>
            )}
            <button onClick={handleLogin} className="w-full p-[12px] rounded-[5px] bg-burg hover:bg-burg-2 text-white border-none text-[14px] font-bold cursor-pointer transition-all duration-200 shadow-[0_4px_14px_rgba(139,26,26,0.28)]" disabled={loading}>
              {loading ? 'Signing in...' : (
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Sign in as Officer
                </span>
              )}
            </button>
            <p className="text-center text-[11px] text-dim mt-[12px]">
              Access restricted to authorized municipal officers only.
            </p>

            <div className="text-center text-[12px] text-muted mt-[16px] pt-[16px] border-t border-border">
              Are you a citizen?{' '}
              <Link to="/login" className="text-burg font-semibold no-underline">
                Citizen login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
