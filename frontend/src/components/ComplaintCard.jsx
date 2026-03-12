import { motion } from 'framer-motion';
import { 
  Shield, 
  MapPin, 
  Clock, 
  Building, 
  AlertTriangle, 
  CheckCircle2, 
  MoreVertical,
  ArrowUpRight,
  Droplets,
  Zap,
  Trash2,
  HardHat,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const DEPT_ICONS = {
  Roads: <HardHat size={18} />,
  Sanitation: <Trash2 size={18} />,
  Water: <Droplets size={18} />,
  Electricity: <Zap size={18} />,
  Other: <FileText size={18} />,
};

const SEVERITY_STYLES = {
  urgent: 'bg-burg/5 text-burg border-burg/10',
  high: 'bg-orange-50 text-orange-600 border-orange-100',
  medium: 'bg-blue-50 text-blue-600 border-blue-100',
  low: 'bg-green-50 text-green-600 border-green-100',
};

const STATUS_CONFIG = {
  registered: { label: 'Registered', color: 'text-dim', bg: 'bg-off' },
  under_review: { label: 'Under Review', color: 'text-orange-600', bg: 'bg-orange-50' },
  in_progress: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-50' },
  resolved: { label: 'Resolved', color: 'text-green-600', bg: 'bg-green-50' },
};

export default function ComplaintCard({ complaint, showActions, onStatusChange }) {
  const filedDate = new Date(complaint.filed_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  const status = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.registered;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`card-premium relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-8 ${
        complaint.sla_breach ? 'border-burg/30 ring-1 ring-burg/5' : ''
      }`}
    >
      {/* SLA Breach Indicator */}
      {complaint.sla_breach && (
        <div className="absolute top-0 left-0 w-full h-[3px] bg-burg animate-pulse" />
      )}

      <div className="flex items-start gap-6 flex-1 min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-off border border-border flex items-center justify-center text-navy shrink-0 shadow-sm group-hover:bg-navy group-hover:text-white transition-colors duration-300">
          {DEPT_ICONS[complaint.department] || DEPT_ICONS.Other}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-md bg-navy text-white">
              {complaint.tracking_id}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${SEVERITY_STYLES[complaint.severity] || ''}`}>
              {complaint.severity}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md ${status.bg} ${status.color}`}>
              {status.label}
            </span>
            {complaint.sla_breach && (
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-burg text-white">
                <AlertTriangle size={12} strokeWidth={3} /> Breach
              </span>
            )}
          </div>

          <h3 className="text-lg font-extrabold text-navy tracking-tight mb-3 line-clamp-1 group-hover:text-burg transition-colors">
            {complaint.summary_en || 'Metadata Synchronizing...'}
          </h3>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-dim uppercase tracking-wider">
            <span className="flex items-center gap-2"><Building size={14} className="text-navy/30" /> {complaint.department}</span>
            <span className="flex items-center gap-2"><MapPin size={14} className="text-navy/30" /> {complaint.district}, {complaint.state}</span>
            <span className="flex items-center gap-2"><Clock size={14} className="text-navy/30" /> {filedDate}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 pt-6 md:pt-0 border-t md:border-t-0 border-border">
        <Link 
          to={`/track/${complaint.tracking_id}`}
          className="btn-secondary py-3 px-6 text-xs font-black tracking-widest uppercase flex-1 whitespace-nowrap"
        >
          Track Uplink <ArrowUpRight size={14} />
        </Link>
        {showActions && (
          <button className="p-3 rounded-2xl bg-off border border-border text-navy hover:bg-white hover:shadow-sm transition-all">
            <MoreVertical size={20} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
