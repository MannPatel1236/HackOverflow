import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import StatusTimeline from '../components/StatusTimeline';
import { trackComplaint } from '../utils/api';
import { Search, Map, Trash2, Droplets, Zap, ClipboardList, Smartphone, Globe } from 'lucide-react';

const SEVERITY_COLORS = {
  Critical: 'bg-burg-bg text-burg border-burg/20', 
  High: 'bg-amber-bg text-amber border-amber/20', 
  Medium: 'bg-blue-50 text-blue-600 border-blue-200', 
  Low: 'bg-green-bg text-green border-green/20',
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-[40px] h-[40px] border-[3px] border-burg/30 border-t-burg rounded-full animate-spin mx-auto mb-[16px]" />
          <p className="text-[13px] text-muted font-medium uppercase tracking-wider">Locating Grievance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-6">
        <div className="text-center max-w-[400px] bg-white p-[32px] rounded-[8px] border border-border shadow-sm">
          <div className="w-[64px] h-[64px] mx-auto bg-off rounded-full flex items-center justify-center text-[28px] mb-[16px] border border-border"><Search size={28} /></div>
          <h2 className="font-serif text-[24px] font-bold text-text mb-[8px]">{error}</h2>
          <p className="text-[14px] text-muted leading-[1.6] mb-[24px]">We couldn't find a complaint with that tracking ID. Please verify the ID and try again.</p>
          <Link to="/dashboard" className="btn-primary inline-flex px-[24px]">← Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  const DEPT_ICONS = { Roads: <Map size={16} className="inline mr-1"/>, Sanitation: <Trash2 size={16} className="inline mr-1"/>, Water: <Droplets size={16} className="inline mr-1"/>, Electricity: <Zap size={16} className="inline mr-1"/>, Other: <ClipboardList size={16} className="inline mr-1"/> };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Minimal Header */}
      <div className="bg-white border-b border-border px-[24px] h-[60px] flex items-center justify-between shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-[12px]">
          <Link to="/" className="flex items-center gap-[8px] group">
            <div className="w-[28px] h-[28px] rounded-full border-2 border-burg relative flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-[8px] h-[8px] rounded-full bg-burg"></div>
            </div>
            <span className="font-serif text-[18px] text-text font-bold">Civic<span className="text-burg">AI</span></span>
          </Link>
          <div className="h-[20px] w-[1px] bg-border mx-[4px]"></div>
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Live Tracking</span>
        </div>
        <div className="flex items-center gap-[8px]">
           <div className="w-[6px] h-[6px] rounded-full bg-green animate-pulse"></div>
           <span className="text-[11px] text-muted font-medium">Last synced: {lastUpdated.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>

      <div className="flex-1 max-w-[760px] w-full mx-auto px-[22px] py-[32px] animate-fade-in flex flex-col gap-[20px]">
        {/* Breach alert */}
        {complaint.sla_breach && (
          <div className="bg-burg-bg border border-burg/30 rounded-[6px] px-[16px] py-[12px] flex items-start sm:items-center gap-[12px]">
            <span className="text-[18px] leading-none mt-0.5 sm:mt-0">⚠️</span>
            <div>
              <p className="text-burg font-bold text-[13px] uppercase tracking-wider mb-[2px]">Escalated: SLA Breached</p>
              <p className="text-burg/80 text-[12px] font-medium leading-[1.4]">This complaint has exceeded the standard 72-hour resolution target and has been automatically escalated to higher authorities.</p>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="card p-[28px] bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col gap-[24px]">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-[16px]">
            <div className="flex-1">
              <div className="flex items-center gap-[10px] mb-[12px]">
                <div className="w-[40px] h-[40px] rounded-[6px] bg-cream border border-border flex items-center justify-center text-[20px] shrink-0">
                   {DEPT_ICONS[complaint.department]}
                </div>
                <div>
                   <span className="block text-[10px] font-bold text-muted uppercase tracking-wider mb-[2px]">Tracking ID</span>
                   <span className="font-mono bg-off px-2 py-0.5 rounded border border-border text-text font-bold text-[14px] tracking-wide inline-block">{complaint.tracking_id}</span>
                </div>
              </div>
              <p className={`font-serif text-[18px] text-text font-bold leading-[1.4] ${complaint.summary_en.includes('Audio complaint submitted') ? 'italic text-muted' : ''}`}>
                {complaint.summary_en.includes('Audio complaint submitted') ? 'Audio Grievance Processing' : complaint.summary_en}
              </p>
            </div>
          </div>

          <div className="h-[1px] w-full bg-border/60"></div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-[20px] gap-x-[16px]">
            {[
              { label: 'Assigned Dept.', value: complaint.department },
              { label: 'Reported Via', value: complaint.channel === 'whatsapp' ? <><Smartphone size={16} className="inline mr-1"/> WhatsApp</> : <><Globe size={16} className="inline mr-1"/> Web Portal</> },
              { label: 'System Severity', value: (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded border inline-block ${SEVERITY_COLORS[complaint.severity]}`}>{complaint.severity}</span>
              )},
              { label: 'Target ETA', value: `${complaint.eta_days} Days` },
              { label: 'Location', value: [complaint.district, complaint.state].filter(Boolean).join(', ') || 'Not specified' },
              { label: 'Date Filed', value: new Date(complaint.filed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-[4px]">{item.label}</p>
                <div className="text-[13px] text-text font-semibold">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Status Timeline */}
          <div className="pt-[24px] border-t border-border/80">
            <h3 className="text-[13px] font-bold text-text uppercase tracking-wider mb-[20px] flex items-center gap-[8px]">
               <span className="w-[12px] h-[2px] bg-burg"></span> Resolution Status
            </h3>
            <div className="px-[10px]">
               <StatusTimeline status={complaint.status} statusHistory={complaint.status_history} />
            </div>
          </div>

          {/* History Log */}
          {complaint.status_history?.length > 0 && (
            <div className="pt-[24px] border-t border-border/80">
              <h3 className="text-[13px] font-bold text-text uppercase tracking-wider mb-[16px] flex items-center gap-[8px]">
                 <span className="w-[12px] h-[2px] bg-burg"></span> Activity Log
              </h3>
              <div className="flex flex-col gap-[16px]">
                {[...complaint.status_history].reverse().map((h, i, arr) => (
                  <div key={i} className="flex items-start gap-[14px] relative">
                    {i !== arr.length - 1 && (
                      <div className="absolute left-[5px] top-[14px] bottom-[-20px] w-[1px] bg-border z-0"></div>
                    )}
                    <div className={`w-[11px] h-[11px] rounded-full mt-[4px] shrink-0 z-10 border-2 border-white ${i === 0 ? 'bg-burg shadow-[0_0_0_2px_rgba(139,26,26,0.2)]' : 'bg-muted/50'}`} />
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-[4px] sm:gap-[16px]">
                      <div>
                        <span className={`text-[13px] ${i === 0 ? 'font-bold text-text' : 'font-medium text-muted'}`}>{h.status}</span>
                        {h.note && <p className="text-[12px] text-muted leading-[1.6] mt-[2px] bg-cream p-[8px] rounded-[4px] border border-border inline-block">{h.note}</p>}
                      </div>
                      <span className="text-[11px] text-muted font-medium shrink-0 pt-[2px]">
                        {new Date(h.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Bottom */}
        <div className="flex flex-col sm:flex-row gap-[12px] pt-[8px]">
          <Link to="/dashboard" className="btn-ghost flex-1 py-[14px] text-center text-[13px] font-bold border border-border bg-white hover:border-text hover:text-text">
            ← Back to Dashboard
          </Link>
          <button
            onClick={() => {
              const number = import.meta.env.VITE_WHATSAPP_NUMBER || '14155238886';
              window.open(`https://wa.me/${number}?text=STATUS%20${complaint.tracking_id}`, '_blank');
            }}
            className="flex-1 py-[14px] text-[13px] font-bold flex items-center justify-center gap-[8px] bg-[#25D366] hover:bg-[#20bd5a] text-white border-none rounded-[5px] transition-colors cursor-pointer shadow-[0_2px_8px_rgba(37,211,102,0.2)]"
          >
            <Smartphone className="w-4 h-4" /> Receive WhatsApp Updates
          </button>
        </div>

        <p className="text-center text-[11px] text-muted font-medium flex items-center justify-center gap-[6px] mt-[4px]">
          <span className="w-[8px] h-[8px] rounded-full bg-green animate-pulse inline-block"></span>
          Page updates dynamically in real-time. Share URL to let others track.
        </p>

      </div>
    </div>
  );
}
