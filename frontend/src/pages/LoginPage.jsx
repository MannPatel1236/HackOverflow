import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendOTP, verifyOTP } from '../utils/api';

export default function LoginPage() {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Citizen');
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
      const res = await verifyOTP(`+91${phone.replace(/\D/g, '')}`, otp, name || undefined, role);
      loginUser(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (e) {
      setError(e.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Topbar matching Auth Page */}
      <div className="bg-white border-b border-border px-12 h-[52px] flex items-center justify-between">
        <Link to="/" className="bg-transparent border border-border rounded-[4px] px-[14px] py-[6px] text-[12px] font-semibold text-text cursor-pointer flex items-center gap-[6px] transition-all duration-150 hover:border-burg hover:text-burg">
          ← Back
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-[460px] bg-white rounded-[8px] border border-border overflow-hidden shadow-[0_16px_56px_rgba(0,0,0,0.09)] animate-fade-in">
          {/* Card Head */}
          <div className="bg-navy px-[28px] py-[26px] text-center">
            <div className="flex items-center justify-center gap-[9px] mb-[3px]">
              <div className="w-[20px] h-[20px] rounded-full border-2 border-burg relative flex items-center justify-center shrink-0">
                <div className="w-[5px] h-[5px] rounded-full bg-burg"></div>
              </div>
              <span className="font-serif text-[17px] text-white font-bold">
                Civic<span className="text-burg">AI</span>
              </span>
            </div>
            <div className="text-[11px] text-white/33 uppercase tracking-[1px]">
              {step === 'phone' ? 'Citizen Login / Register' : 'OTP Verification'}
            </div>
          </div>

          <div className="p-[28px]">
            {step === 'phone' && (
              <>
                <div className="mb-[14px]">
                  <label className="block text-[11px] font-semibold text-text mb-[4px]">Mobile Number</label>
                  <div className="flex">
                    <div className="flex items-center px-3 bg-cream border-[1.5px] border-r-0 border-border rounded-l-[5px] text-muted text-[13px] font-mono font-semibold select-none">
                      +91
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
                {error && <p className="text-burg text-xs mb-3">{error}</p>}
                
                <button onClick={handleSendOTP} className="w-full p-[12px] rounded-[5px] bg-burg hover:bg-burg-2 text-white border-none text-[14px] font-bold cursor-pointer transition-all duration-200 shadow-[0_4px_14px_rgba(139,26,26,0.28)] mt-[4px]" disabled={loading}>
                  {loading ? 'Sending...' : 'Send OTP →'}
                </button>

                <div className="text-center text-[11px] text-dim my-[14px] relative before:content-[''] before:absolute before:top-1/2 before:left-0 before:w-[38%] before:h-[1px] before:bg-border after:content-[''] after:absolute after:top-1/2 after:right-0 after:w-[38%] after:h-[1px] after:bg-border">
                  OR
                </div>

                <button
                  onClick={() => {
                    const number = import.meta.env.VITE_WHATSAPP_NUMBER || '14155238886';
                    window.open(`https://wa.me/${number}?text=Hi%20CivicAI`, '_blank');
                  }}
                  className="w-full p-[10px] rounded-[5px] bg-[#25D366] hover:bg-[#20bd5a] text-white border-none text-[13px] font-semibold cursor-pointer flex items-center justify-center gap-[8px] transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  File via WhatsApp instead
                </button>
              </>
            )}

            {step === 'otp' && (
              <>
                <div className="mb-[14px]">
                  <label className="block text-[11px] font-semibold text-text mb-[4px]">
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

                {/* Role Selector */}
                <div className="mb-[14px]">
                  <label className="block text-[11px] font-semibold text-text mb-[8px]">I am registering as</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('Citizen')}
                      className={`p-3 rounded-[5px] border text-[12px] font-bold transition-all cursor-pointer ${
                        role === 'Citizen'
                          ? 'border-burg bg-burg/5 text-burg'
                          : 'border-border text-muted hover:border-burg/40'
                      }`}
                    >
                      🏠 Citizen
                      <p className="text-[10px] font-normal opacity-70 mt-0.5">File complaints</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('Partner')}
                      className={`p-3 rounded-[5px] border text-[12px] font-bold transition-all cursor-pointer ${
                        role === 'Partner'
                          ? 'border-navy bg-navy/5 text-navy'
                          : 'border-border text-muted hover:border-navy/40'
                      }`}
                    >
                      🏗️ Partner
                      <p className="text-[10px] font-normal opacity-70 mt-0.5">Contractor / Sponsor</p>
                    </button>
                  </div>
                </div>
                <div className="mb-[14px]">
                  <label className="block text-[11px] font-semibold text-text mb-[4px]">6-Digit OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter OTP"
                    className="input font-mono tracking-[4px] text-center text-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyOTP()}
                  />
                  {devOtp && (
                     <div className="mt-3 p-2 bg-burg/5 border border-burg/20 rounded-md text-[11px] text-burg font-mono text-center">
                      Dev OTP: <strong>{devOtp}</strong>
                    </div>
                  )}
                </div>
                {error && <p className="text-burg text-xs mb-3">{error}</p>}
                
                <button onClick={handleVerifyOTP} className="w-full p-[12px] rounded-[5px] bg-burg hover:bg-burg-2 text-white border-none text-[14px] font-bold cursor-pointer transition-all duration-200 shadow-[0_4px_14px_rgba(139,26,26,0.28)] mt-[4px]" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Sign In →'}
                </button>
                <div className="mt-3 text-center">
                  <button onClick={() => { setStep('phone'); setOtp(''); setError(''); }} className="text-[12px] text-muted hover:text-burg font-semibold bg-transparent border-none cursor-pointer">
                    ← Change number
                  </button>
                </div>
              </>
            )}

            <div className="text-center text-[12px] text-muted mt-[16px] pt-[16px] border-t border-border">
              Are you a municipal officer?{' '}
              <Link to="/admin/login" className="text-burg font-semibold no-underline">
                Admin login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
