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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold">CA</span>
            </div>
            <span className="font-bold text-2xl text-white">Civic<span className="text-indigo-400">AI</span></span>
          </Link>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            🏛️ Municipal Officer Portal
          </div>
        </div>

        <div className="card p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="officer@municipality.gov.in"
              className="input"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
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
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <button onClick={handleLogin} className="btn-primary w-full py-3" disabled={loading}>
            {loading ? 'Signing in...' : '🔐 Sign in as Officer'}
          </button>
          <p className="text-center text-xs text-slate-600">
            Access restricted to authorized municipal officers only.
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Are you a citizen?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
            Citizen login →
          </Link>
        </p>
      </div>
    </div>
  );
}
