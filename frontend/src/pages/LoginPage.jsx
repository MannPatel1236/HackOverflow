import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendOTP, verifyOTP } from '../utils/api';

export default function LoginPage() {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'name'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return setError('Enter a valid 10-digit phone number');
    setError('');
    setLoading(true);
    try {
      const res = await sendOTP(`+91${cleaned}`);
      if (res.data.dev_otp) setDevOtp(res.data.dev_otp);
      setStep('otp');
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return setError('Enter 6-digit OTP');
    setError('');
    setLoading(true);
    try {
      const res = await verifyOTP(`+91${phone.replace(/\D/g, '')}`, otp, name || undefined);
      loginUser(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <span className="text-white font-bold">CA</span>
            </div>
            <span className="font-bold text-2xl text-white">Civic<span className="text-indigo-400">AI</span></span>
          </Link>
          <p className="text-slate-400 mt-2 text-sm">
            {step === 'phone' && 'Sign in with your mobile number'}
            {step === 'otp' && 'Enter the OTP sent to your number'}
          </p>
        </div>

        <div className="card p-8 space-y-5">
          {step === 'phone' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Mobile Number</label>
                <div className="flex">
                  <div className="flex items-center px-3 bg-slate-800 border border-r-0 border-slate-700 rounded-l-xl text-slate-400 text-sm">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="input rounded-l-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
                    maxLength={10}
                  />
                </div>
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={handleSendOTP} className="btn-primary w-full py-3" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP →'}
              </button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800" /></div>
                <div className="relative text-center"><span className="bg-slate-900 px-3 text-xs text-slate-500">OR</span></div>
              </div>
              <button
                onClick={() => {
                  const number = import.meta.env.VITE_WHATSAPP_NUMBER || '14155238886';
                  window.open(`https://wa.me/${number}?text=Hi%20CivicAI`, '_blank');
                }}
                className="btn-secondary w-full py-3 flex items-center justify-center gap-2"
              >
                <span className="text-xl">📱</span>
                File via WhatsApp instead
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit OTP"
                  className="input font-mono text-lg tracking-widest text-center"
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                />
                {devOtp && (
                  <p className="text-xs text-indigo-400 mt-2 font-mono bg-indigo-500/10 px-3 py-2 rounded-lg border border-indigo-500/20">
                    🧪 Dev OTP: <strong>{devOtp}</strong> (remove in production)
                  </p>
                )}
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={handleVerifyOTP} className="btn-primary w-full py-3" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Sign In →'}
              </button>
              <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="btn-ghost w-full text-sm">
                ← Change number
              </button>
            </>
          )}

          <p className="text-center text-xs text-slate-600">
            By continuing, you agree to CivicAI's terms of service
          </p>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Are you a municipal officer?{' '}
          <Link to="/admin/login" className="text-indigo-400 hover:text-indigo-300">
            Admin login →
          </Link>
        </p>
      </div>
    </div>
  );
}
