import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import StatusTimeline from '../components/StatusTimeline';
import { trackComplaint } from '../utils/api';

const SEVERITY_COLORS = {
  Critical: 'badge-critical', High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low',
};

export default function TrackComplaint() {
  const { trackingId } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchComplaint();

    // Socket.io for live updates
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || '', {
      transports: ['websocket'],
    });
    socket.emit('join_complaint', trackingId);
    socket.on('status_update', (update) => {
      if (update.tracking_id === trackingId) {
        setComplaint((prev) => ({
          ...prev,
          status: update.status,
          status_history: update.status_history,
        }));
        setLastUpdated(new Date());
      }
    });

    // Also poll every 30s as fallback
    const interval = setInterval(fetchComplaint, 30000);
    return () => { socket.disconnect(); clearInterval(interval); };
  }, [trackingId]);

  const fetchComplaint = async () => {
    try {
      const res = await trackComplaint(trackingId);
      setComplaint(res.data.complaint);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.response?.status === 404 ? 'Complaint not found.' : 'Failed to load complaint.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading complaint...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
          <p className="text-slate-400 text-sm mb-6">Check your tracking ID and try again.</p>
          <Link to="/" className="btn-secondary px-6 py-2">← Go Home</Link>
        </div>
      </div>
    );
  }

  const DEPT_ICONS = { Roads: '🛣️', Sanitation: '🗑️', Water: '💧', Electricity: '⚡', Other: '📋' };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Minimal Header */}
      <div className="border-b border-slate-800 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">CA</span>
            </div>
            <span className="font-bold text-white">Civic<span className="text-indigo-400">AI</span></span>
          </Link>
          <span className="text-xs text-slate-500">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5 animate-fade-in">
        {/* Breach alert */}
        {complaint.sla_breach && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
            <span className="text-red-400 text-lg">⚠️</span>
            <div>
              <p className="text-red-400 font-semibold text-sm">SLA Breached</p>
              <p className="text-red-400/70 text-xs">This complaint has exceeded the 72-hour resolution target.</p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="card p-6 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{DEPT_ICONS[complaint.department]}</span>
                <span className="font-mono text-indigo-400 font-bold text-lg">{complaint.tracking_id}</span>
              </div>
              <p className="text-white text-base leading-relaxed">{complaint.summary_en}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Department', value: complaint.department },
              { label: 'Channel', value: complaint.channel === 'whatsapp' ? '📱 WhatsApp' : '🌐 Web' },
              { label: 'Severity', value: (
                <span className={`badge ${SEVERITY_COLORS[complaint.severity]}`}>{complaint.severity}</span>
              )},
              { label: 'ETA', value: `${complaint.eta_days} days` },
              { label: 'Location', value: [complaint.district, complaint.state].filter(Boolean).join(', ') || 'Not specified' },
              { label: 'Filed On', value: new Date(complaint.filed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                <p className="text-sm text-slate-200 font-medium">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Status Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Resolution Progress</h3>
            <StatusTimeline status={complaint.status} statusHistory={complaint.status_history} />
          </div>

          {/* History */}
          {complaint.status_history?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Activity Log</h3>
              <div className="space-y-2">
                {[...complaint.status_history].reverse().map((h, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="text-slate-300 font-medium">{h.status}</span>
                      {h.note && <span className="text-slate-500"> — {h.note}</span>}
                    </div>
                    <span className="text-slate-600 text-xs shrink-0">
                      {new Date(h.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link to="/" className="btn-secondary flex-1 py-2.5 text-center text-sm">
            ← Home
          </Link>
          <button
            onClick={() => {
              const number = import.meta.env.VITE_WHATSAPP_NUMBER || '14155238886';
              window.open(`https://wa.me/${number}?text=STATUS%20${complaint.tracking_id}`, '_blank');
            }}
            className="btn-secondary flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
          >
            <span>📱</span>
            Check on WhatsApp
          </button>
        </div>

        <p className="text-center text-xs text-slate-600">
          This page updates automatically. Share this link to let others track this complaint.
        </p>
      </div>
    </div>
  );
}
