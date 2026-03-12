import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Navbar from '../components/Navbar';
import ComplaintCard from '../components/ComplaintCard';
import { useAuth } from '../context/AuthContext';
import { getComplaints, updateComplaintStatus, getMapData, getStateStats } from '../utils/api';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Map, 
  RefreshCw, 
  MapPin, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  Shield
} from 'lucide-react';

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

function getDensityColor(count) {
  if (count >= 31) return '#ef4444';
  if (count >= 16) return '#f97316';
  if (count >= 6) return '#eab308';
  return '#22c55e';
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters, page, stateName]);

  useEffect(() => {
    fetchData();
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
      throw e;
    }
  };

  const handleMarkerClick = async (district) => {
    setSelectedDistrict(district);
    const res = await getComplaints({ district, page: 1, limit: 50 });
    setDistrictComplaints(res.data.complaints);
  };

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

  const statCards = [
    { label: 'Total Volume', value: stats?.stats?.total, icon: FileText, color: 'text-navy', bg: 'bg-navy/5' },
    { label: 'Resolution Rate', value: stats?.stats?.resolve_pct ? `${stats.stats.resolve_pct}%` : '—', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Pending', value: stats?.stats?.pending, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'SLA Breaches', value: stats?.stats?.sla_breaches, icon: AlertTriangle, color: 'text-burg', bg: 'bg-burg/5' },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-10 bg-burg rounded-full" />
              <h1 className="text-4xl font-extrabold text-navy tracking-tight uppercase">{stateName} Command</h1>
            </div>
            <p className="text-lg text-muted max-w-xl">
              Regional operations center — manage, analyze, and route grievances across your jurisdiction.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {lastUpdated && (
              <span className="text-[10px] font-bold text-dim uppercase tracking-widest">
                Synced {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-border text-xs font-black text-navy uppercase tracking-widest hover:bg-off transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-border">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-black text-navy uppercase tracking-widest">Live</span>
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {loading && !stats ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white border border-border rounded-2xl animate-pulse" />
            ))
          ) : (
            statCards.map((s, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={s.label}
                className="bg-white border border-border rounded-2xl p-8 hover:shadow-md transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.color} mb-6 group-hover:scale-110 transition-transform`}>
                  <s.icon size={24} />
                </div>
                <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-4xl font-extrabold text-navy tracking-tight">{s.value ?? '—'}</p>
              </motion.div>
            ))
          )}
        </section>

        {/* Main Layout: Map + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
          {/* Map Column */}
          <div className="lg:col-span-2 flex flex-col gap-6 relative">
            <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col relative z-10">
              <div className="px-8 py-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-3">
                  <Map size={16} className="text-burg" /> Spatial Heatmap
                </h2>
                <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#1d4ed8]" /> Standard</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-[#7a5200]" /> Elevated</span>
                  <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-burg" /> Critical</span>
                </div>
              </div>
              <div className="flex-1 w-full bg-cream relative z-10 block" style={{ minHeight: '420px' }}>
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
                        <div className="p-2">
                          <p className="font-extrabold text-sm text-navy mb-2 border-b border-border pb-2 uppercase tracking-wider">{d.district || 'Location'}</p>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted font-bold uppercase tracking-wider">Caseload:</span>
                              <span className="font-mono font-extrabold text-navy">{d.count}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted font-bold uppercase tracking-wider">Resolved:</span>
                              <span className="font-mono font-extrabold text-green-600">{d.resolved}</span>
                            </div>
                          </div>
                          {d.sla_breaches > 0 && (
                            <div className="mt-2 pt-2 border-t border-border">
                              <span className="text-[10px] font-black uppercase tracking-widest text-burg flex items-center gap-1">
                                ⚠ {d.sla_breaches} Breaches Active
                              </span>
                            </div>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>

                {/* Density Legend */}
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md rounded-2xl border border-border shadow-lg p-4 z-[1000]">
                  <div className="text-[9px] font-black text-dim uppercase tracking-[0.2em] mb-3">Density</div>
                  <div className="space-y-2">
                    {[
                      { color: '#22c55e', label: '1–5' },
                      { color: '#eab308', label: '6–15' },
                      { color: '#f97316', label: '16–30' },
                      { color: '#ef4444', label: '31+' },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                        <span className="text-[10px] font-bold text-dim">{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Floating District Panel */}
            <AnimatePresence>
              {selectedDistrict && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-6 left-6 right-6 max-h-[40%] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-border z-30 flex flex-col overflow-hidden"
                >
                  <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-white sticky top-0 z-10">
                    <h3 className="font-extrabold text-navy uppercase tracking-wider flex items-center gap-3">
                      <MapPin size={16} className="text-burg" /> {selectedDistrict} District
                    </h3>
                    <button onClick={() => setSelectedDistrict(null)} className="p-2 rounded-xl bg-off hover:bg-burg/5 hover:text-burg text-dim transition-all">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto flex-1 bg-cream/30 space-y-4">
                    {districtComplaints.length === 0 ? (
                      <p className="text-muted text-sm text-center py-8 font-bold uppercase tracking-widest">No active cases in this jurisdcition.</p>
                    ) : (
                      districtComplaints.map((c) => (
                        <ComplaintCard key={c._id} complaint={c} showActions onStatusChange={handleStatusChange} />
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar: Filter + List */}
          <div className="lg:col-span-1 flex flex-col bg-white border border-border rounded-3xl shadow-sm overflow-hidden">
            {/* Filter Section */}
            <div className="px-6 py-6 border-b border-border bg-off/50 shrink-0 space-y-4">
              <h2 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-2">
                <Activity size={14} className="text-burg" /> Registry Filter
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="bg-white border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-navy appearance-none">
                  <option value="">All Depts</option>
                  {['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'].map((d) => <option key={d}>{d}</option>)}
                </select>
                <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="bg-white border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-navy appearance-none">
                  <option value="">All Severity</option>
                  {['Critical', 'High', 'Medium', 'Low'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="bg-white border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-navy appearance-none">
                  <option value="">All Status</option>
                  {['Registered', 'Under Review', 'In Progress', 'Resolved'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <select value={filters.sla_breach} onChange={(e) => setFilters({ ...filters, sla_breach: e.target.value })} className="bg-burg border-burg text-white rounded-xl px-3 py-2.5 text-xs font-black appearance-none">
                  <option value="">SLA Filter</option>
                  <option value="true">Breaches Only</option>
                </select>
              </div>
            </div>

            {/* Scrollable Complaint List */}
            <div className="flex-1 overflow-y-auto bg-cream/30 p-4 space-y-4">
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-8 h-8 border-2 border-burg/30 border-t-burg rounded-full animate-spin mb-4" />
                  <span className="text-[10px] font-black text-dim uppercase tracking-widest">Syncing Registry...</span>
                </div>
              ) : complaints.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-off rounded-full flex items-center justify-center text-dim mb-6">
                    <FileText size={32} />
                  </div>
                  <span className="text-sm font-extrabold text-navy mb-2 tracking-tight">No Matches Found</span>
                  <p className="text-xs text-muted font-bold uppercase tracking-wider">Adjust filter parameters to view active complaints.</p>
                </div>
              ) : (
                complaints.map((c) => (
                  <ComplaintCard key={c._id} complaint={c} showActions onStatusChange={handleStatusChange} />
                ))
              )}
            </div>

            {/* Footer Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-border bg-white flex items-center justify-between shrink-0">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl bg-off border border-border text-navy disabled:opacity-30 hover:bg-white transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[10px] font-black text-navy uppercase tracking-widest">
                  {page} <span className="text-dim mx-1">/</span> {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="p-2.5 rounded-xl bg-off border border-border text-navy disabled:opacity-30 hover:bg-white transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
