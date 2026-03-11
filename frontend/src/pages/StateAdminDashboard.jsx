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
  Critical: '#8b1a1a', High: '#7a5200', Medium: '#1d4ed8', Low: '#16543a',
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
              🏛️ {stateName} Dashboard
            </h1>
            <p className="text-[13px] text-muted font-medium">Municipal officer view — manage and analyze complaints across your state</p>
          </div>
          <div className="flex items-center gap-[6px] bg-white px-[12px] py-[6px] rounded-[4px] border border-border shrink-0">
            <div className="w-[8px] h-[8px] rounded-full bg-green animate-pulse" />
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider mt-[1px]">Live Network Active</span>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[16px] mb-[24px]">
             
            <div className="flex flex-col gap-1 p-4 border border-border rounded-[6px] bg-white shadow-sm hover:-translate-y-[2px] hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-center mb-1">
                 <div className="text-[11px] font-bold text-muted uppercase tracking-wider">Total Volume</div>
                 <div className="opacity-50 text-[14px]">📋</div>
              </div>
              <div className="font-serif text-[28px] font-black text-text leading-none">{stats.stats.total}</div>
            </div>

            <div className="flex flex-col gap-1 p-4 border border-border rounded-[6px] bg-green-bg shadow-sm hover:-translate-y-[2px] hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-center mb-1">
                 <div className="text-[11px] font-bold text-green uppercase tracking-wider">Resolution Rate</div>
                 <div className="opacity-50 text-[14px]">✅</div>
              </div>
              <div className="font-serif text-[28px] font-black text-green leading-none">{stats.stats.resolve_pct}%</div>
            </div>

            <div className="flex flex-col gap-1 p-4 border border-border rounded-[6px] bg-amber-bg shadow-sm hover:-translate-y-[2px] hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-center mb-1">
                 <div className="text-[11px] font-bold text-amber uppercase tracking-wider">Active Pending</div>
                 <div className="opacity-50 text-[14px]">⏳</div>
              </div>
              <div className="font-serif text-[28px] font-black text-amber leading-none">{stats.stats.pending}</div>
            </div>

            <div className="flex flex-col gap-1 p-4 border border-burg/20 rounded-[6px] bg-burg-bg shadow-sm hover:-translate-y-[2px] hover:shadow-card-hover transition-all">
              <div className="flex justify-between items-center mb-1">
                 <div className="text-[11px] font-bold text-burg uppercase tracking-wider">SLA Breaches</div>
                 <div className="opacity-50 text-[14px]">⚠️</div>
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
                  🗺️ Spatial Grievance Heatmap
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
                  {mapData.filter((d) => d.lat && d.lng).map((d, i) => (
                    <CircleMarker
                      key={i}
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
                          <p className="font-bold text-[14px] text-text mb-[6px] border-b border-border pb-[4px]">{d.district}</p>
                          <div className="flex justify-between items-center text-[12px] mb-[2px]">
                             <span className="text-muted font-medium">Total Tickets:</span>
                             <span className="font-bold text-text">{d.count}</span>
                          </div>
                          <div className="flex justify-between items-center text-[12px] mb-[6px]">
                             <span className="text-muted font-medium">Resolution Rate:</span>
                             <span className="font-bold text-green bg-green-bg px-1 rounded">{Math.round(d.resolve_pct)}%</span>
                          </div>
                          {d.sla_breaches > 0 && (
                             <div className="mt-[8px] pt-[6px] border-t border-border">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-burg flex items-center gap-1">
                                   ⚠️ {d.sla_breaches} SLA Breaches Active
                                </span>
                             </div>
                          )}
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Floating District Panel (Displays when selected) */}
            {selectedDistrict && (
              <div className="absolute bottom-[20px] left-[20px] right-[20px] max-h-[40%] bg-white/95 backdrop-blur-md rounded-[8px] shadow-[0_12px_48px_rgba(0,0,0,0.15)] border border-border z-30 flex flex-col animate-fade-in overflow-hidden">
                <div className="flex items-center justify-between px-[20px] py-[14px] border-b border-border bg-white sticky top-0 z-10">
                  <h3 className="font-bold text-[15px] text-text flex items-center gap-2">
                     📍 <span className="uppercase tracking-wide">{selectedDistrict} District</span>
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
                <div className="grid grid-cols-2 gap-[10px]">
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
                {loading ? (
                  <div className="py-[40px] flex flex-col items-center justify-center text-center">
                     <div className="w-[30px] h-[30px] border-[2px] border-burg/30 border-t-burg rounded-full animate-spin mb-[12px]"></div>
                     <span className="text-[12px] font-bold text-muted uppercase tracking-wider">Syncing Registry...</span>
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="py-[60px] flex flex-col items-center justify-center text-center px-[20px]">
                     <div className="text-[32px] mb-[12px] opacity-60">📭</div>
                     <span className="text-[13px] font-bold text-text mb-[4px]">No Matches Found</span>
                     <p className="text-[12px] text-muted leading-relaxed">Adjust your filter parameters to see active complaints.</p>
                  </div>
                ) : (
                  complaints.map((c) => (
                    <ComplaintCard key={c._id} complaint={c} showActions onStatusChange={handleStatusChange} />
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
    </div>
  );
}
