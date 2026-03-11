import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Navbar from '../components/Navbar';
import { getNationalStats, getLeaderboard, createAdmin, listAdmins, deleteAdmin } from '../utils/api';

const SCORE_COLOR = (score) =>
  score >= 70 ? 'text-green font-bold' : score >= 50 ? 'text-amber font-bold' : 'text-burg font-bold';

const SCORE_BADGE = (rating) => ({
  Excellent: 'text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded border inline-block bg-green-bg text-green border-green/20',
  Average: 'text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded border inline-block bg-amber-bg text-amber border-amber/20',
  Poor: 'text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded border inline-block bg-burg-bg text-burg border-burg/20',
}[rating] || 'text-[10px] font-bold uppercase tracking-wider px-[6px] py-[2px] rounded border inline-block bg-off text-muted border-border');

const RANK_MEDAL = (i) => ['🥇', '🥈', '🥉'][i] || <span className="text-[14px] text-muted font-bold font-mono">#{i + 1}</span>;

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
    if (newAdmin.role === 'state_admin' && !newAdmin.state) {
        return setCreateMsg('State is required for State Admin role');
    }
    setCreateLoading(true);
    setCreateMsg('');
    try {
      await createAdmin(newAdmin);
      setCreateMsg('✅ Admin profile securely provisioned.');
      setNewAdmin({ name: '', email: '', password: '', role: 'state_admin', state: '' });
      fetchAll();
      setTimeout(() => setCreateMsg(''), 4000);
    } catch (e) {
      setCreateMsg('❌ ' + (e.response?.data?.error || 'Authorization protocol failed.'));
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

  const TABS = ['overview', 'leaderboard', 'admins'];

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
              🌏 National Control Center
            </h1>
            <p className="text-[13px] text-muted font-medium">Super admin — pan-national orchestration and telemetry</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-[6px] mb-[24px] bg-white p-[6px] rounded-[6px] border border-border w-fit shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-[20px] py-[10px] rounded-[4px] text-[12px] font-bold uppercase tracking-wider transition-all ${
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[16px]">
              {loading ? (
                [...Array(4)].map((_, i) => <div key={i} className="card h-[100px] bg-off border border-border rounded-[6px] animate-pulse" />)
              ) : [
                { label: 'Total Nationwide', value: stats?.total_complaints?.toLocaleString(), icon: '📋', bg: 'bg-white', text: 'text-text' },
                { label: 'Avg. Resolution', value: `${stats?.resolve_pct}%`, icon: '✅', bg: 'bg-green-bg', text: 'text-green' },
                { label: 'Mean TAT', value: `${stats?.avg_resolve_days}d`, icon: '⏱️', bg: 'bg-[#EFF6FF]', text: 'text-[#1D4ED8]' },
                { label: 'Active Breaches', value: stats?.sla_breaches, icon: '🚨', bg: 'bg-burg-bg', text: 'text-burg', border: 'border-burg/20' },
              ].map((s) => (
                <div key={s.label} className={`flex flex-col gap-1 p-4 border rounded-[6px] shadow-sm hover:-translate-y-[2px] hover:shadow-card-hover transition-all ${s.bg} ${s.border || 'border-border'}`}>
                  <div className="flex justify-between items-center mb-1">
                     <div className={`text-[11px] font-bold uppercase tracking-wider ${s.text === 'text-text' ? 'text-muted' : s.text}`}>{s.label}</div>
                     <div className="opacity-50 text-[14px]">{s.icon}</div>
                  </div>
                  <div className={`font-serif text-[28px] font-black leading-none ${s.text}`}>{s.value ?? '—'}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-[24px]">
              {/* National Map */}
              <div className="lg:col-span-3 card flex flex-col relative overflow-hidden bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.03)]" style={{ height: '460px' }}>
                <div className="px-[20px] py-[16px] border-b border-border flex items-center justify-between bg-white z-20">
                  <h2 className="text-[14px] font-bold text-text uppercase tracking-wider flex items-center gap-[8px]">
                    🗺️ Federal Telemetry Map
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
                            fillColor: s.sla_breaches > 10 ? '#8b1a1a' : s.resolve_pct > 70 ? '#16543a' : '#7a5200',
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
                                  <span className="font-bold text-[#1D4ED8] bg-[#EFF6FF] px-1 rounded">{s.avg_resolve_days ?? '—'}d</span>
                                </div>
                                {s.sla_breaches > 0 && (
                                   <div className="pt-[4px] border-t border-border">
                                      <span className="text-[11px] font-bold uppercase tracking-wider text-burg flex items-center gap-1">
                                         ⚠️ {s.sla_breaches} Escalations
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
                      const ICONS = { Roads: '🛣️', Sanitation: '🗑️', Water: '💧', Electricity: '⚡', Other: '📋' };
                      const pct = stats?.total_complaints > 0 ? Math.round((d.count / stats.total_complaints) * 100) : 0;
                      return (
                        <div key={d._id}>
                          <div className="flex items-center justify-between text-[13px] mb-[6px]">
                            <span className="font-semibold text-text flex items-center gap-2">{ICONS[d._id] || '📋'} {d._id}</span>
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
               <span className="text-[20px] leading-none">📊</span>
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
                        <td className="px-[20px] py-[16px] font-mono text-[13px] text-muted">{row.avg_resolve_days != null ? `${row.avg_resolve_days}d` : '—'}</td>
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
                
                <div className="grid grid-cols-2 gap-[16px]">
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
                  <div className={`mt-[16px] p-[12px] rounded-[4px] border text-[13px] font-bold flex items-center gap-[8px] ${createMsg.startsWith('✅') ? 'bg-green-bg text-green border-green/20' : 'bg-burg-bg text-burg border-burg/20'}`}>
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
                        {a.state && <span className="text-[11px] font-semibold text-muted flex items-center gap-1">📍 {a.state}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAdmin(a._id)}
                      className="text-muted hover:text-burg opacity-0 group-hover:opacity-100 transition-all p-[8px] hover:bg-burg-bg rounded-[4px] cursor-pointer"
                      title="Revoke Access"
                    >
                      <span className="text-[18px] leading-none">🗑️</span>
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

      </div>
    </div>
  );
}
