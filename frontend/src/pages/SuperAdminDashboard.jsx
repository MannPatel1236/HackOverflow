import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Navbar from '../components/Navbar';
import { getNationalStats, getLeaderboard, createAdmin, listAdmins, deleteAdmin } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Map, 
  Award, 
  BarChart3, 
  HardHat, 
  Trash2, 
  Droplets, 
  Zap, 
  MapPin, 
  Shield,
  UserPlus,
  Users,
  ChevronRight
} from 'lucide-react';

const DEPT_ICONS = { Roads: HardHat, Sanitation: Trash2, Water: Droplets, Electricity: Zap, Other: FileText };

const SCORE_COLOR = (score) =>
  score >= 70 ? 'text-green-600 font-black' : score >= 50 ? 'text-orange-600 font-black' : 'text-burg font-black';

const SCORE_BADGE = (rating) => ({
  Excellent: 'bg-green-50 text-green-600 border-green-100',
  Average: 'bg-orange-50 text-orange-600 border-orange-100',
  Poor: 'bg-burg/5 text-burg border-burg/10',
}[rating] || 'bg-off text-dim border-border');

const INDIA_CENTER = [22.5937, 82.9629];

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
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(() => fetchAll(), 60000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, lbRes, adminRes] = await Promise.all([
        getNationalStats(),
        getLeaderboard(),
        listAdmins(),
      ]);
      setNationalStats(statsRes.data);
      setLeaderboard(lbRes.data.leaderboard);
      setAdmins(adminRes.data.admins);
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

  const stats = nationalStats?.stats;
  const stateStats = nationalStats?.state_stats || [];
  const deptBreakdown = nationalStats?.department_breakdown || [];

  const TABS = [
    { key: 'overview', label: 'Overview', icon: Globe },
    { key: 'leaderboard', label: 'Leaderboard', icon: Award },
    { key: 'admins', label: 'Personnel', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 lg:px-12 py-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-10 bg-navy rounded-full" />
              <h1 className="text-4xl font-extrabold text-navy tracking-tight uppercase">Federal Command</h1>
            </div>
            <p className="text-lg text-muted max-w-xl">
              Tier-1 national orchestration — pan-India telemetry, performance indices, and personnel management.
            </p>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-border w-fit mb-12 shadow-sm">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                tab === t.key ? 'bg-navy text-white shadow-md' : 'text-dim hover:text-navy hover:bg-off'
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ──────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-12 animate-fade-in">
            {/* National Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading && !stats ? (
                [...Array(4)].map((_, i) => <div key={i} className="h-32 bg-white border border-border rounded-2xl animate-pulse" />)
              ) : [
                { label: 'Total Nationwide', value: stats?.total_complaints?.toLocaleString(), icon: FileText, color: 'text-navy', bg: 'bg-navy/5' },
                { label: 'Avg. Resolution', value: `${stats?.resolve_pct}%`, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Mean TAT', value: `${stats?.avg_resolve_days}d`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Active Breaches', value: stats?.sla_breaches, icon: AlertTriangle, color: 'text-burg', bg: 'bg-burg/5' },
              ].map((s, i) => (
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
              ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
              {/* National Map */}
              <div className="lg:col-span-3 bg-white border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col" style={{ height: '480px' }}>
                <div className="px-8 py-6 border-b border-border flex items-center justify-between">
                  <h2 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-3">
                    <Map size={16} className="text-burg" /> Federal Telemetry Map
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
                            <div className="p-2">
                              <p className="font-extrabold text-sm text-navy mb-2 border-b border-border pb-2 uppercase tracking-wider">{s.state}</p>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between"><span className="text-muted font-bold">Caseload:</span><span className="font-extrabold text-navy">{s.total}</span></div>
                                <div className="flex justify-between"><span className="text-muted font-bold">Resolution:</span><span className="font-extrabold text-green-600">{s.resolve_pct}%</span></div>
                                <div className="flex justify-between"><span className="text-muted font-bold">Mean TAT:</span><span className="font-extrabold text-blue-600">{s.avg_resolve_days ?? '—'}d</span></div>
                              </div>
                              {s.sla_breaches > 0 && (
                                <div className="mt-2 pt-2 border-t border-border">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-burg">{s.sla_breaches} Escalations</span>
                                </div>
                              )}
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>

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

              {/* Right Panel: Dept breakdown + State table */}
              <div className="lg:col-span-2 space-y-8">
                {/* Department Breakdown */}
                <div className="bg-white border border-border rounded-3xl p-8 shadow-sm">
                  <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                    <BarChart3 size={14} className="text-burg" /> By Department
                  </h3>
                  <div className="space-y-6">
                    {deptBreakdown.map((d) => {
                      const Icon = DEPT_ICONS[d._id] || FileText;
                      const pct = stats?.total_complaints > 0 ? Math.round((d.count / stats.total_complaints) * 100) : 0;
                      return (
                        <div key={d._id}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-extrabold text-navy flex items-center gap-3"><Icon size={16} className="text-dim" /> {d._id}</span>
                            <span className="font-mono font-black text-navy text-xs">{d.count} <span className="text-dim">({pct}%)</span></span>
                          </div>
                          <div className="h-2 bg-off rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: 'circOut' }}
                              className="h-full bg-navy rounded-full"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* State Table */}
                <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
                  <div className="px-8 py-6 border-b border-border bg-off/30">
                    <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-2">
                      <Globe size={14} className="text-burg" /> State Operations Summary
                    </h3>
                  </div>
                  <div className="overflow-y-auto max-h-[220px]">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-white shadow-sm">
                        <tr className="border-b border-border">
                          <th className="px-6 py-4 text-left text-[10px] font-black text-dim uppercase tracking-widest">Jurisdiction</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-dim uppercase tracking-widest">Cases</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-dim uppercase tracking-widest">Res %</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-dim uppercase tracking-widest">Index</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stateStats.map((s) => (
                          <tr key={s._id} className="border-b border-border/60 hover:bg-off transition-colors">
                            <td className="px-6 py-4 font-extrabold text-navy text-xs">{s.state}</td>
                            <td className="px-6 py-4 text-right font-mono text-dim font-bold">{s.total}</td>
                            <td className="px-6 py-4 text-right font-mono text-dim font-bold">{s.resolve_pct}%</td>
                            <td className={`px-6 py-4 text-right font-mono text-base ${SCORE_COLOR(s.score)}`}>{s.score}</td>
                          </tr>
                        ))}
                        {stateStats.length === 0 && !loading && (
                          <tr><td colSpan={4} className="py-12 text-center text-dim text-xs font-bold uppercase tracking-widest">No data available.</td></tr>
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
          <div className="space-y-8 animate-fade-in">
            <div className="bg-white border border-border rounded-3xl p-8 flex items-start gap-6">
              <div className="w-12 h-12 rounded-2xl bg-navy/5 flex items-center justify-center text-navy shrink-0">
                <BarChart3 size={24} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-navy uppercase tracking-wider mb-2">Performance Matrix</h3>
                <p className="text-xs text-muted font-bold uppercase tracking-wide leading-relaxed">
                  Jurisdictions algorithmically ranked by composite index: <span className="text-navy">50%</span> Resolution Rate + <span className="text-navy">30%</span> Speed (TAT) + <span className="text-navy">20%</span> SLA Adherence.
                </p>
              </div>
            </div>

            <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border bg-off/50">
                      {['Rank', 'Jurisdiction', 'Total', 'Resolved', 'Mean TAT', 'Breaches', 'Index', 'Rating'].map((h) => (
                        <th key={h} className="px-6 py-5 text-[10px] font-black text-dim uppercase tracking-widest">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((row, i) => (
                      <tr key={row.state} className="border-b border-border/60 hover:bg-cream transition-colors group">
                        <td className="px-6 py-5 w-16">
                          {i < 3 ? (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 0 ? 'bg-amber-50 text-amber-600' : i === 1 ? 'bg-gray-50 text-gray-400' : 'bg-orange-50 text-orange-700'}`}>
                              <Award size={20} />
                            </div>
                          ) : (
                            <span className="text-sm font-mono font-black text-dim">#{i + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-5 font-extrabold text-navy text-base tracking-tight">{row.state}</td>
                        <td className="px-6 py-5 font-mono text-xs text-dim font-bold">{row.total.toLocaleString()}</td>
                        <td className="px-6 py-5 font-mono text-xs font-extrabold text-navy">{row.resolve_pct}%</td>
                        <td className="px-6 py-5 font-mono text-xs text-dim font-bold">{row.avg_resolve_days != null ? `${row.avg_resolve_days}d` : '—'}</td>
                        <td className="px-6 py-5 font-mono text-xs">
                          {row.sla_breaches > 0 ? (
                            <span className="px-2.5 py-1 rounded-md bg-burg/5 text-burg font-black border border-burg/10">{row.sla_breaches}</span>
                          ) : (
                            <span className="text-dim font-bold">0</span>
                          )}
                        </td>
                        <td className={`px-6 py-5 font-mono text-xl ${SCORE_COLOR(row.score)}`}>
                          {row.score}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${SCORE_BADGE(row.rating)}`}>
                            {row.rating}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {leaderboard.length === 0 && !loading && (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center text-dim text-xs font-bold uppercase tracking-widest">
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

        {/* ── ADMINS TAB ──────────────────────────── */}
        {tab === 'admins' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-fade-in">
            {/* Create Admin */}
            <div className="bg-white border border-border rounded-3xl p-10 shadow-sm h-fit">
              <h2 className="text-xs font-black text-navy uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                <UserPlus size={16} className="text-burg" /> Provision Access Profile
              </h2>
              <div className="space-y-6">
                {[
                  { label: 'Officer Full Name', field: 'name', type: 'text', placeholder: 'e.g., A. Sharma' },
                  { label: 'Official Email ID', field: 'email', type: 'email', placeholder: 'officer@gov.in' },
                  { label: 'Secure Passphrase', field: 'password', type: 'password', placeholder: '••••••••' },
                ].map((f) => (
                  <div key={f.field}>
                    <label className="block text-[10px] font-black text-dim uppercase tracking-widest mb-3">{f.label}</label>
                    <input
                      type={f.type}
                      value={newAdmin[f.field]}
                      onChange={(e) => setNewAdmin({ ...newAdmin, [f.field]: e.target.value })}
                      placeholder={f.placeholder}
                      className="input-premium py-4"
                    />
                  </div>
                ))}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-dim uppercase tracking-widest mb-3">Clearance Level</label>
                    <select
                      value={newAdmin.role}
                      onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                      className="w-full bg-off/50 border border-border rounded-xl px-4 py-4 font-bold text-navy appearance-none text-sm"
                    >
                      <option value="state_admin">State Officer (Tier 2)</option>
                      <option value="super_admin">Federal Officer (Tier 1)</option>
                    </select>
                  </div>
                  {newAdmin.role === 'state_admin' && (
                    <div className="animate-fade-in">
                      <label className="block text-[10px] font-black text-dim uppercase tracking-widest mb-3">Assigned State</label>
                      <input
                        type="text"
                        value={newAdmin.state}
                        onChange={(e) => setNewAdmin({ ...newAdmin, state: e.target.value })}
                        placeholder="e.g., Maharashtra"
                        className="input-premium py-4"
                      />
                    </div>
                  )}
                </div>

                {createMsg && (
                  <div className={`p-4 rounded-2xl border text-xs font-black uppercase tracking-widest flex items-center gap-3 ${createMsg.includes('provisioned') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-burg/5 text-burg border-burg/10'}`}>
                    {createMsg.includes('provisioned') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {createMsg}
                  </div>
                )}

                <button onClick={handleCreateAdmin} disabled={createLoading} className="btn-primary w-full py-5 mt-4">
                  {createLoading ? 'Provisioning...' : 'Provision Officer Access'}
                </button>
              </div>
            </div>

            {/* Admin List */}
            <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col" style={{ maxHeight: '700px' }}>
              <div className="px-8 py-6 border-b border-border bg-off/50 flex justify-between items-center shrink-0">
                <h2 className="text-xs font-black text-navy uppercase tracking-[0.2em] flex items-center gap-3">
                  <Shield size={14} className="text-burg" /> Active Personnel
                </h2>
                <span className="text-[10px] font-black bg-white px-3 py-1.5 rounded-xl border border-border text-navy">{admins.length} Total</span>
              </div>

              <div className="divide-y divide-border/60 overflow-y-auto flex-1 bg-cream/30">
                {admins.map((a) => (
                  <div key={a._id} className="px-8 py-6 flex items-center justify-between hover:bg-white transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center text-sm font-black">
                        {a.name?.[0] || 'A'}
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-navy tracking-tight mb-1">{a.name}</p>
                        <p className="text-[10px] font-mono text-dim font-bold tracking-wider mb-2">{a.email}</p>
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${a.role === 'super_admin' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                            {a.role === 'super_admin' ? 'Tier 1' : 'Tier 2'}
                          </span>
                          {a.state && <span className="text-[10px] font-bold text-dim flex items-center gap-1"><MapPin size={10} /> {a.state}</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(a._id)}
                      className="text-dim hover:text-burg opacity-0 group-hover:opacity-100 transition-all p-3 hover:bg-burg/5 rounded-xl"
                      title="Revoke Access"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {admins.length === 0 && !loading && (
                  <div className="p-16 text-center">
                    <Users size={32} className="text-dim mx-auto mb-4" />
                    <p className="text-xs font-bold text-dim uppercase tracking-widest">No administrative profiles found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
