import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ComplaintCard from '../components/ComplaintCard';
import { useAuth } from '../context/AuthContext';
import { getMyComplaints } from '../utils/api';
import { Smartphone, ClipboardList, CheckCircle, Clock, Inbox } from 'lucide-react';

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
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row w-full max-w-[1240px] mx-auto px-[22px] py-[28px] gap-[24px]">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-[24px]">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold tracking-[3px] uppercase text-burg mb-2 flex items-center gap-[10px] before:content-[''] before:w-6 before:h-[2px] before:bg-burg">
                 Citizen Portal
              </div>
              <h1 className="font-serif text-[28px] font-bold text-text mb-1">
                Welcome back{user?.name ? `, ${user.name}` : ''}
              </h1>
              <p className="text-[13px] text-muted">{user?.phone || 'No phone number provided'}</p>
            </div>
            <div className="flex gap-[10px] shrink-0">
              <button onClick={openWhatsApp} className="bg-[#25D366] hover:bg-[#20bd5a] text-white border-none rounded-[5px] px-[14px] py-[8px] text-[12px] font-semibold flex items-center gap-[6px] transition-colors cursor-pointer shadow-[0_2px_8px_rgba(37,211,102,0.2)]">
                <Smartphone className="w-4 h-4 mr-2" /> File on WhatsApp
              </button>
              <Link to="/file-complaint" className="btn-primary text-[12px] px-[14px] py-[8px] shadow-[0_2px_8px_rgba(139,26,26,0.2)]">
                + File Complaint
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="card p-[22px]">
            <h2 className="text-[14px] font-bold text-text mb-[16px]">Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-[16px]">
              
              <div className="flex flex-col gap-1 p-3 border border-border rounded-[6px] bg-white">
                <div className="flex justify-between items-center mb-1">
                   <div className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Filed</div>
                   <ClipboardList className="opacity-50 w-4 h-4" />
                </div>
                <div className="font-serif text-[28px] font-black text-burg leading-none">{stats.total}</div>
                <div className="text-[10px] text-muted">All active complaints</div>
              </div>

              <div className="flex flex-col gap-1 p-3 border border-border rounded-[6px] bg-green-bg">
                <div className="flex justify-between items-center mb-1">
                   <div className="text-[11px] font-bold text-green uppercase tracking-wider">Resolved</div>
                   <CheckCircle className="opacity-50 w-4 h-4" />
                </div>
                <div className="font-serif text-[28px] font-black text-green leading-none">{stats.resolved}</div>
                <div className="text-[10px] text-green/70">Successfully closed</div>
              </div>

              <div className="flex flex-col gap-1 p-3 border border-border rounded-[6px] bg-amber-bg">
                <div className="flex justify-between items-center mb-1">
                   <div className="text-[11px] font-bold text-amber uppercase tracking-wider">Pending</div>
                   <Clock className="opacity-50 w-4 h-4" />
                </div>
                <div className="font-serif text-[28px] font-black text-amber leading-none">{stats.pending}</div>
                <div className="text-[10px] text-amber/70">Awaiting action</div>
              </div>

              <div className="flex flex-col gap-1 p-3 border border-burg/20 rounded-[6px] bg-burg-bg">
                <div className="flex justify-between items-center mb-1">
                   <div className="text-[11px] font-bold text-burg uppercase tracking-wider">SLA Breach</div>
                   <div className="opacity-50 text-[14px]">⚠️</div>
                </div>
                <div className="font-serif text-[28px] font-black text-burg leading-none">{stats.breach}</div>
                <div className="text-[10px] text-burg/70">Overdue response</div>
              </div>

            </div>
          </div>

          {/* Track Quick Search */}
          <div className="card p-[22px]">
             <TrackQuickSearch />
          </div>

          {/* Complaints List */}
          <div>
            <div className="flex items-center justify-between mb-[16px]">
               <h2 className="text-[16px] font-bold text-text">Your Recent Complaints</h2>
            </div>
            {loading ? (
              <div className="flex flex-col gap-[12px]">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card p-[20px] h-[100px] animate-pulse bg-gray-100 border-border" />
                ))}
              </div>
            ) : complaints.length === 0 ? (
              <div className="card p-[40px] flex flex-col items-center justify-center text-center border-dashed border-2 border-border/60 bg-white/50">
                <div className="w-[60px] h-[60px] rounded-full bg-cream border border-border flex items-center justify-center text-[28px] mb-[16px] shadow-sm">
                  <Inbox className="w-8 h-8 mb-[12px] opacity-60" />
                </div>
                <h3 className="text-[16px] font-bold text-text mb-[6px]">No complaints filed yet</h3>
                <p className="text-[13px] text-muted mb-[20px] max-w-[300px]">
                  Use the platform to report civic issues in your area. You can track their status here.
                </p>
                <Link to="/file-complaint" className="btn-primary">
                  File First Complaint
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-[12px]">
                {complaints.map((c) => (
                  <ComplaintCard key={c._id || c.tracking_id} complaint={c} />
                ))}
              </div>
            )}
          </div>
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
    <div className="flex flex-col sm:flex-row sm:items-end gap-[14px]">
      <div className="flex-1">
        <label className="block text-[11px] font-bold text-text uppercase tracking-wider mb-[6px]">Track a Specific Complaint</label>
        <div className="flex">
           <input
             type="text"
             value={id}
             onChange={(e) => setId(e.target.value)}
             placeholder="CIV-ABC-123"
             className="input font-mono rounded-r-none border-r-0 tracking-wider text-[13px]"
             onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
           />
           <button onClick={handleTrack} className="bg-text text-white px-[18px] font-bold text-[12px] border border-text rounded-r-[5px] hover:bg-black transition-colors shrink-0">
             Track ↗
           </button>
        </div>
      </div>
      <div>
         <p className="text-[11px] text-muted max-w-[200px]">Enter the unique tracking ID provided when you filed the complaint.</p>
      </div>
    </div>
  );
}
