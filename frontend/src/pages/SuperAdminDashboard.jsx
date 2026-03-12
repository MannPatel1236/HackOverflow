import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Navbar from '../components/Navbar';
import { getNationalStats, getLeaderboard, createAdmin, listAdmins, deleteAdmin, getTasks, createTask, approveTaskApplication, getComplaints, updateComplaintStatus } from '../utils/api';

// ── Inline SVG Icons ──────────────────────────────────────────────────────
const SvgIcons = {
  globe: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
  clipboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  clock: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  alert: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  map: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  award: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  roads: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l3-10h12l3 10"/><line x1="9" y1="17" x2="9" y2="7"/><line x1="15" y1="17" x2="15" y2="7"/>
    </svg>
  ),
  sanitation: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
    </svg>
  ),
  water: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6 9 4 13 4 16a8 8 0 0016 0c0-3-2-7-8-14z"/>
    </svg>
  ),
  electricity: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  pin: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  trash: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
    </svg>
  ),
};

const DEPT_ICONS = { Roads: SvgIcons.roads, Sanitation: SvgIcons.sanitation, Water: SvgIcons.water, Electricity: SvgIcons.electricity, Other: SvgIcons.clipboard };

const SCORE_COLOR = (score) =>
  score >= 70 ? 'text-green font-bold' : score >= 50 ? 'text-amber font-bold' : 'text-burg font-bold';

const SCORE_BADGE = (rating) => ({
  Excellent: 'text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded border inline-block bg-green-bg text-green border-green/20',
  Average: 'text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded border inline-block bg-amber-bg text-amber border-amber/20',
  Poor: 'text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded border inline-block bg-burg-bg text-burg border-burg/20',
}[rating] || 'text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded border inline-block bg-off text-muted border-border');

const RANK_MEDAL = (i) => {
  const colors = ['text-amber', 'text-gray-400', 'text-amber-700'];
  if (i < 3) return <span className={colors[i]}>{SvgIcons.award}</span>;
  return <span className="text-[14px] text-muted font-bold font-mono">#{i + 1}</span>;
};

const INDIA_CENTER = [22.5937, 82.9629];

// Density-based coloring
function getDensityColor(count) {
  if (count >= 31) return '#ef4444';
  if (count >= 16) return '#f97316';
  if (count >= 6) return '#eab308';
  return '#22c55e';
}

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [nationalStats, setNationalStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'state_admin', state: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState('');
  
  // Tasks State
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', budget_estimate: '', complaintId: null });

  // Complaints State
  const [complaints, setComplaints] = useState([]);
  const [complaintPagination, setComplaintPagination] = useState({});
  const [complaintFilters, setComplaintFilters] = useState({ state: '', department: '', status: '', page: 1 });
  const [complaintLoading, setComplaintLoading] = useState(false);

  const intervalRef = useRef(null);

  useEffect(() => {
    fetchAll();

    // Auto-refresh every 60 seconds
    intervalRef.current = setInterval(() => {
      fetchAll();
    }, 60000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, lbRes, adminRes, tasksRes] = await Promise.all([
        getNationalStats(),
        getLeaderboard(),
        listAdmins(),
        getTasks()
      ]);
      setNationalStats(statsRes.data);
      setLeaderboard(lbRes.data.leaderboard);
      setAdmins(adminRes.data.admins);
      setTasks(tasksRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password || !newAdmin.role) {
      return setCreateMsg('All fields required');
    }
    if (newAdmin.role === 'state_admin' && !newAdmin.state) {
        return setCreateMsg('State is required for State Admin role');
    }
    setCreateLoading(true);
    setCreateMsg('');
    try {
      await createAdmin(newAdmin);
      setCreateMsg('Admin profile securely provisioned.');
      setNewAdmin({ name: '', email: '', password: '', role: 'state_admin', state: '' });
      fetchAll();
      setTimeout(() => setCreateMsg(''), 4000);
    } catch (e) {
      setCreateMsg(e.response?.data?.error || 'Authorization protocol failed.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Revoke access for this administrative profile?')) return;
    await deleteAdmin(id);
    fetchAll();
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTask({ complaint_id: taskForm.complaintId, title: taskForm.title, description: taskForm.description, budget_estimate: Number(taskForm.budget_estimate) });
      setShowTaskModal(false);
      alert('Partner Task Created Successfully!');
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const fetchComplaints = async (filters) => {
    setComplaintLoading(true);
    try {
      const res = await getComplaints({ ...filters, limit: 20 });
      setComplaints(res.data.complaints);
      setComplaintPagination(res.data.pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setComplaintLoading(false);
    }
  };

  // Fetch complaints whenever tab switches to complaints or filters change
  useEffect(() => {
    if (tab === 'complaints') fetchComplaints(complaintFilters);
  }, [tab, complaintFilters]);

  const stats = nationalStats?.stats;
  const stateStats = nationalStats?.state_stats || [];
  const deptBreakdown = nationalStats?.department_breakdown || [];

  const TABS = ['overview', 'leaderboard', 'complaints', 'admins', 'partner tasks'];

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-[22px] py-[28px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-[24px] gap-[16px]">
          <div>
            <div className="text-[10px] font-bold tracking-[3px] uppercase text-navy mb-2 flex items-center gap-[10px] before:content-[''] before:w-6 before:h-[2px] before:bg-navy">
               Federal Oversight Level
            </div>
            <h1 className="font-serif text-[28px] font-bold text-text mb-1 flex items-center gap-[8px]">
              {SvgIcons.globe} National Control Center
            </h1>
            <p className="text-[13px] text-muted font-medium">Super admin. Pan-national orchestration and telemetry.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-[6px] mb-[24px] bg-white p-[6px] rounded-[6px] border border-border w-fit shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-[20px] py-[10px] rounded-[4px] text-[12px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                tab === t ? 'bg-navy text-white shadow-md' : 'bg-transparent text-muted hover:text-text hover:bg-off'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-[24px] animate-fade-in">
            {/* National Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
              {loading && !stats ? (
                [...Array(4)].map((_, i) => <div key={i} className="card h-[100px] bg-off border border-border rounded-[6px] animate-pulse" />)
              ) : [
                { label: 'Total Nationwide', value: stats?.total_complaints?.toLocaleString(), icon: SvgIcons.clipboard, bg: 'bg-white', text: 'text-text' },
                { label: 'Avg. Resolution', value: `${stats?.resolve_pct}%`, icon: SvgIcons.check, bg: 'bg-green-bg', text: 'text-green' },
                { label: 'Mean TAT', value: `${stats?.avg_resolve_days}d`, icon: SvgIcons.clock, bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]' },
                { label: 'Active Breaches', value: stats?.sla_breaches, icon: <span className="text-burg">{SvgIcons.alert}</span>, bg: 'bg-burg-bg', text: 'text-burg', border: 'border-burg/20' },
              ].map((s) => (
                <div key={s.label} className={`flex flex-col gap-1 p-4 border rounded-[6px] shadow-sm hover:-translate-y-[2px] hover:shadow-card-hover transition-all ${s.bg} ${s.border || 'border-border'}`}>
                  <div className="flex justify-between items-center mb-1">
                     <div className={`text-[11px] font-bold uppercase tracking-wider ${s.text === 'text-text' ? 'text-muted' : s.text}`}>{s.label}</div>
                     <div className="opacity-40">{s.icon}</div>
                  </div>
                  <div className={`font-serif text-[28px] font-black leading-none ${s.text}`}>{s.value ?? '-'}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-[24px]">
              {/* National Map */}
              <div className="lg:col-span-3 card flex flex-col relative overflow-hidden bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)]" style={{ height: '460px' }}>
                <div className="px-[20px] py-[16px] border-b border-border flex items-center justify-between bg-white z-20">
                  <h2 className="text-[14px] font-bold text-text uppercase tracking-wider flex items-center gap-[8px]">
                    {SvgIcons.map} Federal Telemetry Map
                  </h2>
                </div>
                <div className="flex-1 w-full bg-cream relative z-10">
                  <MapContainer center={INDIA_CENTER} zoom={5} style={{ height: '100%', width: '100%' }} zoomControl={true}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://carto.com/">Carto</a>' />
                    {stateStats.filter((s) => s.total > 0).map((s, i) => {
                      const STATE_COORDS = {
                        'Maharashtra': [19.7, 75.7], 'Karnataka': [15.3, 75.7], 'Tamil Nadu': [11.1, 78.7],
                        'Delhi': [28.7, 77.1], 'Gujarat': [22.2, 71.2], 'Rajasthan': [27.0, 74.2],
                        'Uttar Pradesh': [26.8, 80.9], 'West Bengal': [22.9, 87.8], 'Telangana': [17.4, 78.5],
                        'Kerala': [10.8, 76.3], 'Madhya Pradesh': [22.9, 78.6], 'Punjab': [31.1, 75.3],
                      };
                      const coords = STATE_COORDS[s.state];
                      if (!coords) return null;
                      return (
                        <CircleMarker
                          key={i}
                          center={coords}
                          radius={Math.min(10 + Math.sqrt(s.total) * 1.5, 40)}
                          pathOptions={{
                            fillColor: getDensityColor(s.total),
                            fillOpacity: 0.8,
                            color: '#ffffff',
                            weight: 2,
                          }}
                        >
                          <Popup className="civic-popup">
                            <div className="p-[4px]">
                              <p className="font-bold text-[15px] text-text mb-[6px] border-b border-border pb-[4px]">{s.state}</p>
                              <div className="space-y-[4px]">
                                <div className="flex justify-between items-center text-[12px]">
                                  <span className="text-muted font-medium">Caseload:</span>
                                  <span className="font-bold text-text">{s.total}</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px]">
                                  <span className="text-muted font-medium">Resolution:</span>
                                  <span className="font-bold text-green bg-green-bg px-1 rounded">{s.resolve_pct}%</span>
                                </div>
                                <div className="flex justify-between items-center text-[12px] pb-[4px]">
                                  <span className="text-muted font-medium">Mean TAT:</span>
                                  <span className="font-bold text-[#1D4ED8] bg-[#EFF6FF] px-1 rounded">{s.avg_resolve_days ?? '-'}d</span>
                                </div>
                                {s.sla_breaches > 0 && (
                                   <div className="pt-[4px] border-t border-border">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-burg flex items-center gap-1">
                                         {s.sla_breaches} Escalations
                                      </span>
                                   </div>
                                )}
                              </div>
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>

                  {/* Density Legend */}
                  <div className="absolute bottom-[16px] left-[16px] bg-white/95 backdrop-blur-sm rounded-[6px] border border-border shadow-md p-[10px] z-[1000]">
                    <div className="text-[9px] font-bold text-muted uppercase tracking-wider mb-[6px]">Density</div>
                    <div className="space-y-[3px]">
                      {[
                        { color: '#22c55e', label: '1–5' },
                        { color: '#eab308', label: '6–15' },
                        { color: '#f97316', label: '16–30' },
                        { color: '#ef4444', label: '31+' },
                      ].map((l) => (
                        <div key={l.label} className="flex items-center gap-[6px]">
                          <div className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: l.color }} />
                          <span className="text-[10px] font-medium text-muted">{l.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel: Dept breakdown + State table */}
              <div className="lg:col-span-2 space-y-[24px]">
                {/* Dept Breakdown */}
                <div className="card p-[20px] bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                  <h3 className="text-[13px] font-bold text-text uppercase tracking-wider mb-[16px] flex items-center gap-[8px]">
                     <span className="w-[12px] h-[2px] bg-burg"></span> By Department
                  </h3>
                  <div className="space-y-[14px]">
                    {deptBreakdown.map((d) => {
                      const icon = DEPT_ICONS[d._id] || SvgIcons.clipboard;
                      const pct = stats?.total_complaints > 0 ? Math.round((d.count / stats.total_complaints) * 100) : 0;
                      return (
                        <div key={d._id}>
                          <div className="flex items-center justify-between text-[13px] mb-[6px]">
                            <span className="font-semibold text-text flex items-center gap-2">{icon} {d._id}</span>
                            <span className="text-muted font-mono font-bold text-[12px]">{d.count} <span className="opacity-60">({pct}%)</span></span>
                          </div>
                          <div className="h-[6px] bg-off rounded-full overflow-hidden border border-border/50">
                            <div className="h-full bg-navy rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* State Table */}
                <div className="card overflow-hidden bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
                  <div className="px-[20px] py-[16px] border-b border-border bg-off">
                    <h3 className="text-[13px] font-bold text-text uppercase tracking-wider flex items-center gap-[8px]">
                       <span className="w-[12px] h-[2px] bg-navy"></span> State Operations Summary
                    </h3>
                  </div>
                  <div className="overflow-y-auto max-h-[220px]">
                    <table className="w-full text-[12px]">
                      <thead className="sticky top-0 bg-white shadow-sm">
                        <tr className="border-b border-border">
                          <th className="px-[16px] py-[10px] text-left text-muted font-bold uppercase tracking-wider">Jurisdiction</th>
                          <th className="px-[16px] py-[10px] text-right text-muted font-bold uppercase tracking-wider">Tickets</th>
                          <th className="px-[16px] py-[10px] text-right text-muted font-bold uppercase tracking-wider">Res %</th>
                          <th className="px-[16px] py-[10px] text-right text-muted font-bold uppercase tracking-wider">Index</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stateStats.map((s) => (
                          <tr key={s._id} className="border-b border-border/60 hover:bg-off transition-colors">
                            <td className="px-[16px] py-[12px] font-semibold text-text">{s.state}</td>
                            <td className="px-[16px] py-[12px] text-right font-mono text-muted">{s.total}</td>
                            <td className="px-[16px] py-[12px] text-right font-mono text-muted">{s.resolve_pct}%</td>
                            <td className={`px-[16px] py-[12px] text-right font-mono text-[14px] ${SCORE_COLOR(s.score)}`}>{s.score}</td>
                          </tr>
                        ))}
                        {stateStats.length === 0 && !loading && (
                          <tr><td colSpan={4} className="py-[20px] text-center text-muted">No state data available.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LEADERBOARD TAB ─────────────────────── */}
        {tab === 'leaderboard' && (
          <div className="space-y-[16px] animate-fade-in">
            <div className="bg-white border border-border rounded-[6px] p-[16px] flex items-start gap-[12px]">
               {SvgIcons.chart}
               <div>
                  <h3 className="text-[13px] font-bold text-text uppercase tracking-wider mb-[2px]">Performance Matrix</h3>
                  <p className="text-[12px] text-muted font-medium leading-[1.6]">
                    Jurisdictions algorithmically ranked by composite operational index: <span className="text-text font-bold">50%</span> Resolution Rate + <span className="text-text font-bold">30%</span> Speed (TAT) + <span className="text-text font-bold">20%</span> SLA Adherence.
                  </p>
               </div>
            </div>
            
            <div className="card overflow-hidden bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border bg-off">
                      {['Rank', 'Jurisdiction', 'Total Tickets', 'Resolved', 'Mean TAT', 'Breaches', 'Index Score', 'Rating'].map((h) => (
                        <th key={h} className="px-[20px] py-[14px] text-[11px] font-bold text-muted uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row, i) => (
                      <tr key={row.state} className="border-b border-border/60 hover:bg-cream transition-colors group">
                        <td className="px-[20px] py-[16px] text-[20px] w-[60px]">{RANK_MEDAL(i)}</td>
                        <td className="px-[20px] py-[16px] font-serif text-[16px] font-bold text-text">{row.state}</td>
                        <td className="px-[20px] py-[16px] font-mono text-[13px] text-muted">{row.total.toLocaleString()}</td>
                        <td className="px-[20px] py-[16px] font-mono text-[13px] font-semibold text-text">{row.resolve_pct}%</td>
                        <td className="px-[20px] py-[16px] font-mono text-[13px] text-muted">{row.avg_resolve_days != null ? `${row.avg_resolve_days}d` : '-'}</td>
                        <td className="px-[20px] py-[16px] font-mono text-[13px]">
                          <span className={row.sla_breaches > 0 ? 'text-burg font-bold bg-burg-bg px-2 py-0.5 rounded' : 'text-muted'}>
                            {row.sla_breaches}
                          </span>
                        </td>
                        <td className={`px-[20px] py-[16px] font-mono text-[16px] ${SCORE_COLOR(row.score)}`}>
                          {row.score}
                        </td>
                        <td className="px-[20px] py-[16px]">
                          <span className={SCORE_BADGE(row.rating)}>{row.rating}</span>
                        </td>
                      </tr>
                    ))}
                    {leaderboard.length === 0 && !loading && (
                      <tr>
                        <td colSpan={8} className="px-[20px] py-[40px] text-center text-muted font-medium">
                          No performance data accumulated yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLAINTS TAB ───────────────────────── */}
        {tab === 'complaints' && (
          <div className="space-y-[20px] animate-fade-in">
            {/* Filters */}
            <div className="bg-white border border-border rounded-[8px] p-[16px] flex flex-wrap gap-3 items-end shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">State</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={complaintFilters.state}
                  onChange={e => setComplaintFilters(f => ({ ...f, state: e.target.value, page: 1 }))}
                  className="input py-[7px] text-[13px] w-[160px]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Department</label>
                <select value={complaintFilters.department} onChange={e => setComplaintFilters(f => ({ ...f, department: e.target.value, page: 1 }))} className="input py-[7px] text-[13px]">
                  <option value="">All</option>
                  {['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted uppercase mb-1">Status</label>
                <select value={complaintFilters.status} onChange={e => setComplaintFilters(f => ({ ...f, status: e.target.value, page: 1 }))} className="input py-[7px] text-[13px]">
                  <option value="">All</option>
                  {['Registered', 'Under Review', 'In Progress', 'Resolved'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => setComplaintFilters({ state: '', department: '', status: '', page: 1 })} className="btn-ghost text-[12px] py-[7px] px-3 border border-border">
                Clear
              </button>
              <span className="ml-auto text-[12px] text-muted font-medium">
                {complaintPagination.total ?? 0} total complaints
              </span>
            </div>

            {/* Table */}
            <div className="bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">
              {complaintLoading ? (
                <div className="py-16 text-center text-muted text-[13px]">Loading complaints...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px] border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-off border-b border-border">
                        {['Tracking ID', 'State', 'District', 'Department', 'Severity', 'Status', 'Filed', 'Action'].map(h => (
                          <th key={h} className="px-[16px] py-[11px] text-left text-[10px] font-bold text-muted uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {complaints.map(c => {
                        const statusColor = {
                          'Registered': 'bg-blue-50 text-blue-700 border-blue-200',
                          'Under Review': 'bg-amber-50 text-amber-700 border-amber-200',
                          'In Progress': 'bg-indigo-50 text-indigo-700 border-indigo-200',
                          'Resolved': 'bg-green-50 text-green-700 border-green-200',
                        }[c.status] || 'bg-off text-muted';
                        const sevColor = { Critical: 'text-red-600', High: 'text-orange-600', Medium: 'text-amber-600', Low: 'text-green-600' }[c.severity] || 'text-muted';
                        return (
                          <tr key={c._id} className="border-b border-border/50 hover:bg-cream/50 transition-colors">
                            <td className="px-[16px] py-[12px] font-mono text-[11px] text-muted">{c.tracking_id}</td>
                            <td className="px-[16px] py-[12px] font-medium text-text">{c.state || <span className="text-muted italic">unset</span>}</td>
                            <td className="px-[16px] py-[12px] text-muted">{c.district || '—'}</td>
                            <td className="px-[16px] py-[12px] text-muted">{c.department}</td>
                            <td className={`px-[16px] py-[12px] font-bold ${sevColor}`}>{c.severity}</td>
                            <td className="px-[16px] py-[12px]">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${statusColor}`}>{c.status}</span>
                            </td>
                            <td className="px-[16px] py-[12px] text-muted font-mono text-[11px]">{new Date(c.filed_at).toLocaleDateString('en-IN')}</td>
                            <td className="px-[16px] py-[12px]">
                              <button 
                                onClick={() => {
                                  setTaskForm({ title: `Resolution: ${c.summary_en || c.tracking_id}`, description: `Task to resolve complaint ${c.tracking_id}: ${c.raw_text}`, budget_estimate: '', complaintId: c._id });
                                  setShowTaskModal(true);
                                }}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight"
                              >
                                + Create Task
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {complaints.length === 0 && (
                        <tr><td colSpan={7} className="py-[40px] text-center text-muted font-medium">No complaints found for the selected filters.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {complaintPagination.pages > 1 && (
                <div className="px-[16px] py-[12px] border-t border-border bg-off flex items-center justify-between">
                  <button
                    disabled={complaintFilters.page <= 1}
                    onClick={() => setComplaintFilters(f => ({ ...f, page: f.page - 1 }))}
                    className="btn-ghost text-[12px] py-1 px-3 border border-border disabled:opacity-40"
                  >← Prev</button>
                  <span className="text-[12px] text-muted">Page {complaintFilters.page} of {complaintPagination.pages}</span>
                  <button
                    disabled={complaintFilters.page >= complaintPagination.pages}
                    onClick={() => setComplaintFilters(f => ({ ...f, page: f.page + 1 }))}
                    className="btn-ghost text-[12px] py-1 px-3 border border-border disabled:opacity-40"
                  >Next →</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ADMINS TAB ──────────────────────────── */}

        {tab === 'admins' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] animate-fade-in">
            {/* Create Admin */}
            <div className="card p-[28px] bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] h-fit">
              <h2 className="text-[14px] font-bold text-text uppercase tracking-wider mb-[24px] flex items-center gap-[8px]">
                 <span className="w-[12px] h-[2px] bg-navy"></span> Provision Access Profile
              </h2>
              <div className="space-y-[16px]">
                {[
                  { label: 'Officer Full Name', field: 'name', type: 'text', placeholder: 'e.g., A. Sharma' },
                  { label: 'Official Email ID', field: 'email', type: 'email', placeholder: 'officer@gov.in' },
                  { label: 'Secure Passphrase', field: 'password', type: 'password', placeholder: '••••••••' },
                ].map((f) => (
                  <div key={f.field}>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-[6px]">{f.label}</label>
                    <input
                      type={f.type}
                      value={newAdmin[f.field]}
                      onChange={(e) => setNewAdmin({ ...newAdmin, [f.field]: e.target.value })}
                      placeholder={f.placeholder}
                      className="input"
                    />
                  </div>
                ))}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-[6px]">Clearance Level</label>
                    <select
                      value={newAdmin.role}
                      onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                      className="input font-semibold cursor-pointer"
                    >
                      <option value="state_admin">State Officer (Tier 2)</option>
                      <option value="super_admin">Federal Officer (Tier 1)</option>
                    </select>
                  </div>
                  {newAdmin.role === 'state_admin' && (
                    <div className="animate-fade-in">
                      <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-[6px]">Assigned State</label>
                      <input
                        type="text"
                        value={newAdmin.state}
                        onChange={(e) => setNewAdmin({ ...newAdmin, state: e.target.value })}
                        placeholder="e.g., Maharashtra"
                        className="input"
                      />
                    </div>
                  )}
                </div>

                {createMsg && (
                  <div className={`mt-[16px] p-[12px] rounded-[4px] border text-[13px] font-bold flex items-center gap-[8px] ${createMsg.includes('provisioned') ? 'bg-green-bg text-green border-green/20' : 'bg-burg-bg text-burg border-burg/20'}`}>
                    {createMsg}
                  </div>
                )}

                <button onClick={handleCreateAdmin} disabled={createLoading} className="btn-primary w-full py-[14px] mt-[8px]">
                  {createLoading ? 'Provisioning...' : 'Provision Officer Access →'}
                </button>
              </div>
            </div>

            {/* Admin List */}
            <div className="card overflow-hidden bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex flex-col h-[600px]">
              <div className="px-[20px] py-[16px] border-b border-border bg-off flex justify-between items-center shrink-0">
                <h2 className="text-[13px] font-bold text-text uppercase tracking-wider flex items-center gap-[8px]">
                   <span className="w-[12px] h-[2px] bg-navy"></span> Active Personnel Registry
                </h2>
                <span className="text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-border text-muted">{admins.length} Total</span>
              </div>
              
              <div className="divide-y divide-border/60 overflow-y-auto flex-1 bg-cream/30">
                {admins.map((a) => (
                  <div key={a._id} className="px-[20px] py-[16px] flex items-center justify-between hover:bg-white transition-colors group">
                    <div>
                      <p className="text-[14px] font-bold text-text mb-[2px]">{a.name}</p>
                      <p className="text-[12px] font-mono text-muted mb-[8px]">{a.email}</p>
                      <div className="flex flex-wrap items-center gap-[8px]">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded border inline-block ${a.role === 'super_admin' ? 'bg-[#F3E8FF] text-[#9333EA] border-[#D8B4FE]' : 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]'}`}>
                          {a.role === 'super_admin' ? 'Tier 1' : 'Tier 2'}
                        </span>
                        {a.state && <span className="text-[11px] font-semibold text-muted flex items-center gap-1">{SvgIcons.pin} {a.state}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(a._id)}
                      className="text-muted hover:text-burg opacity-0 group-hover:opacity-100 transition-all p-[8px] hover:bg-burg-bg rounded-[4px] cursor-pointer"
                      title="Revoke Access"
                    >
                      {SvgIcons.trash}
                    </button>
                  </div>
                ))}
                {admins.length === 0 && !loading && (
                  <div className="p-[40px] text-center text-muted font-medium text-[13px]">No administrative profiles found.</div>
                )}
              </div>
            </div>
            
          </div>
        )}

        {/* ── PARTNER TASKS TAB ─────────────────────── */}
        {tab === 'partner tasks' && (
          <div className="space-y-[24px] animate-fade-in">
            <div className="flex justify-between items-center bg-white p-[16px] rounded-[8px] border border-border shadow-[0_4px_24px_rgba(0,0,0,0.03)]">
              <div>
                <h2 className="text-[16px] font-bold text-text flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
                  National Partner Tasks
                </h2>
                <p className="text-[12px] text-muted">Manage all active bids and sponsorships from contractors across the country.</p>
              </div>
              <button 
                onClick={() => { setTaskForm({ title: '', description: '', budget_estimate: '' }); setShowTaskModal(true); }}
                className="btn-primary py-2 px-4 shadow-md bg-indigo-600 hover:bg-indigo-700"
              >
                + Create Federal Task
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tasks.length === 0 ? (
                <div className="col-span-full p-[40px] text-center bg-white border border-border rounded-[8px]">
                  <p className="text-muted font-medium text-[13px]">No Partner tasks available nationwide.</p>
                </div>
              ) : (
                tasks.map(task => (
                  <div key={task._id} className="p-4 bg-white border border-border rounded-[8px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col">
                    <div className="flex gap-2 justify-between mb-3">
                      <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded ${task.status === 'Open' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>{task.status}</span>
                      <span className="text-[13px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">₹{task.budget_estimate?.toLocaleString()}</span>
                    </div>
                    <h4 className="font-bold text-[15px] text-text mb-2 line-clamp-2">{task.title}</h4>
                    <p className="text-[12px] text-muted line-clamp-3 mb-4 flex-1">{task.description}</p>
                    
                    <div className="mt-auto pt-4 border-t border-border">
                      <h5 className="text-[11px] font-bold text-muted uppercase mb-3 px-1">Applications ({task.applications?.length || 0})</h5>
                      <div className="space-y-2">
                        {task.applications?.map(app => (
                          <div key={app._id} className="flex justify-between items-center bg-cream/50 p-3 rounded-[6px] border border-border">
                            <div className="flex-1 min-w-0 mr-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${app.role === 'Sponsor' ? 'bg-green-bg text-green border border-green/20' : 'bg-burg-bg text-burg border border-burg/20'}`}>{app.role}</span>
                                <span className="font-mono text-[13px] font-bold text-text">₹{app.bid_amount?.toLocaleString()}</span>
                                <span className="text-[11px] font-bold text-navy ml-1">{app.user_id?.name || 'Partner'}</span>
                              </div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[11px] text-muted italic line-clamp-1">{app.message || 'No message provided'}</p>
                                {app.user_id?.phone && <span className="text-[10px] text-muted font-mono">{app.user_id.phone}</span>}
                              </div>
                            </div>
                            {app.status === 'Pending' && task.status === 'Open' ? (
                              <button 
                                onClick={async () => {
                                  try {
                                    await approveTaskApplication(task._id, { application_id: app._id });
                                    fetchAll();
                                    alert('Application Approved! Task Assigned.');
                                  } catch(e) { alert('Error approving application'); }
                                }}
                                className="bg-indigo-600 text-white text-[11px] px-3 py-1.5 rounded-[4px] font-bold hover:bg-indigo-700 shrink-0 shadow-sm transition-colors"
                              >
                                Accept
                              </button>
                            ) : (
                              <span className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${app.status === 'Approved' ? 'text-green' : 'text-muted'}`}>{app.status}</span>
                            )}
                          </div>
                        ))}
                        {task.applications?.length === 0 && (
                          <div className="py-2 text-center border border-dashed border-border rounded flex items-center justify-center gap-2 bg-off">
                             <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                             <span className="text-[11px] text-muted font-medium">Waiting for bids</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Task Creation Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-[12px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
              <div className="px-[24px] py-[20px] border-b border-border bg-off flex justify-between items-center">
                <h3 className="font-bold text-[16px] text-text tracking-wide flex items-center gap-2">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
                   Create Federal Task
                </h3>
                <button onClick={() => setShowTaskModal(false)} className="text-muted hover:text-burg font-bold text-[20px] leading-none">×</button>
              </div>
              <form onSubmit={handleCreateTask} className="p-[24px] space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase mb-1">Task Title</label>
                  <input type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} className="input w-full bg-cream focus:border-indigo-400" required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase mb-1">Public Description</label>
                  <textarea value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} className="input w-full bg-cream focus:border-indigo-400 min-h-[100px]" required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase mb-1">Estimated Budget (₹)</label>
                  <input type="number" value={taskForm.budget_estimate} onChange={e => setTaskForm({...taskForm, budget_estimate: e.target.value})} className="input w-full bg-cream focus:border-indigo-400" required min="1" />
                </div>
                <div className="pt-4 flex gap-3 border-t border-border mt-6">
                  <button type="button" onClick={() => setShowTaskModal(false)} className="btn-ghost flex-1 py-2.5 text-[13px] font-bold text-muted border border-border">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 text-[13px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-[4px] transition-colors shadow-md">
                    Publish Task to Partners
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
