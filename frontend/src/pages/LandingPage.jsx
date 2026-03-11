import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const FEATURES = [
  { icon: '🎤', title: 'Voice in Any Language', desc: 'Speak in Hindi, Tamil, Marathi, or 15+ Indian languages. Whisper AI transcribes instantly.' },
  { icon: '🤖', title: 'AI Auto-Classification', desc: 'GPT-4o classifies your complaint, assigns severity, and routes to the right department in seconds.' },
  { icon: '📍', title: 'Live Geo Heatmaps', desc: 'Municipal officers see real-time complaint density maps by district and department.' },
  { icon: '🔔', title: 'WhatsApp Updates', desc: 'Get live status notifications directly on WhatsApp. No app download needed.' },
  { icon: '📊', title: 'SLA Breach Alerts', desc: 'Complaints unresolved after 72 hours are flagged automatically to supervisors.' },
  { icon: '🏆', title: 'Municipality Rankings', desc: 'Super admin sees state-by-state leaderboard with performance scoring and analytics.' },
];

const STEPS = [
  { step: '01', title: 'Submit', desc: 'File via WhatsApp or web in your language — text or voice.' },
  { step: '02', title: 'Classify', desc: 'AI transcribes, classifies severity, and routes to the right department.' },
  { step: '03', title: 'Track', desc: 'Get a tracking link. See live status updates on WhatsApp.' },
  { step: '04', title: 'Resolve', desc: 'Municipal officers act. You\'re notified the moment it\'s fixed.' },
];

export default function LandingPage() {
  const openWhatsApp = () => {
    const number = import.meta.env.VITE_WHATSAPP_NUMBER || '14155238886';
    const msg = encodeURIComponent('Hi CivicAI');
    window.open(`https://wa.me/${number}?text=${msg}`, '_blank');
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-28">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Multilingual Urban Grievance Platform
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Your City.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Your Voice.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            File civic complaints in any Indian language via WhatsApp or web. 
            AI classifies and routes instantly. Track resolution in real time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={openWhatsApp}
              className="btn-primary text-base px-8 py-3 flex items-center gap-2.5"
            >
              <span className="text-xl">📱</span>
              File via WhatsApp
            </button>
            <Link
              to="/login"
              className="btn-secondary text-base px-8 py-3 flex items-center gap-2"
            >
              File on Website
              <span className="text-slate-500">→</span>
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-600">
            No app download • Works in Hindi, Tamil, Marathi, Telugu, Bengali & more
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">How it works</h2>
          <p className="text-slate-400">From complaint to resolution in 4 steps</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STEPS.map((s, i) => (
            <div key={i} className="card p-6 relative group hover:border-indigo-500/40 transition-all">
              <div className="font-mono text-4xl font-bold text-slate-800 mb-4 group-hover:text-indigo-900 transition-colors">
                {s.step}
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Built for impact</h2>
          <p className="text-slate-400">Every feature designed to bridge the civic disconnect</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div key={i} className="card p-6 hover:border-slate-700 transition-all group">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800 py-20">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to make your city better?</h2>
          <p className="text-slate-400 mb-8">
            Join thousands of citizens making their voices heard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={openWhatsApp} className="btn-primary px-8 py-3 text-base">
              📱 Start on WhatsApp
            </button>
            <Link to="/login" className="btn-secondary px-8 py-3 text-base">
              Sign up on Web
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/50 py-8 text-center text-sm text-slate-600">
        CivicAI — Multilingual Urban Grievance Intelligence Platform
      </footer>
    </div>
  );
}
