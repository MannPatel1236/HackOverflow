import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Phone, 
  Key, 
  ArrowRight, 
  AlertTriangle,
  Zap,
  Lock,
  ChevronLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) return setError('INVALID_TELEMETRY_ID');
    setLoading(true);
    setError('');
    try {
      await sendOTP(phone);
      setStep(2);
      setTimer(30);
    } catch (err) {
      setError(err.response?.data?.error || 'TRANSMISSION_FAILED');
    } finally {
      setLoading(false);
    }
  };

  const { loginUser } = useAuth();

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError('INVALID_KEY_SEQUENCE');
    setLoading(true);
    setError('');
    try {
      const res = await verifyOTP(phone, otp);
      loginUser(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'VERIFICATION_FAILED');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-burg/[0.02] rounded-full blur-3xl pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg relative z-10"
        >
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center text-white mx-auto mb-6 shadow-xl">
               <Shield size={32} />
            </div>
            <h1 className="text-4xl font-extrabold text-navy tracking-tight uppercase mb-2">Citizen Uplink</h1>
            <p className="text-muted font-medium uppercase text-xs tracking-[0.2em]">Secure Authentication Gateway</p>
          </div>

          <div className="card-premium p-10 bg-white/40 backdrop-blur-xl">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendOTP}
                  className="space-y-8"
                >
                  <div>
                    <label className="text-xs font-bold text-navy uppercase tracking-widest block mb-4">Phone Telemetry</label>
                    <div className="relative group">
                       <div className="absolute left-5 top-1/2 -translate-y-1/2 text-dim group-focus-within:text-burg transition-colors">
                         <Phone size={20} />
                       </div>
                       <input
                         type="tel"
                         value={phone}
                         onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                         placeholder="Enter 10-digit number"
                         className="input-premium pl-14"
                         required
                       />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-burg/5 border border-burg/10 rounded-xl text-burg text-xs font-bold uppercase tracking-wide animate-shake">
                      <AlertTriangle size={16} /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-5 text-base relative group overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {loading ? 'Initiating Link...' : 'Generate OTP'} <ArrowRight size={20} />
                    </span>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </button>

                  <p className="text-[10px] text-dim text-center uppercase tracking-widest leading-relaxed">
                    By continuing, you agree to the <span className="text-navy font-bold cursor-pointer hover:text-burg">Citizen Data Protocol</span> and <span className="text-navy font-bold cursor-pointer hover:text-burg">Federal Service Terms</span>.
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOTP}
                  className="space-y-8"
                >
                  <button onClick={() => setStep(1)} className="flex items-center gap-2 text-xs font-bold text-muted hover:text-burg transition-colors uppercase tracking-widest mb-2">
                    <ChevronLeft size={16} /> Re-enter Phone
                  </button>

                  <div>
                    <label className="text-xs font-bold text-navy uppercase tracking-widest block mb-4">Verification Sequence</label>
                    <div className="relative group">
                       <div className="absolute left-5 top-1/2 -translate-y-1/2 text-dim group-focus-within:text-burg transition-colors focus-within:">
                         <Key size={20} />
                       </div>
                       <input
                         type="text"
                         value={otp}
                         onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                         placeholder="000000"
                         className="input-premium pl-14 tracking-[0.8em] text-lg font-extrabold"
                         required
                       />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-burg/5 border border-burg/10 rounded-xl text-burg text-xs font-bold uppercase tracking-wide">
                      <AlertTriangle size={16} /> {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full py-5 text-base"
                    >
                      {loading ? 'Verifying Link...' : 'Authorize Access'}
                    </button>
                    
                    <button
                      type="button"
                      disabled={timer > 0 || loading}
                      onClick={handleSendOTP}
                      className="w-full py-3 text-xs font-bold text-dim hover:text-navy disabled:opacity-50 transition-colors uppercase tracking-widest"
                    >
                      {timer > 0 ? `Resend Signal in ${timer}s` : 'Request New Sequence'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 opacity-40">
             <div className="flex items-center gap-2">
                <Lock size={12} className="text-navy" />
                <span className="text-[9px] font-bold text-navy uppercase tracking-widest">E2EE Secured</span>
             </div>
             <div className="flex items-center gap-2">
                <Zap size={12} className="text-navy" />
                <span className="text-[9px] font-bold text-navy uppercase tracking-widest">Neural Fast-Link</span>
             </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}


