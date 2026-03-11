import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Navbar from '../components/Navbar';
import { getNationalStats, getLeaderboard, createAdmin, listAdmins, deleteAdmin } from '../utils/api';

const SCORE_COLOR = (score) =>
  score >= 70 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';

const SCORE_BADGE = (rating) => ({
  Excellent: 'badge bg-green-500/20 text-green-400 border border-green-500/30',
  Average: 'badge bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  Poor: 'badge bg-red-500/20 text-red-400 border border-red-500/30',
}[rating] || 'badge');

const RANK_MEDAL = (i) => ['🥇', '🥈', '🥉'][i] || `#${i + 1}`;

const INDIA_CENTER = [22.5937, 82.9629];

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [nationalStats, setNationalStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'state_admin', state: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  useEffect(() => {
    fetchAll();
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
    setCreateLoading(true);
    setCreateMsg('');
    try {
      await createAdmin(newAdmin);
      setCreateMsg('✅ Admin created successfully!');
      setNewAdmin({ name: '', email: '', password: '', role: 'state_admin', state: '' });
      fetchAll();
    } catch (e) {
      setCreateMsg('❌ ' + (e.response?.data?.error || 'Failed to create admin'));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!confirm('Delete this admin?')) return;
    await deleteAdmin(id);
    fetchAll();
  };

  const stats = nationalStats?.stats;
  const stateStats = nationalStats?.state_stats || [];
  const deptBreakdown = nationalStats?.department_breakdown || [];

  const TABS = ['overview', 'leaderboard', 'admins'];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🌏</span>
              <h1 className="text-2xl font-bold text-white">National Control Center</h1>
            </div>
            <p className="text-slate-400 text-sm">Super admin — national oversight of all municipalities</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-900 p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ────────────────────────── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* National Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="stat-card animate-pulse h-20 bg-slate-800" />)
              ) : [
                { label: 'Total Complaints', value: stats?.total_complaints?.toLocaleString(), icon: '📋', color: 'text-slate-200' },
                { label: 'Resolved', value: `${stats?.resolve_pct}%`, icon: '✅', color: 'text-green-400' },
                { label: 'Avg Resolve Time', value: `${stats?.avg_resolve_days}d`, icon: '⏱️', color: 'text-blue-400' },
                { label: 'SLA Breaches', value: stats?.sla_breaches, icon: '🚨', color: 'text-red-400' },
              ].map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5">{s.icon} {s.label}</div>
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value ?? '—'}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* National Map */}
              <div className="lg:col-span-3 card overflow-hidden" style={{ height: '420px' }}>
                <div className="px-4 py-3 border-b border-slate-800">
                  <h2 className="text-sm font-semibold text-slate-300">🗺️ National Complaints Map</h2>
                </div>
                <MapContainer center={INDIA_CENTER} zoom={5} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  {stateStats.filter((s) => s.total > 0).map((s, i) => {
                    // Use approximate state centers (production: use proper GeoJSON centroids)
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
                        radius={Math.min(8 + Math.sqrt(s.total) * 1.5, 35)}
                        pathOptions={{
                          fillColor: s.sla_breaches > 10 ? '#ef4444' : s.resolve_pct > 70 ? '#22c55e' : '#f97316',
                          fillOpacity: 0.75,
                          color: '#fff',
                          weight: 1.5,
                        }}
                      >
                        <Popup>
                          <div className="text-slate-900 text-sm">
                            <p className="font-bold text-base">{s.state}</p>
                            <p>Total: {s.total} | Resolved: {s.resolve_pct}%</p>
                            <p>Avg: {s.avg_resolve_days ?? '—'}d | SLA: {s.sla_breaches}</p>
                          </div>
                        </Popup>
                      </CircleMarker>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Right Panel: Dept breakdown + State table */}
              <div className="lg:col-span-2 space-y-4">
                {/* Dept Breakdown */}
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4">By Department</h3>
                  <div className="space-y-3">
                    {deptBreakdown.map((d) => {
                      const ICONS = { Roads: '🛣️', Sanitation: '🗑️', Water: '💧', Electricity: '⚡', Other: '📋' };
                      const pct = stats?.total_complaints > 0 ? Math.round((d.count / stats.total_complaints) * 100) : 0;
                      return (
                        <div key={d._id}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-300">{ICONS[d._id] || '📋'} {d._id}</span>
                            <span className="text-slate-400 font-mono text-xs">{d.count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* State Table */}
                <div className="card overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <h3 className="text-sm font-semibold text-slate-300">State Overview</h3>
                  </div>
                  <div className="overflow-y-auto max-h-52">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="px-3 py-2 text-left text-slate-500 font-medium">State</th>
                          <th className="px-3 py-2 text-right text-slate-500 font-medium">Total</th>
                          <th className="px-3 py-2 text-right text-slate-500 font-medium">Resolved%</th>
                          <th className="px-3 py-2 text-right text-slate-500 font-medium">Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stateStats.map((s) => (
                          <tr key={s._id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="px-3 py-2 text-slate-300">{s.state}</td>
                            <td className="px-3 py-2 text-right text-slate-400">{s.total}</td>
                            <td className="px-3 py-2 text-right text-slate-400">{s.resolve_pct}%</td>
                            <td className={`px-3 py-2 text-right font-bold ${SCORE_COLOR(s.score)}`}>{s.score}</td>
                          </tr>
                        ))}
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
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Municipalities ranked by composite score: 50% resolution rate + 30% speed + 20% SLA compliance.
            </p>
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                    {['Rank', 'State', 'Filed', 'Resolved', 'Avg Time', 'SLA Breaches', 'Score', 'Rating'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((row, i) => (
                    <tr key={row.state} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3 text-lg">{RANK_MEDAL(i)}</td>
                      <td className="px-4 py-3 font-semibold text-white">{row.state}</td>
                      <td className="px-4 py-3 text-slate-400">{row.total.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-400">{row.resolve_pct}%</td>
                      <td className="px-4 py-3 text-slate-400">{row.avg_resolve_days != null ? `${row.avg_resolve_days}d` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={row.sla_breaches > 0 ? 'text-red-400 font-semibold' : 'text-slate-400'}>
                          {row.sla_breaches}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-bold text-lg ${SCORE_COLOR(row.score)}`}>
                        {row.score}
                      </td>
                      <td className="px-4 py-3">
                        <span className={SCORE_BADGE(row.rating)}>{row.rating}</span>
                      </td>
                    </tr>
                  ))}
                  {leaderboard.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                        No data yet. Complaints will appear here once filed.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ADMINS TAB ──────────────────────────── */}
        {tab === 'admins' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Admin */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-white">Create Admin Account</h2>
              {[
                { label: 'Full Name', field: 'name', type: 'text', placeholder: 'District Officer Name' },
                { label: 'Email', field: 'email', type: 'email', placeholder: 'officer@gov.in' },
                { label: 'Password', field: 'password', type: 'password', placeholder: '••••••••' },
              ].map((f) => (
                <div key={f.field}>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    value={newAdmin[f.field]}
                    onChange={(e) => setNewAdmin({ ...newAdmin, [f.field]: e.target.value })}
                    placeholder={f.placeholder}
                    className="input text-sm"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
                  <select
                    value={newAdmin.role}
                    onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                    className="input text-sm"
                  >
                    <option value="state_admin">State Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                {newAdmin.role === 'state_admin' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">State</label>
                    <input
                      type="text"
                      value={newAdmin.state}
                      onChange={(e) => setNewAdmin({ ...newAdmin, state: e.target.value })}
                      placeholder="Maharashtra"
                      className="input text-sm"
                    />
                  </div>
                )}
              </div>
              {createMsg && (
                <p className={`text-sm ${createMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                  {createMsg}
                </p>
              )}
              <button onClick={handleCreateAdmin} disabled={createLoading} className="btn-primary w-full py-2.5">
                {createLoading ? 'Creating...' : '+ Create Admin'}
              </button>
            </div>

            {/* Admin List */}
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800">
                <h2 className="font-semibold text-white text-sm">All Admins ({admins.length})</h2>
              </div>
              <div className="divide-y divide-slate-800/50 max-h-[420px] overflow-y-auto">
                {admins.map((a) => (
                  <div key={a._id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{a.name}</p>
                      <p className="text-xs text-slate-500">{a.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge text-xs ${a.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
                          {a.role.replace('_', ' ')}
                        </span>
                        {a.state && <span className="text-xs text-slate-600">{a.state}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(a._id)}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1.5 hover:bg-red-500/10 rounded-lg"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {admins.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">No admins yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
