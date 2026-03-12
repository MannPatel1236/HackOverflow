import { motion } from 'framer-motion';
import { 
  Shield, 
  Globe, 
  Zap, 
  MessageSquare, 
  ChevronRight, 
  ArrowRight,
  Activity,
  Award,
  Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import RotatingEarth from '../components/ui/wireframe-dotted-globe';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream selection:bg-burg/10">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial="initial" 
              animate="animate" 
              transition={{ staggerChildren: 0.15 }}
              className="relative z-10"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-burg/5 border border-burg/10 mb-8">
                <span className="w-2 h-2 rounded-full bg-burg animate-pulse" />
                <span className="text-[10px] font-bold text-burg uppercase tracking-widest">Next-Gen Citizen Response</span>
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-6xl lg:text-7xl font-extrabold text-navy tracking-tight leading-[1.05] mb-8">
                Modernizing the <span className="text-burg underline decoration-burg/20 underline-offset-8">Grievance</span> Lifecycle.
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-xl text-muted leading-relaxed mb-12 max-w-xl">
                A high-fidelity platform designed for transparency, speed, and accountability. Bridging the gap between citizens and administration through direct AI-assisted telemetry.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
                <Link to="/login" className="btn-primary py-4 px-10 text-base">
                  Register Grievance <ArrowRight size={20} />
                </Link>
                <Link to="/login" className="btn-secondary py-4 px-10 text-base">
                  Track Progress
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-8 max-w-lg">
                <div>
                  <p className="text-3xl font-extrabold text-navy mb-1">99.9%</p>
                  <p className="text-xs font-bold text-dim uppercase tracking-wider">Uptime Reliability</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-navy mb-1">2ms</p>
                  <p className="text-xs font-bold text-dim uppercase tracking-wider">Neural Latency</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-navy mb-1">E2EE</p>
                  <p className="text-xs font-bold text-dim uppercase tracking-wider">Standard Encryption</p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative hidden lg:block"
            >
              <div className="absolute inset-0 bg-burg/5 rounded-full blur-3xl scale-125 -z-10" />
              <div className="aspect-square w-full max-w-[500px] mx-auto bg-white rounded-[40px] shadow-2xl border border-border overflow-hidden p-4">
                <div className="w-full h-full bg-off rounded-[32px] flex items-center justify-center p-8 relative">
                   <RotatingEarth className="w-full h-full opacity-80" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-burg/10 animate-ping" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Intelligence Grid */}
        <section className="py-32 bg-off/50">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="mb-20">
              <h2 className="text-xs font-bold text-burg uppercase tracking-[0.3em] mb-4">Core Capabilities</h2>
              <div className="flex flex-col lg:flex-row lg:items-end gap-8 justify-between">
                <h3 className="text-4xl lg:text-5xl font-extrabold text-navy tracking-tight max-w-2xl">
                  Built for scale. <br /> Engineered for speed.
                </h3>
                <p className="text-lg text-muted max-w-sm">
                  Our neural infrastructure handles departmental routing and citizen outreach automatically.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Zap size={24} />}
                title="Instant Routing"
                desc="Grievances are analyzed and dispatched to appropriate departments in real-time using direct Groq API integration."
              />
              <FeatureCard 
                icon={<Shield size={24} />}
                title="Secure Telemetry"
                desc="End-to-end encrypted data transmission ensures citizen privacy remains the highest priority for the administration."
              />
              <FeatureCard 
                icon={<Globe size={24} />}
                title="Multilingual Support"
                desc="Support for multiple regional languages ensures every citizen has a voice, powered by neural translation."
              />
              <FeatureCard 
                icon={<Activity size={24} />}
                title="Live Monitoring"
                desc="Administrators can monitor regional grievance trends and departmental efficiency through live metrics dashboards."
              />
              <FeatureCard 
                icon={<Award size={24} />}
                title="SLA Accountability"
                desc="Built-in Service Level Agreement monitoring ensures grievances are addressed within mandated timelines."
              />
              <FeatureCard 
                icon={<Lock size={24} />}
                title="Audit Trail"
                desc="Immutability of status logs provides a complete audit trail of the entire grievance lifecycle for transparency."
              />
            </div>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
              <div className="md:col-span-1">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <span className="font-sans text-lg font-extrabold text-navy tracking-tight uppercase">CIVICAI</span>
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  The infrastructure for a better governance experience.
                </p>
              </div>
              <div>
                 <h4 className="text-xs font-bold text-navy uppercase tracking-widest mb-6">Regional Commands</h4>
                 <ul className="space-y-3 text-sm text-dim">
                    <li className="hover:text-burg transition-colors cursor-pointer">Maharashtra</li>
                    <li className="hover:text-burg transition-colors cursor-pointer">Gujarat</li>
                    <li className="hover:text-burg transition-colors cursor-pointer">Karnataka</li>
                 </ul>
              </div>
              <div>
                 <h4 className="text-xs font-bold text-navy uppercase tracking-widest mb-6">Protocols</h4>
                 <ul className="space-y-3 text-sm text-dim">
                    <li className="hover:text-burg transition-colors cursor-pointer">Neural Routing</li>
                    <li className="hover:text-burg transition-colors cursor-pointer">Telemetry Docs</li>
                    <li className="hover:text-burg transition-colors cursor-pointer">Open Source</li>
                 </ul>
              </div>
              <div>
                 <h4 className="text-xs font-bold text-navy uppercase tracking-widest mb-6">Security</h4>
                 <ul className="space-y-3 text-sm text-dim">
                    <li className="hover:text-burg transition-colors cursor-pointer">Data Encryption</li>
                    <li className="hover:text-burg transition-colors cursor-pointer">Citizen Privacy</li>
                 </ul>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border gap-4">
              <p className="text-xs text-dim">© 2026 CIVICAI. FEDERAL SYSTEMS ACTIVE.</p>
              <div className="flex gap-8">
                 <span className="text-xs text-dim hover:text-navy cursor-pointer">TERMS_OF_SERVICE</span>
                 <span className="text-xs text-dim hover:text-navy cursor-pointer">PRIVACY_PROTOCOL</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="card-premium group">
      <div className="w-12 h-12 rounded-2xl bg-off flex items-center justify-center text-navy mb-6 group-hover:bg-burg group-hover:text-white transition-all duration-500">
        {icon}
      </div>
      <h4 className="text-xl font-extrabold text-navy mb-4 tracking-tight">{title}</h4>
      <p className="text-sm text-muted leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
