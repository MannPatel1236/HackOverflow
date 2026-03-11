import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from 'react-leaflet';
import Navbar from '../components/Navbar';
import ComplaintCard from '../components/ComplaintCard';
import { useAuth } from '../context/AuthContext';
import { getComplaints, updateComplaintStatus, getMapData, getStateStats } from '../utils/api';
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

const SEVERITY_COLORS = {
  Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e',
};

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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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

  const handleStatusChange = async (complaintId, status) => {
    try {
      await updateComplaintStatus(complaintId, status);
      fetchData();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleMarkerClick = async (district) => {
    setSelectedDistrict(district);
    const res = await getComplaints({ district, page: 1, limit: 50 });
    setDistrictComplaints(res.data.complaints);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">
              🏛️ {stateName} Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1">Municipal officer view — manage complaints across your state</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400">Live updates on</span>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total', value: stats.stats.total, color: 'text-slate-200', icon: '📋' },
              { label: 'Resolved', value: `${stats.stats.resolve_pct}%`, color: 'text-green-400', icon: '✅' },
              { label: 'Pending', value: stats.stats.pending, color: 'text-yellow-400', icon: '⏳' },
              { label: 'SLA Breach', value: stats.stats.sla_breaches, color: 'text-red-400', icon: '⚠️' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">{s.icon} {s.label}</div>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Map */}
          <div className="lg:col-span-3">
            <div className="card overflow-hidden" style={{ height: '480px' }}>
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-300">🗺️ Complaint Heatmap</h2>
                <span className="text-xs text-slate-500">Click a marker to see complaints</span>
              </div>
              <MapContainer
                center={center}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                {mapData.filter((d) => d.lat && d.lng).map((d, i) => (
                  <CircleMarker
                    key={i}
                    center={[d.lat, d.lng]}
                    radius={Math.min(8 + d.count * 2, 30)}
                    pathOptions={{
                      fillColor: d.sla_breaches > 0 ? '#ef4444' : d.critical > 0 ? '#f97316' : '#6366f1',
                      fillOpacity: 0.7,
                      color: '#fff',
                      weight: 1.5,
                    }}
                    eventHandlers={{ click: () => handleMarkerClick(d.district) }}
                  >
                    <Popup>
                      <div className="text-slate-900">
                        <p className="font-bold">{d.district}</p>
                        <p className="text-sm">Complaints: {d.count}</p>
                        <p className="text-sm">Resolved: {d.resolved} ({Math.round(d.resolve_pct)}%)</p>
                        {d.sla_breaches > 0 && <p className="text-red-600 text-sm font-semibold">⚠️ {d.sla_breaches} SLA breach(es)</p>}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {/* District Panel */}
            {selectedDistrict && (
              <div className="card p-4 mt-4 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">📍 {selectedDistrict}</h3>
                  <button onClick={() => setSelectedDistrict(null)} className="text-slate-500 hover:text-white text-sm">✕ Close</button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {districtComplaints.length === 0 ? (
                    <p className="text-slate-500 text-sm">No complaints in this district.</p>
                  ) : (
                    districtComplaints.map((c) => (
                      <ComplaintCard key={c._id} complaint={c} showActions onStatusChange={handleStatusChange} />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Complaints List */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="px-4 py-3 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-slate-300 mb-3">Filter Complaints</h2>
                <div className="grid grid-cols-2 gap-2">
                  <select value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })} className="input text-xs py-1.5">
                    <option value="">All Departments</option>
                    {['Roads', 'Sanitation', 'Water', 'Electricity', 'Other'].map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <select value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })} className="input text-xs py-1.5">
                    <option value="">All Severity</option>
                    {['Critical', 'High', 'Medium', 'Low'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="input text-xs py-1.5">
                    <option value="">All Status</option>
                    {['Registered', 'Under Review', 'In Progress', 'Resolved'].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <select value={filters.sla_breach} onChange={(e) => setFilters({ ...filters, sla_breach: e.target.value })} className="input text-xs py-1.5">
                    <option value="">All Complaints</option>
                    <option value="true">SLA Breach Only</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Loading complaints...</div>
                ) : complaints.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No complaints found</div>
                ) : (
                  complaints.map((c) => (
                    <div key={c._id} className="p-3">
                      <ComplaintCard complaint={c} showActions onStatusChange={handleStatusChange} />
                    </div>
                  ))
                )}
              </div>

              {pagination.pages > 1 && (
                <div className="px-4 py-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-ghost text-xs disabled:opacity-30"
                  >← Prev</button>
                  <span className="text-xs text-slate-500">Page {page} of {pagination.pages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="btn-ghost text-xs disabled:opacity-30"
                  >Next →</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
