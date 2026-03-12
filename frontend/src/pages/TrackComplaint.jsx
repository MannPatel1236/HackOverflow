import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import StatusTimeline from '../components/StatusTimeline';
import { trackComplaint } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  MapPin, 
  Building, 
  Zap, 
  Smartphone, 
  Globe, 
  Shield, 
  ChevronLeft, 
  Clock,
  ArrowRight,
  AlertTriangle,
  FileText,
  Activity,
  History
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_STYLES = {
  urgent: 'bg-burg/5 text-burg border-burg/10',
  high: 'bg-orange-50 text-orange-600 border-orange-100',
  medium: 'bg-blue-50 text-blue-600 border-blue-100',
  low: 'bg-green-50 text-green-600 border-green-100',
};

export default function TrackComplaint() {
  const { trackingId } = useParams();
  const { admin } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const dashboardLink = admin ? '/admin' : '/dashboard';

  const fetchComplaint = async () => {
    try {
      const res = await trackComplaint(trackingId);
      setComplaint(res.data.complaint);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.response?.status === 404 ? 'GRIEVANCE_NOT_FOUND' : 'UPLINK_ERROR');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
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
    const interval = setInterval(fetchComplaint, 30000);
    return () => { socket.disconnect(); clearInterval(interval); };
  }, [trackingId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-12">
        <div className="w-1.5 h-12 bg-burg rounded-full animate-pulse mb-8" />
        <p className="text-xs font-black text-navy uppercase tracking-[0.3em] animate-pulse">Syncing Neural Link...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white border border-border rounded-3xl p-12 text-center"
          >
            <div className="w-20 h-20 bg-off rounded-full flex items-center justify-center text-navy mx-auto mb-8 border border-border">
              <Search size={32} />
            </div>
            <h2 className="text-3xl font-extrabold text-navy tracking-tight uppercase mb-4">{error}</h2>
            <p className="text-muted text-sm font-bold uppercase tracking-widest leading-relaxed mb-12">
              We were unable to establish a secure link with the provided tracking signature.
            </p>
            <Link to={dashboardLink} className="btn-primary w-full py-5">
               Return to Sector Control
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-16 w-full flex flex-col gap-12">
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-1.5 h-8 bg-burg rounded-full" />
                 <h1 className="text-3xl font-black text-navy uppercase tracking-tight">Case Telemetry</h1>
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                 <span className="font-mono text-xl font-bold text-navy bg-white px-4 py-2 rounded-xl border border-border shadow-sm tracking-tight inline-block">
                    {complaint.tracking_id}
                 </span>
                 <div className="flex items-center gap-2 text-xs font-bold text-dim uppercase tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live Sync Active
                 </div>
              </div>
           </div>
           
           <div className="flex flex-col items-end gap-2 text-right">
              <p className="text-[10px] font-black text-dim uppercase tracking-widest">Last Synced Status</p>
              <p className="text-xs font-bold text-navy">{lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
           </div>
        </section>

        {complaint.sla_breach && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-burg border border-burg/10 rounded-2xl flex items-center gap-6 text-white shadow-xl shadow-burg/20"
          >
             <AlertTriangle size={32} className="shrink-0" />
             <div>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-1">Sector Breach Escalation</h4>
                <p className="text-white/80 text-[11px] font-bold uppercase tracking-wide leading-relaxed">
                   This case has exceeded regional SLA parameters. Automated federal intervention protocol initiated.
                </p>
             </div>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-12">
           <div className="lg:col-span-2 space-y-12">
              {/* Summary Card */}
              <div className="card-premium p-10 bg-white">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-2">
                       <FileText size={14} className="text-burg" /> Case Narrative
                    </h3>
                    <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border ${SEVERITY_STYLES[complaint.severity.toLowerCase()] || 'border-border'}`}>
                       {complaint.severity}
                    </div>
                 </div>
                 <p className="text-xl font-extrabold text-navy tracking-tight leading-relaxed mb-12">
                    {complaint.summary_en}
                 </p>
                 <div className="grid sm:grid-cols-2 gap-8 border-t border-border pt-10">
                    <div>
                       <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-3">Department</p>
                       <p className="text-base font-extrabold text-navy uppercase">{complaint.department}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-3">Registered Location</p>
                       <p className="text-base font-extrabold text-navy">{[complaint.district, complaint.state].filter(Boolean).join(', ')}</p>
                    </div>
                 </div>
              </div>

              {/* Status Timeline */}
              <div className="card-premium p-10 bg-white">
                 <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em] mb-12 flex items-center gap-2">
                    <Activity size={14} className="text-burg" /> Resolution Lifecycle
                 </h3>
                 <StatusTimeline status={complaint.status} statusHistory={complaint.status_history} />
              </div>

              {/* Activity Log */}
              <div className="space-y-8">
                 <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-2 px-2">
                    <History size={14} className="text-burg" /> Audit Log
                 </h3>
                 <div className="space-y-6">
                    {complaint.status_history?.slice().reverse().map((h, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="card-premium p-6 bg-white/50 border-border group hover:bg-white transition-colors"
                      >
                         <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                               <div className="flex items-center gap-3 mb-3">
                                  <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-burg animate-pulse' : 'bg-dim'}`} />
                                  <p className="text-sm font-black text-navy uppercase tracking-widest">{h.status}</p>
                               </div>
                               {h.note && (
                                 <p className="text-xs font-bold text-muted uppercase tracking-wide leading-relaxed bg-off p-4 rounded-xl border border-border italic mb-2">
                                    "{h.note}"
                                 </p>
                               )}
                            </div>
                            <p className="text-[10px] font-black text-dim uppercase tracking-widest whitespace-nowrap pt-1">
                               {new Date(h.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                         </div>
                      </motion.div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Sidebar Actions */}
           <div className="space-y-12">
              <div>
                 <h4 className="text-[10px] font-black text-burg uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <Zap size={14} /> Link Protocol
                 </h4>
                 <div className="flex flex-col gap-4">
                    <button 
                      onClick={() => {
                        const number = import.meta.env.VITE_WHATSAPP_NUMBER || '14155238886';
                        window.open(`https://wa.me/${number}?text=STATUS%20${complaint.tracking_id}`, '_blank');
                      }}
                      className="w-full py-5 bg-[#25D366] text-white rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-lg shadow-green-500/20"
                    >
                       <Smartphone size={18} /> WhatsApp Direct Link
                    </button>
                    <Link to={dashboardLink} className="btn-secondary w-full py-5">
                       <ChevronLeft size={18} /> Sector Dashboard
                    </Link>
                 </div>
              </div>

              <div className="card-premium p-8 border-none bg-navy text-white overflow-hidden relative group">
                 <div className="absolute top-0 right-0 p-4 text-white/5 group-hover:scale-125 transition-transform duration-700"><Shield size={100} /></div>
                 <h4 className="text-[10px] font-black text-burg uppercase tracking-[0.2em] mb-4 relative z-10">Administrative Control</h4>
                 <p className="text-xs font-bold text-white/60 uppercase tracking-widest leading-relaxed mb-8 relative z-10">
                    Authorized regional administrators can verify PII-narratives and environmental geotags within the command center.
                 </p>
                 <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-[0.3em] relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> E2EE Active
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
