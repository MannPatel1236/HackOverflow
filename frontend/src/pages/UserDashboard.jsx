import { motion } from 'framer-motion';
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Shield,
  Zap,
  Activity,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import { getComplaints } from '../utils/api';
import ComplaintCard from '../components/ComplaintCard';

export default function UserDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await getComplaints();
        setComplaints(data);
      } catch (err) {
        console.error('FAILED_TO_SYNC_DATA:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const stats = [
    { label: 'Total Logs', value: complaints.length, icon: FileText, color: 'text-navy', bg: 'bg-navy/5' },
    { label: 'In Progress', value: complaints.filter(c => c.status === 'in_progress').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Resolved', value: complaints.filter(c => c.status === 'resolved').length, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Critical', value: complaints.filter(c => c.severity === 'urgent').length, icon: AlertCircle, color: 'text-burg', bg: 'bg-burg/5' },
  ];

  return (
    <div className="min-h-screen bg-cream selection:bg-burg/10">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        {/* Header Section */}
        <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-8 bg-burg rounded-full" />
              <h1 className="text-4xl lg:text-5xl font-extrabold text-navy tracking-tight uppercase">User Dashboard</h1>
            </div>
            <p className="text-lg text-muted max-w-xl">
              Citizen Uplink: Active. Synchronized data with regional and federal servers.
            </p>
          </div>
          <Link to="/file-complaint" className="btn-primary py-4 px-8 shadow-lg group">
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> 
            Report Governance Issue
          </Link>
        </section>

        {/* Stats Grid - Bento Style */}
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((s, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={s.label}
              className="bg-white border border-border p-8 rounded-2xl hover:shadow-md transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} mb-6 transition-transform group-hover:scale-110`}>
                <s.icon size={24} />
              </div>
              <p className="text-xs font-bold text-dim uppercase tracking-widest mb-1">{s.label}</p>
              <p className="text-4xl font-extrabold text-navy tracking-tight">{s.value}</p>
            </motion.div>
          ))}
        </section>

        {/* Main Content Area */}
        <section className="grid lg:grid-cols-3 gap-12">
          {/* Recent Grievances */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between mb-2">
               <h2 className="text-2xl font-extrabold text-navy tracking-tight">Recent Activity Log</h2>
               <div className="h-px flex-1 bg-border mx-8" />
               <span className="text-xs font-bold text-dim uppercase tracking-widest">Index: {complaints.length}</span>
            </div>

            {loading ? (
              <div className="space-y-4">
                 {[1, 2, 3].map(n => (
                   <div key={n} className="h-48 w-full bg-off animate-pulse rounded-2xl border border-border" />
                 ))}
              </div>
            ) : complaints.length > 0 ? (
              <div className="space-y-6">
                {complaints.map((c, i) => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={c._id}
                  >
                    <ComplaintCard complaint={c} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="card-premium flex flex-col items-center justify-center py-24 text-center">
                 <div className="w-16 h-16 rounded-full bg-off flex items-center justify-center text-dim mb-6">
                   <FileText size={32} />
                 </div>
                 <h3 className="text-xl font-extrabold text-navy mb-2 tracking-tight">System Empty</h3>
                 <p className="text-muted max-w-sm mb-8">No grievance logs detected in your regional account. Start a new uplink to report an issue.</p>
                 <Link to="/file-complaint" className="btn-secondary">Initialize First Log</Link>
              </div>
            )}
          </div>

          {/* Side Panels */}
          <div className="space-y-12">
            <div>
              <h3 className="text-xs font-bold text-burg uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <Shield size={14} /> Security Protocol
              </h3>
              <div className="bg-white border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
                 <div className="absolute top-0 right-0 p-4 text-burg/5 rotate-12"><LockIcon size={80} /></div>
                 <p className="text-sm font-bold text-navy mb-4 relative z-10">Data Integrity Active</p>
                 <p className="text-xs text-muted leading-relaxed relative z-10">
                   Your grievance logs are protected via RSA-2048 encryption and regional sharding. All changes are immutable and audit-trailed.
                 </p>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-navy uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                <Activity size={14} /> Regional Status
              </h3>
              <div className="space-y-4">
                 <StatusItem label="Neural Engine" status="Optimal" />
                 <StatusItem label="Dept. Routing" status="Synchronized" />
                 <StatusItem label="Federal Link" status="Connected" />
              </div>
            </div>

            <div className="card-premium bg-burg p-8 group overflow-hidden border-none text-white shadow-xl shadow-burg/20">
               <div className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-125 transition-transform duration-700">
                 <Zap size={140} />
               </div>
               <h3 className="text-xl font-extrabold text-white mb-2 relative z-10 tracking-tight leading-tight">Emergency <br /> Response Protocol</h3>
               <p className="text-white/60 text-sm mb-8 relative z-10">Instant escalation to State Executive Office for critical public safety issues.</p>
               <button className="w-full py-4 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-extrabold tracking-widest relative z-10 transition-all border border-white/10 uppercase">Activate SOS</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusItem({ label, status }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-border rounded-xl shadow-sm">
      <span className="text-xs font-bold text-dim uppercase tracking-wider">{label}</span>
      <span className="text-[10px] font-black text-green-600 uppercase flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> {status}
      </span>
    </div>
  );
}

function LockIcon({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
