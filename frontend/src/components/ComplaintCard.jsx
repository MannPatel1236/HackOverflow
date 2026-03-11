import { Link } from 'react-router-dom';

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
    <div className={`card p-[16px] flex flex-col md:flex-row md:items-center justify-between gap-[16px] transition-all duration-200 ${
      complaint.sla_breach ? 'border-burg bg-burg-bg/50' : 'hover:border-burg hover:shadow-[0_4px_16px_rgba(139,26,26,0.06)]'
    }`}>
      
      <div className="flex items-start gap-[14px] flex-1 min-w-0">
        <div className="w-[44px] h-[44px] rounded-[6px] bg-cream border border-border flex items-center justify-center text-[22px] shrink-0 shadow-sm">
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
                   ⚠️ Breach
                </span>
             )}
          </div>
          <h3 className="text-[14px] font-bold text-text truncate mb-[4px]">
             {complaint.summary_en || 'Complaint Summary Pending'}
          </h3>
          <div className="flex items-center gap-[12px] text-[11px] text-muted font-medium">
             <span className="flex items-center gap-1">🏢 {complaint.department}</span>
             {complaint.district && <span className="flex items-center gap-1">📍 {complaint.district}, {complaint.state}</span>}
             <span className="flex items-center gap-1">🕒 {filed}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-[12px] shrink-0 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t border-border md:border-t-0">
         <Link
            to={`/track/${complaint.tracking_id}`}
            className="flex-1 md:flex-none text-center text-[12px] font-bold text-text bg-cream hover:bg-off border border-border rounded-[5px] px-[14px] py-[8px] transition-colors"
          >
            Track Details ↗
         </Link>
         {showActions && onStatusChange && (
            <div className="flex-1 md:flex-none">
              <StatusDropdown
                current={complaint.status}
                onChange={(status) => onStatusChange(complaint._id, status)}
              />
            </div>
         )}
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
      className="w-full text-[12px] font-semibold bg-white border border-border text-text rounded-[5px] px-[10px] py-[8px] focus:outline-none focus:border-burg cursor-pointer appearance-none shadow-sm"
      style={{
        backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%228%22%20viewBox%3D%220%200%2012%208%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M1.41%200.589966L6%205.16997L10.59%200.589966L12%201.99997L6%207.99997L0%201.99997L1.41%200.589966Z%22%20fill%3D%22%231A1A1A%22%2F%3E%3C%2Fsvg%3E")',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        backgroundSize: '10px'
      }}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
