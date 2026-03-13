import { useState } from 'react';
import { Link } from 'react-router-dom';

// ── Inline SVG Icons ──────────────────────────────────────────────────────
const Icons = {
  Roads: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l3-10h12l3 10" /><line x1="9" y1="17" x2="9" y2="7" /><line x1="15" y1="17" x2="15" y2="7" />
    </svg>
  ),
  Sanitation: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
    </svg>
  ),
  Water: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6 9 4 13 4 16a8 8 0 0016 0c0-3-2-7-8-14z" />
    </svg>
  ),
  Electricity: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Other: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  MapPin: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Clock: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Building: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
    </svg>
  ),
  Alert: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Check: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

const SEVERITY_STYLES = {
  Critical: 'bg-burg-bg text-burg border-burg/20',
  High: 'bg-amber-bg text-amber border-amber/20',
  Medium: 'bg-blue-50 text-blue-600 border-blue-200',
  Low: 'bg-green-bg text-green border-green/20',
};

const STATUS_STYLES = {
  Registered: 'bg-dim/10 text-muted border-dim/20',
  'Under Review': 'bg-amber-bg text-amber border-amber/20',
  'In Progress': 'bg-blue-50 text-blue-600 border-blue-200',
  Resolved: 'bg-green-bg text-green border-green/20',
};

const STATUSES = ['Registered', 'Under Review', 'In Progress', 'Resolved'];

export default function ComplaintCard({ complaint, showActions, onStatusChange, onTaskCreate, onDelete }) {
  const deptIcon = Icons[complaint.department] || Icons.Other;
  const filed = new Date(complaint.filed_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const images = complaint.images?.filter(img => img?.url) || [];

  return (
    <>
      <div className={`card p-[16px] flex flex-col md:flex-row md:items-center justify-between gap-[16px] transition-all duration-200 ${complaint.sla_breach ? 'border-burg bg-burg-bg/50' : 'hover:border-burg hover:shadow-[0_4px_16px_rgba(139,26,26,0.06)]'
        }`}>

        <div className="flex items-start gap-[14px] flex-1 min-w-0">
          <div className="w-[44px] h-[44px] rounded-[6px] bg-cream border border-border flex items-center justify-center shrink-0 shadow-sm text-muted">
            {deptIcon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-[8px] mb-[6px] flex-wrap">
              <span className="font-mono text-[11px] font-bold text-text bg-off px-2 py-0.5 rounded-[4px] border border-border">
                {complaint.tracking_id}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded-[3px] border ${SEVERITY_STYLES[complaint.severity] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {complaint.severity}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded-[3px] border ${STATUS_STYLES[complaint.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {complaint.status}
              </span>
              {complaint.sla_breach && (
                <span className="ml-auto md:ml-0 text-[10px] font-bold text-white bg-burg px-[6px] py-[2px] rounded-[3px] uppercase tracking-wider flex items-center gap-1">
                  <span className="text-white">{Icons.Alert}</span> Breach
                </span>
              )}
              {complaint.duplicate_count > 0 && (
                <span className="ml-auto md:ml-0 text-[10px] font-bold text-white bg-navy px-[6px] py-[2px] rounded-[3px] uppercase tracking-wider flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Grouped (+{complaint.duplicate_count})
                </span>
              )}
            </div>
            <h3 className="text-[14px] font-bold text-text line-clamp-2 leading-snug mb-[4px]" title={complaint.summary_en}>
              {complaint.summary_en || 'Complaint Summary Pending'}
            </h3>
            <div className="flex items-center gap-[12px] text-[11px] text-muted font-medium">
              <span className="flex items-center gap-1">{Icons.Building} {complaint.department}</span>
              {complaint.district && <span className="flex items-center gap-1">{Icons.MapPin} {complaint.district}, {complaint.state}</span>}
              <span className="flex items-center gap-1">{Icons.Clock} {filed}</span>
            </div>

            {/* ── Photo Strip ────────────────────────────────────────────── */}
            {images.length > 0 && (
              <div className="flex items-center gap-[6px] mt-[10px] flex-wrap">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLightboxUrl(img.url)}
                    className="w-[52px] h-[52px] rounded-[5px] overflow-hidden border border-border shadow-sm hover:border-burg hover:scale-105 transition-all duration-150 shrink-0 bg-cream cursor-pointer"
                    title={img.lat ? `📍 ${Number(img.lat).toFixed(4)}, ${Number(img.lng).toFixed(4)}` : 'View photo'}
                  >
                    <img
                      src={img.url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </button>
                ))}
                <span className="text-[10px] text-muted font-medium ml-1">
                  {images.length} photo{images.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-[10px] shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-border md:border-t-0">
          <Link
            to={`/track/${complaint.tracking_id}`}
            className="text-center text-[12px] font-bold text-text bg-cream hover:bg-off border border-border rounded-[5px] px-[14px] py-[8px] transition-colors"
          >
            Track Details ↗
          </Link>
          {showActions && typeof onTaskCreate === 'function' && (
            <button
              onClick={() => onTaskCreate(complaint)}
              className="text-center text-[12px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-[5px] px-[14px] py-[8px] transition-colors"
            >
              + Create Partner Task
            </button>
          )}
          {showActions && onStatusChange && (
            <StageChanger
              complaintId={complaint._id}
              current={complaint.status}
              onStatusChange={onStatusChange}
            />
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                if (window.confirm('Are you sure you want to delete this complaint? This cannot be undone.')) {
                  onDelete(complaint._id || complaint.tracking_id);
                }
              }}
              className="text-center text-[12px] font-bold text-burg bg-burg-bg hover:bg-burg-bg/80 border border-burg/20 rounded-[5px] px-[14px] py-[8px] transition-colors"
            >
              Delete Complaint
            </button>
          )}
        </div>

        {/* ── Lightbox Modal ───────────────────────────────────────────────── */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={e => e.stopPropagation()}>
              <img
                src={lightboxUrl}
                alt="Complaint photo"
                className="w-full h-auto max-h-[85vh] object-contain rounded-[8px] shadow-2xl"
              />
              <button
                onClick={() => setLightboxUrl(null)}
                className="absolute top-[-16px] right-[-16px] w-[32px] h-[32px] bg-white rounded-full flex items-center justify-center shadow-lg text-text font-bold text-[16px] hover:bg-burg hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StageChanger({ complaintId, current, onStatusChange }) {
  const [pendingStage, setPendingStage] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null); // {type: 'success' | 'error', msg: '' }

  const currentIdx = STATUSES.indexOf(current);

  const handleConfirm = async () => {
    if (!pendingStage) return;
      setLoading(true);
      setToast(null);
      try {
        await onStatusChange(complaintId, pendingStage, note);
      setToast({type: 'success', msg: 'Updated ✓' });
      setPendingStage(null);
      setNote('');
      setTimeout(() => setToast(null), 3000);
    } catch {
        setToast({ type: 'error', msg: 'Failed ✗' });
      setTimeout(() => setToast(null), 3000);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-[8px]">
      {/* Stage buttons row */}
      <div className="flex items-center gap-[2px]">
          {STATUSES.map((status, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = status === current;
            const isPending = status === pendingStage;

            return (
              <button
                key={status}
                onClick={() => {
                  if (status !== current) {
                    setPendingStage(pendingStage === status ? null : status);
                    setNote('');
                  }
                }}
                disabled={loading}
                className={`flex-1 py-[6px] px-[4px] text-[9px] font-bold uppercase tracking-wider rounded-[4px] border transition-all duration-200 cursor-pointer flex items-center justify-center gap-[3px] ${isPending
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.03]'
                  : isCurrent
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm'
                    : isCompleted
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-off text-muted border-border hover:border-indigo-300 hover:text-indigo-600'
                  } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
                title={status}
              >
                {isCompleted && <span className="text-green-600">{Icons.Check}</span>}
                {status.split(' ').map(w => w[0]).join('')}
              </button>
            );
          })}
        </div>

        {/* Notes + Confirm panel */}
        {pendingStage && (
          <div className="animate-fade-in space-y-[6px]">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Note for "${pendingStage}" (optional)`}
              className="w-full text-[11px] px-[10px] py-[6px] border border-border rounded-[4px] bg-white focus:outline-none focus:border-indigo-400 font-medium"
            />
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full py-[6px] text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-[4px] border-none cursor-pointer transition-colors flex items-center justify-center gap-[6px]"
            >
              {loading ? (
                <div className="w-[14px] h-[14px] border-[2px] border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                `Confirm → ${pendingStage}`
              )}
            </button>
          </div>
        )}

        {/* Toast notification */}
        {toast && (
          <div className={`text-[11px] font-bold px-[10px] py-[5px] rounded-[4px] text-center animate-fade-in ${
            toast.type === 'success' ? 'bg-green-bg text-green border border-green/20' : 'bg-burg-bg text-burg border border-burg/20'
          }`}>
            {toast.msg}
          </div>
        )}
      </div>
  );
}
