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
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-white grid grid-cols-1 md:grid-cols-2 border-b border-border">
        <div className="px-6 md:px-12 py-12 md:py-20 flex flex-col justify-center">
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-burg mb-[14px] flex items-center gap-[10px] before:content-[''] before:w-5 before:h-[2px] before:bg-burg">
            Welcome to the
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl md:text-[clamp(28px,3.2vw,48px)] font-black leading-[1.1] text-text mb-[18px]">
            <em className="italic text-burg not-italic:font-serif">Official CivicAI</em><br/>
            Government<br/>
            Grievance Platform
          </h1>
          <p className="text-[14px] text-muted leading-[1.8] max-w-[390px] mb-[28px]">
            CivicAI empowers every Indian citizen to report urban issues in their native language — via voice, text, or WhatsApp. AI routes complaints instantly to the right municipal department.
          </p>
          <div className="flex gap-[12px]">
            <Link to="/login" className="btn-primary">
              Register / Sign Up
            </Link>
            <Link to="/file-complaint" className="btn-ghost border border-border bg-transparent text-text hover:border-burg hover:text-burg">
              File Complaint 📝
            </Link>
          </div>
        </div>
        
        {/* Right side graphical hero */}
        <div className="bg-cream relative overflow-hidden flex items-center justify-center min-h-[380px] hidden md:flex">
           <div className="absolute inset-0 flex items-center justify-center opacity-20">
             {/* Abstract Map Graphic */}
            <svg viewBox="0 0 300 340" width="340" height="340">
              <defs>
                <pattern id="dotpat" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                  <circle cx="5" cy="5" r="1.5" fill="#8B1A1A"/>
                </pattern>
                <mask id="indiamask">
                  <path d="M148 20 L175 28 L205 48 L228 72 L248 100 L260 130 L258 162 L248 190 L232 216 L210 240 L188 262 L166 282 L148 298 L130 282 L108 262 L86 240 L64 216 L48 190 L38 162 L36 130 L48 100 L68 72 L91 48 L121 28 Z" fill="white"/>
                </mask>
              </defs>
              <rect width="300" height="340" fill="url(#dotpat)" mask="url(#indiamask)"/>
              <circle cx="148" cy="195" r="5" fill="#8B1A1A" opacity="0.8"/>
              <circle cx="148" cy="195" r="9" fill="none" stroke="#8B1A1A" strokeWidth="1.5" opacity="0.4"/>
              <circle cx="160" cy="135" r="4" fill="#8B1A1A" opacity="0.7"/>
              <circle cx="190" cy="210" r="4" fill="#8B1A1A" opacity="0.7"/>
              <circle cx="168" cy="260" r="4" fill="#8B1A1A" opacity="0.7"/>
            </svg>
          </div>
          <div className="absolute bottom-[28px] left-[32px] font-serif text-[18px] font-bold text-text z-10">
            Welcome to <span className="text-burg italic">India!</span>
          </div>
        </div>
      </section>

      {/* DASHBOARD STATS */}
      <section className="bg-white border-b border-border py-16 px-6 md:px-12">
        <div className="text-[10px] font-bold tracking-[3px] uppercase text-burg mb-2 flex items-center gap-[10px] before:content-[''] before:w-6 before:h-[2px] before:bg-burg">
          Dashboard
        </div>
        <h2 className="font-serif text-[30px] font-bold leading-[1.2] text-text">Platform at a Glance</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 border border-border rounded-md overflow-hidden mt-9">
          <div className="stat-card">
            <div className="font-serif text-[38px] font-black leading-none text-burg">4.2L<span className="text-[18px]">+</span></div>
            <div className="text-[12px] font-semibold text-text mt-[5px]">Complaints Filed</div>
            <div className="text-[10px] text-muted mt-[2px]">Nationwide total</div>
            <div className="w-full h-[3px] bg-border rounded-sm mt-3 overflow-hidden">
              <div className="h-full bg-burg rounded-sm w-[92%] animate-[barIn_1.2s_ease_both]"></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="font-serif text-[38px] font-black leading-none text-green">840<span className="text-[18px]">+</span></div>
            <div className="text-[12px] font-semibold text-text mt-[5px]">Municipalities</div>
            <div className="text-[10px] text-muted mt-[2px]">Onboarded cities</div>
            <div className="w-full h-[3px] bg-border rounded-sm mt-3 overflow-hidden">
              <div className="h-full bg-green rounded-sm w-[65%] animate-[barIn_1.2s_ease_both]"></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="font-serif text-[38px] font-black leading-none text-amber">48<span className="text-[18px]">hr</span></div>
            <div className="text-[12px] font-semibold text-text mt-[5px]">Avg Resolution</div>
            <div className="text-[10px] text-muted mt-[2px]">Down from 28 days</div>
            <div className="w-full h-[3px] bg-border rounded-sm mt-3 overflow-hidden">
              <div className="h-full bg-amber rounded-sm w-[78%] animate-[barIn_1.2s_ease_both]"></div>
            </div>
          </div>
          <div className="stat-card border-r-0">
            <div className="font-serif text-[38px] font-black leading-none text-burg">22<span className="text-[18px]">+</span></div>
            <div className="text-[12px] font-semibold text-text mt-[5px]">Languages</div>
            <div className="text-[10px] text-muted mt-[2px]">All Indian languages</div>
            <div className="w-full h-[3px] bg-border rounded-sm mt-3 overflow-hidden">
              <div className="h-full bg-burg rounded-sm w-[88%] animate-[barIn_1.2s_ease_both]"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-cream py-16 px-6 md:px-12 border-b border-border relative overflow-hidden">
        <div className="absolute right-[-30px] top-1/2 -translate-y-1/2 font-serif text-[180px] font-black text-black/5 pointer-events-none whitespace-nowrap tracking-[-6px] leading-none select-none">
          AI
        </div>
        <div className="relative z-10">
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-burg mb-2 flex items-center gap-[10px] before:content-[''] before:w-6 before:h-[2px] before:bg-burg">
            Process
          </div>
          <h2 className="font-serif text-[30px] font-bold leading-[1.2] text-text">From Complaint to Resolution</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 mt-14 relative">
           <div className="hidden md:block absolute top-[33px] left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-burg via-amber to-green z-0"></div>
          {STEPS.map((s, i) => (
            <div key={i} className="flex flex-col items-center text-center px-2 relative z-10 group">
              <div className="w-[66px] h-[66px] rounded-full bg-white border border-border flex items-center justify-center font-bold text-[22px] text-burg mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] group-hover:border-burg group-hover:shadow-[0_6px_24px_rgba(139,26,26,0.18)] group-hover:scale-[1.07] transition-all duration-250">
                {s.step}
              </div>
              <h3 className="text-[13px] font-bold text-text mb-1">{s.title}</h3>
              <p className="text-[11px] text-muted leading-[1.55] max-w-[200px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16 px-6 md:px-12 border-b border-border">
        <div className="mb-10 text-center flex flex-col items-center">
           <div className="text-[10px] font-bold tracking-[3px] uppercase text-burg mb-2 flex items-center gap-[10px] before:content-[''] before:w-6 before:h-[2px] before:bg-burg after:content-[''] after:w-6 after:h-[2px] after:bg-burg">
            Key Features
          </div>
          <h2 className="font-serif text-[30px] font-bold leading-[1.2] text-text max-w-lg">
            Built for impact and transparency
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {FEATURES.map((f, i) => (
            <div key={i} className="card p-[22px] flex flex-col gap-2">
              <div className="text-[26px]">{f.icon}</div>
              <h3 className="text-[14px] font-bold text-text">{f.title}</h3>
              <p className="text-[12px] text-muted leading-[1.6]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Layer */}
      <section className="bg-cream py-16 border-b border-border">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="font-serif text-3xl font-bold text-text mb-4">Ready to make your city better?</h2>
          <p className="text-muted text-sm mb-8">
            Join thousands of citizens making their voices heard across India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={openWhatsApp} className="btn-primary flex items-center justify-center gap-2">
              <span className="text-lg">📱</span> File on WhatsApp
            </button>
            <Link to="/login" className="btn-secondary">
              Sign up on Web
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer bg-navy pt-10 pb-5 px-6 md:px-12 flex-1 mt-auto">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-8 border-b border-white/10">
            <div>
               <div className="font-serif text-[18px] text-white mb-[7px]">CivicAI</div>
               <p className="text-[12px] text-white/30 leading-[1.7] max-w-[220px]">
                 Multilingual Urban Grievance Intelligence Platform for modern India.
               </p>
            </div>
            <div>
               <div className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-[12px]">Portals</div>
               <div className="flex flex-col gap-2">
                  <Link to="/login" className="text-[12px] text-white/40 hover:text-white transition-colors">Citizen Portal</Link>
                  <Link to="/admin/login" className="text-[12px] text-white/40 hover:text-white transition-colors">Official Dashboard</Link>
               </div>
            </div>
            <div>
               <div className="text-[9px] font-bold tracking-[2px] uppercase text-white/25 mb-[12px]">Legal</div>
               <div className="flex flex-col gap-2">
                  <span className="text-[12px] text-white/40 cursor-default">Privacy Policy</span>
                  <span className="text-[12px] text-white/40 cursor-default">Terms of Service</span>
               </div>
            </div>
         </div>
         <div className="flex justify-between items-center pt-[18px]">
            <div className="text-[10px] text-white/20">© 2026 CivicAI India</div>
            <div className="flex rounded-[2px] overflow-hidden">
               <div className="h-[10px] w-[20px] bg-[#FF9933]"></div>
               <div className="h-[10px] w-[20px] bg-white"></div>
               <div className="h-[10px] w-[20px] bg-[#138808]"></div>
            </div>
         </div>
      </footer>
    </div>
  );
}
