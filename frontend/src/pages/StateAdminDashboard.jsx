import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Navbar from '../components/Navbar';
import ComplaintCard from '../components/ComplaintCard';
import { useAuth } from '../context/AuthContext';
import { getComplaints, updateComplaintStatus, getMapData, getStateStats, createTask, getTasks, approveTaskApplication } from '../utils/api';
import { io } from 'socket.io-client';

const STATE_CENTERS = {
  'Maharashtra': [19.7515, 75.7139],
  'Karnataka': [15.3173, 75.7139],
  'Tamil Nadu': [11.1271, 78.6569],
  'Delhi': [28.7041, 77.1025],
  'Gujarat': [22.2587, 71.1924],
  'Rajasthan': [27.0238, 74.2179],
  'Uttar Pradesh': [26.8467, 80.9462],
  'West Bengal': [22.9868, 87.8550],
};

// ── Inline SVG Icons ──────────────────────────────────────────────────────
const SvgIcons = {
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
  refresh: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
    </svg>
  ),
  pin: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  empty: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
    </svg>
  ),
};

// ── Density-based heatmap color logic ─────────────────────────────────────
function getDensityColor(count) {
  if (count >= 31) return '#ef4444'; // red
  if (count >= 16) return '#f97316'; // orange
  if (count >= 6) return '#eab308';  // yellow
  return '#22c55e';                  // green
}

export default function StateAdminDashboard() {
  const { admin } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [mapData, setMapData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ department: '', severity: '', status: '', sla_breach: '' });
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtComplaints, setDistrictComplaints] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  // Partner Tasks State
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', budget_estimate: '', complaintId: null });
  const [viewingTasks, setViewingTasks] = useState(false);

  const stateName = admin?.state || 'Maharashtra';
  const center = STATE_CENTERS[stateName] || [20.5937, 78.9629];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [complaintsRes, mapRes, statsRes] = await Promise.all([
        getComplaints({ ...filters, page, limit: 15 }),
        getMapData({ state: stateName }),
        getStateStats(stateName),
      ]);
      setComplaints(complaintsRes.data.complaints);
      setPagination(complaintsRes.data.pagination);
      setMapData(mapRes.data.data);
      setStats(statsRes.data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error('Complaints fetch error:', e);
    } finally {
      setLoading(false);
    }
    // Fetch tasks separately so failure here doesn't hide complaints
    try {
      const tasksRes = await getTasks();
      setTasks(tasksRes.data);
    } catch (e) {
      console.warn('Tasks fetch failed (non-critical):', e.message);
    }
  }, [filters, page, stateName]);

  useEffect(() => {
    fetchData();

    // Socket.io for live complaint updates
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || '');
    socket.emit('join_admin', stateName);
    socket.on('new_complaint', () => fetchData());
    socket.on('complaint_updated', () => fetchData());
    return () => socket.disconnect();
  }, [fetchData]);

  const handleStatusChange = async (complaintId, status, note) => {
    try {
      await updateComplaintStatus(complaintId, status, note);
      fetchData();
    } catch (e) {
      throw e; // Let StageChanger handle the error toast
    }
  };

  const handleOpenTaskModal = (complaint) => {
    setTaskForm({
      title: `Resolve: ${complaint.summary_en?.substring(0, 40) || 'Complaint'}...`,
      description: complaint.raw_text,
      budget_estimate: '',
      complaintId: complaint._id
    });
    setShowTaskModal(true);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await createTask({ complaint_id: taskForm.complaintId, title: taskForm.title, description: taskForm.description, budget_estimate: Number(taskForm.budget_estimate) });
      setShowTaskModal(false);
      alert('Partner Task Created Successfully!');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleMarkerClick = async (district) => {
    setSelectedDistrict(district);
    const res = await getComplaints({ district, page: 1, limit: 50 });
    setDistrictComplaints(res.data.complaints);
  };

  // Aggregate map data by district for density coloring
  const aggregatedMapData = (() => {
    const districts = {};
    mapData.forEach((d) => {
      if (!d.lat || !d.lng) return;
      const key = d.district || `${d.lat.toFixed(2)},${d.lng.toFixed(2)}`;
      if (!districts[key]) {
        districts[key] = { district: d.district || key, lat: d.lat, lng: d.lng, count: 0, resolved: 0, sla_breaches: 0 };
      }
      districts[key].count++;
      if (d.status === 'Resolved') districts[key].resolved++;
      if (d.sla_breach) districts[key].sla_breaches++;
    });
    return Object.values(districts);
  })();

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-[1400px] mx-auto px-[22px] py-[28px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-[24px] gap-[16px]">
          <div>
            <div className="text-[10px] font-bold tracking-[3px] uppercase text-burg mb-2 flex items-center gap-[10px] before:content-[''] before:w-6 before:h-[2px] before:bg-burg">
              State Operations Center
            </div>
            <h1 className="font-serif text-[28px] font-bold text-text mb-1 flex items-center gap-[8px]">
              {SvgIcons.map} {stateName} Dashboard
            </h1>
            <p className="text-[13px] text-muted font-medium">Municipal officer view. Manage and analyze complaints across your state.</p>
          </div>
          <div className="flex items-center gap-[10px] shrink-0 self-start md:self-auto">
            {lastUpdated && (
              <span className="text-[10px] text-muted font-medium">
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-[5px] bg-white px-[10px] py-[6px] rounded-[4px] border border-border text-[11px] font-bold text-muted uppercase tracking-wider hover:border-burg hover:text-burg transition-all cursor-pointer disabled:opacity-50"
            >
              <span className={loading ? 'animate-spin' : ''}>{SvgIcons.refresh}</span> Refresh
            </button>
            <div className="flex items-center gap-[6px] bg-white px-[12px] py-[6px] rounded-[4px] border border-border">
              <div className="w-[8px] h-[8px] rounded-full bg-green animate-pulse" />
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider mt-[1px]">Live</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        {loading && !stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[24px]">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[90px] bg-white border border-border rounded-[6px] animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[24px]">

            <div className="flex flex-col gap-1 p-4 border border-border rounded-[6px] bg-white shadow-sm hover:-translate-y-[2px] hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-center mb-1">
                 <div className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Volume</div>
                 <div className="opacity-40 text-muted">{SvgIcons.clipboard}</div>
              </div>
              <div className="font-serif text-[28px] font-black text-text leading-none">{stats.stats.total}</div>
            </div>

            <div className="flex flex-col gap-1 p-4 border border-border rounded-[6px] bg-green-bg shadow-sm hover:-translate-y-[2px] hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-center mb-1">
                 <div className="text-[11px] font-bold text-green uppercase tracking-wider">Resolution Rate</div>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 text-green"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="font-serif text-[28px] font-black text-green leading-none">{stats.stats.resolve_pct}%</div>
            </div>

            <div className="flex flex-col gap-1 p-4 border border-border rounded-[6px] bg-amber-bg shadow-sm hover:-translate-y-[2px] hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-center mb-1">
                 <div className="text-[11px] font-bold text-amber uppercase tracking-wider">Active Pending</div>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 text-amber"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="font-serif text-[28px] font-black text-amber leading-none">{stats.stats.pending}</div>
            </div>

            <div className="flex flex-col gap-1 p-4 border border-burg/20 rounded-[6px] bg-burg-bg shadow-sm hover:-translate-y-[2px] hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-center mb-1">
                 <div className="text-[11px] font-bold text-burg uppercase tracking-wider">SLA Breaches</div>
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 text-burg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div className="font-serif text-[28px] font-black text-burg leading-none">{stats.stats.sla_breaches}</div>
            </div>

          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-[24px] h-[calc(100vh-280px)] min-h-[600px]">
          {/* Map Column (Takes 2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-[20px] h-full relative">

            <div className="card flex-1 flex flex-col relative overflow-hidden bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] z-10 w-full">
              <div className="px-[20px] py-[16px] border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-[8px] bg-white z-20">
                <h2 className="text-[14px] font-bold text-text uppercase tracking-wider flex items-center gap-[8px]">
                  {SvgIcons.map} Spatial Grievance Heatmap
                </h2>
                <div className="flex items-center gap-[12px] text-[10px] font-bold uppercase tracking-wider bg-off px-[10px] py-[6px] rounded border border-border">
                   <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1d4ed8]"></span> Standard</div>
                   <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#7a5200]"></span> High</div>
                   <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-burg"></span> Critical</div>
                </div>
              </div>
              <div className="flex-1 w-full bg-cream relative z-10 block">
                <MapContainer
                  center={center}
                  zoom={7}
                  style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
                  zoomControl={true}
                  className="z-10"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  />
                  {aggregatedMapData.map((d, i) => (
                    <CircleMarker
                      key={d._id || i}
                      center={[d.lat, d.lng]}
                      radius={Math.min(10 + d.count * 1.5, 35)}
                      pathOptions={{
                        fillColor: d.sla_breaches > 0 ? '#8b1a1a' : d.critical > 0 ? '#7a5200' : '#1d4ed8',
                        fillOpacity: 0.8,
                        color: '#ffffff',
                        weight: 2,
                      }}
                      eventHandlers={{ click: () => handleMarkerClick(d.district) }}
                    >
                      <Popup className="civic-popup">
                        <div className="p-[4px]">
                          <p className="font-bold text-[14px] text-text mb-[6px] border-b border-border pb-[4px]">{d.district || 'Location'}</p>
                          <div className="flex justify-between items-center text-[12px] mb-[4px]">
                            <span className="text-muted font-medium">Tracking ID:</span>
                            <span className="font-mono font-bold text-text">{d.tracking_id}</span>
                          </div>
                          <div className="flex justify-between items-center text-[12px] mb-[4px]">
                            <span className="text-muted font-medium">Department:</span>
                            <span className="font-bold text-text">{d.department || 'Other'}</span>
                          </div>
                          <div className="flex justify-between items-center text-[12px] mb-[6px]">
                             <span className="text-muted font-medium">Resolution Rate:</span>
                             <span className="font-bold text-green bg-green-bg px-1 rounded">{Math.round(d.resolve_pct)}%</span>
                          </div>
                          {d.sla_breaches > 0 && (
                             <div className="mt-[8px] pt-[6px] border-t border-border">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-burg flex items-center gap-1">
                                   <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                   {d.sla_breaches} SLA Breaches Active
                                </span>
                             </div>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>

                {/* Heatmap Legend */}
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

            {/* Floating District Panel (Displays when selected) */}
            {selectedDistrict && (
              <div className="absolute bottom-[20px] left-[20px] right-[20px] max-h-[40%] bg-white/95 backdrop-blur-md rounded-[8px] shadow-[0_12px_48px_rgba(0,0,0,0.15)] border border-border z-30 flex flex-col animate-fade-in overflow-hidden">
                <div className="flex items-center justify-between px-[20px] py-[14px] border-b border-border bg-white sticky top-0 z-10">
                  <h3 className="font-bold text-[15px] text-text flex items-center gap-2">
                     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                     <span className="uppercase tracking-wide">{selectedDistrict} District</span>
                  </h3>
                  <button onClick={() => setSelectedDistrict(null)} className="text-[11px] font-bold text-muted uppercase tracking-wider hover:text-burg px-2 py-1 bg-off rounded border border-border cursor-pointer transition-colors">Close ✕</button>
                </div>
                <div className="p-[16px] overflow-y-auto flex-1 bg-cream/30 space-y-[12px]">
                  {districtComplaints.length === 0 ? (
                    <p className="text-muted text-[13px] text-center py-[20px] font-medium">No active complaints found in this jurisdiction.</p>
                  ) : (
                    districtComplaints.map((c) => (
                      <ComplaintCard key={c._id} complaint={c} showActions onStatusChange={handleStatusChange} />
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* List/Sidebar Column (Takes 1/3 width) */}
          <div className="lg:col-span-1 flex flex-col h-full bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)] overflow-hidden">

            {/* Filter Header Fixed */}
            <div className="px-[20px] py-[16px] border-b border-border bg-off shrink-0">
              <div className="flex items-center gap-[8px] mb-[12px]">
                <span className="w-[12px] h-[2px] bg-burg"></span>
                <h2 className="text-[13px] font-bold text-text uppercase tracking-wider">Filter Registry</h2>
              </div>
              
              {/* Role Toggle for Admin (Complaints vs Tasks) */}
              <div className="flex bg-white rounded-[6px] p-1 border border-border mb-3">
                <button onClick={() => setViewingTasks(false)} className={`flex-1 text-[12px] py-1.5 font-bold rounded ${!viewingTasks ? 'bg-burg text-white shadow' : 'text-muted'}`}>Complaints</button>
                <button onClick={() => setViewingTasks(true)} className={`flex-1 text-[12px] py-1.5 font-bold rounded ${viewingTasks ? 'bg-indigo-600 text-white shadow' : 'text-muted'}`}>Partner Tasks</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px]">
                <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="input text-[12px] py-[6px] px-[8px] bg-white border-border focus:border-burg cursor-pointer font-medium font-sans">
                  <option value="">All Depts</option>
                  {['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'].map((d) => <option key={d}>{d}</option>)}
                </select>
                <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="input text-[12px] py-[6px] px-[8px] bg-white border-border focus:border-burg cursor-pointer font-medium font-sans">
                  <option value="">All Severities</option>
                  {['Critical', 'High', 'Medium', 'Low'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input text-[12px] py-[6px] px-[8px] bg-white border-border focus:border-burg cursor-pointer font-medium font-sans">
                  <option value="">All Statuses</option>
                  {['Registered', 'Under Review', 'In Progress', 'Resolved'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={filters.sla_breach} onChange={(e) => setFilters({ ...filters, sla_breach: e.target.value })} className="input text-[12px] py-[6px] px-[8px] bg-burg border-burg text-white font-bold cursor-pointer">
                  <option value="">SLA Filter</option>
                  <option value="true">Breaches Only</option>
                </select>
              </div>
            </div>

             {/* Scrollable List */}
             <div className="flex-1 overflow-y-auto bg-cream/30 p-[12px] space-y-[12px]">
                {loading && !viewingTasks ? (
                  <div className="py-[40px] flex flex-col items-center justify-center text-center">
                     <div className="w-[30px] h-[30px] border-[2px] border-burg/30 border-t-burg rounded-full animate-spin mb-[12px]"></div>
                     <span className="text-[12px] font-bold text-muted uppercase tracking-wider">Syncing Registry...</span>
                  </div>
                ) : !viewingTasks && complaints.length === 0 ? (
                  <div className="py-[60px] flex flex-col items-center justify-center text-center px-[20px]">
                     <div className="w-[48px] h-[48px] rounded-full bg-cream border border-border flex items-center justify-center mb-[12px] opacity-60">
                       <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                     </div>
                     <span className="text-[13px] font-bold text-text mb-[4px]">No Matches Found</span>
                     <p className="text-[12px] text-muted leading-relaxed">Adjust your filter parameters to see active complaints.</p>
                  </div>
                ) : !viewingTasks ? (
                  complaints.map((c) => (
                    <ComplaintCard key={c._id} complaint={c} showActions onStatusChange={handleStatusChange} onTaskCreate={handleOpenTaskModal} />
                  ))
                ) : tasks.length === 0 ? (
                    <div className="p-4 text-center text-muted text-[13px] mt-10">No Partner tasks available.</div>
                ) : (
                    tasks.map(task => (
                      <div key={task._id} className="p-4 bg-white border border-border rounded shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                        <div className="flex gap-2 justify-between mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${task.status === 'Open' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>{task.status}</span>
                          <span className="text-[12px] font-mono font-bold text-indigo-700">₹{task.budget_estimate?.toLocaleString()}</span>
                        </div>
                        <h4 className="font-bold text-[14px] text-text mb-1 leading-snug">{task.title}</h4>
                        
                        <div className="mt-3 pt-3 border-t border-border">
                          <h5 className="text-[11px] font-bold text-muted uppercase mb-2">Applications ({task.applications?.length || 0})</h5>
                          <div className="space-y-2">
                            {task.applications?.map(app => (
                              <div key={app._id} className="flex justify-between items-center bg-cream p-2.5 rounded-[4px] border border-border">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${app.role === 'Sponsor' ? 'bg-green-bg text-green border border-green/20' : 'bg-burg-bg text-burg border border-burg/20'}`}>{app.role}</span>
                                    <span className="font-mono text-[12px] font-bold text-text">₹{app.bid_amount?.toLocaleString()}</span>
                                    <span className="text-[11px] font-bold text-navy ml-1">{app.user_id?.name || 'Unknown Partner'}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-[11px] text-muted italic line-clamp-1 pr-2">{app.message || 'No message provided'}</p>
                                    {app.user_id?.phone && <span className="text-[10px] text-muted font-mono">{app.user_id.phone}</span>}
                                  </div>

                                </div>
                                {app.status === 'Pending' && task.status === 'Open' ? (
                                  <button 
                                    onClick={async () => {
                                      try {
                                        await approveTaskApplication(task._id, { application_id: app._id });
                                        fetchData();
                                        alert('Application Approved! Task Assigned.');
                                      } catch(e) { alert('Error approving application'); }
                                    }}
                                    className="bg-indigo-600 text-white text-[11px] px-3 py-1.5 rounded-[4px] font-bold hover:bg-indigo-700 shrink-0 shadow-sm"
                                  >
                                    Accept
                                  </button>
                                ) : (
                                  <span className={`text-[11px] font-bold uppercase tracking-wider shrink-0 ${app.status === 'Approved' ? 'text-green' : 'text-muted'}`}>{app.status}</span>
                                )}
                              </div>
                            ))}
                            {task.applications?.length === 0 && <span className="text-[11px] text-muted flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span> Waiting for bids...</span>}
                          </div>
                        </div>
                      </div>
                    ))
                )}
             </div>

            {/* Footer Pagination Header Fixed */}
            {pagination.pages > 1 && (
              <div className="px-[20px] py-[12px] border-t border-border bg-white flex items-center justify-between shrink-0">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost flex-1 py-[6px] text-[12px] font-bold border border-border disabled:opacity-30 mr-[8px]"
                >← Prev</button>
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider w-[80px] text-center">
                  {page} <span className="font-normal mx-1">/</span> {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="btn-ghost flex-1 py-[6px] text-[12px] font-bold border border-border disabled:opacity-30 ml-[8px]"
                >Next →</button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Task Creation Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-[12px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-[24px] py-[20px] border-b border-border bg-off flex justify-between items-center">
              <h3 className="font-bold text-[16px] text-text tracking-wide flex items-center gap-2">
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/></svg>
                 Create Partner Task
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
                <p className="text-[10px] text-muted mt-1 leading-tight">Partners will see this description to formulate their bids.</p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase mb-1">Estimated Budget (₹)</label>
                <input type="number" value={taskForm.budget_estimate} onChange={e => setTaskForm({...taskForm, budget_estimate: e.target.value})} className="input w-full bg-cream focus:border-indigo-400" required placeholder="e.g. 50000" min="1" />
                <p className="text-[10px] text-muted mt-1 leading-tight">This sets expectations for Contractors. Sponsors will know the funding target.</p>
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
  );
}
