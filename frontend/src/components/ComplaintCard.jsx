import { Link } from 'react-router-dom';

const SEVERITY_STYLES = {
  Critical: 'badge-critical',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
};

const STATUS_STYLES = {
  Registered: 'status-registered',
  'Under Review': 'status-review',
  'In Progress': 'status-progress',
  Resolved: 'status-resolved',
};

const DEPT_ICONS = {
  Roads: '🛣️',
  Sanitation: '🗑️',
  Water: '💧',
  Electricity: '⚡',
  Other: '📋',
};

export default function ComplaintCard({ complaint, showActions, onStatusChange }) {
  const deptIcon = DEPT_ICONS[complaint.department] || '📋';
  const filed = new Date(complaint.filed_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className={`card p-4 hover:border-slate-700 transition-all duration-200 ${
      complaint.sla_breach ? 'border-red-500/30 bg-red-500/5' : ''
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">
            {deptIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs text-indigo-400 font-medium">
                {complaint.tracking_id}
              </span>
              <span className={SEVERITY_STYLES[complaint.severity] || 'badge'}>
                {complaint.severity}
              </span>
              <span className={STATUS_STYLES[complaint.status] || 'badge'}>
                {complaint.status}
              </span>
              {complaint.sla_breach && (
                <span className="badge bg-red-500/20 text-red-400 border border-red-500/30">
                  ⚠️ SLA Breach
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 truncate">{complaint.summary_en}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
              <span>{complaint.department}</span>
              {complaint.district && <span>📍 {complaint.district}, {complaint.state}</span>}
              <span>{filed}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/track/${complaint.tracking_id}`}
            className="text-xs text-indigo-400 hover:text-indigo-300 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
          >
            Track
          </Link>
          {showActions && onStatusChange && (
            <StatusDropdown
              current={complaint.status}
              onChange={(status) => onStatusChange(complaint._id, status)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatusDropdown({ current, onChange }) {
  const statuses = ['Registered', 'Under Review', 'In Progress', 'Resolved'];
  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      className="text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
