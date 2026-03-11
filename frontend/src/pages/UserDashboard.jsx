import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ComplaintCard from '../components/ComplaintCard';
import { useAuth } from '../context/AuthContext';
import { getMyComplaints } from '../utils/api';

export default function UserDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyComplaints()
      .then((res) => setComplaints(res.data.complaints))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: complaints.length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
    pending: complaints.filter((c) => c.status !== 'Resolved').length,
    breach: complaints.filter((c) => c.sla_breach).length,
  };

  const openWhatsApp = () => {
    const number = import.meta.env.VITE_WHATSAPP_NUMBER || '14155238886';
    window.open(`https://wa.me/${number}?text=Hi%20CivicAI`, '_blank');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back{user?.name ? `, ${user.name}` : ''} 👋
            </h1>
            <p className="text-slate-400 mt-1 text-sm">{user?.phone}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={openWhatsApp} className="btn-secondary text-sm flex items-center gap-2">
              <span>📱</span> WhatsApp
            </button>
            <Link to="/file-complaint" className="btn-primary text-sm">
              + File Complaint
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Filed', value: stats.total, icon: '📋', color: 'text-slate-300' },
            { label: 'Resolved', value: stats.resolved, icon: '✅', color: 'text-green-400' },
            { label: 'Pending', value: stats.pending, icon: '⏳', color: 'text-yellow-400' },
            { label: 'SLA Breach', value: stats.breach, icon: '⚠️', color: 'text-red-400' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                <span>{s.icon}</span>
                {s.label}
              </div>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Track Quick Search */}
        <div className="card p-5 mb-6">
          <TrackQuickSearch />
        </div>

        {/* Complaints List */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Your Complaints</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-4 animate-pulse h-20 bg-slate-800/50" />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-white mb-2">No complaints yet</h3>
              <p className="text-slate-400 text-sm mb-6">
                File your first complaint and track its resolution in real time.
              </p>
              <Link to="/file-complaint" className="btn-primary inline-flex">
                File First Complaint
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <ComplaintCard key={c._id || c.tracking_id} complaint={c} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrackQuickSearch() {
  const [id, setId] = useState('');

  const handleTrack = () => {
    if (id.trim()) {
      window.location.href = `/track/${id.trim().toUpperCase()}`;
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-300 mb-1.5">Track a complaint</p>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="CIV-ABC-123"
          className="input font-mono"
          onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
        />
      </div>
      <button onClick={handleTrack} className="btn-primary mt-6 px-5">Track →</button>
    </div>
  );
}
