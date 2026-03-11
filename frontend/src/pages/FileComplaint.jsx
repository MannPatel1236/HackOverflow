import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fileComplaint } from '../utils/api';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu and Kashmir','Ladakh',
];

export default function FileComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ text: '', state: '', district: '', city: '' });
  const [mode, setMode] = useState('text'); // 'text' | 'voice'
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setError('Microphone access denied. Please allow mic access and try again.');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const handleSubmit = async () => {
    if (!form.text.trim() && !audioBlob) return setError('Please enter a complaint or record a voice note.');
    if (!form.state) return setError('Please select your state.');
    setError('');
    setLoading(true);

    try {
      const fd = new FormData();
      if (audioBlob) {
        fd.append('audio', audioBlob, 'complaint.webm');
      } else {
        fd.append('text', form.text);
      }
      fd.append('state', form.state);
      fd.append('district', form.district);
      fd.append('city', form.city);

      // Get geolocation if available
      if (navigator.geolocation) {
        await new Promise((res) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              fd.append('lat', pos.coords.latitude);
              fd.append('lng', pos.coords.longitude);
              res();
            },
            () => res()
          );
        });
      }

      const result = await fileComplaint(fd);
      setSuccess(result.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to file complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-16 text-center animate-fade-in w-full">
          <div className="w-[80px] h-[80px] mx-auto bg-green-bg border-2 border-green rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_8px_24px_rgba(22,84,58,0.15)]">✅</div>
          <h2 className="font-serif text-[32px] font-bold text-text mb-2">Complaint Registered</h2>
          <p className="text-[14px] text-muted mb-8 max-w-[360px] mx-auto">Your grievance has been securely received and is being processed by our AI systems.</p>

          <div className="card p-[28px] text-left space-y-[16px] mb-8 bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between pb-[12px] border-b border-border">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">Tracking ID</span>
              <span className="font-mono font-bold text-text bg-off px-2 py-1 rounded-[4px] border border-border text-[14px] tracking-wide">{success.tracking_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-muted">Department</span>
              <span className="text-[13px] font-bold text-text bg-cream px-2 py-0.5 rounded-[4px] border border-border">{success.complaint.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-muted">Severity</span>
              <span className={`text-[11px] font-bold uppercase tracking-wider px-[8px] py-[2px] rounded-[4px] border ${success.complaint.severity === 'Critical' ? 'bg-burg-bg text-burg border-burg/20' : success.complaint.severity === 'High' ? 'bg-amber-bg text-amber border-amber/20' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {success.complaint.severity}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-muted">Expected Resolution</span>
              <span className="text-[13px] font-bold text-text">{success.complaint.eta_days} days</span>
            </div>
            <div className="pt-[16px] mt-[8px] border-t border-border">
              <p className="text-[10px] font-bold text-burg uppercase tracking-[2px] mb-2 flex items-center gap-2 before:content-[''] before:w-[12px] before:h-[2px] before:bg-burg">AI Summary</p>
              <p className="text-[14px] text-text font-serif leading-[1.6] bg-cream p-[12px] rounded-[4px] border border-border">{success.complaint.summary_en}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-[12px] justify-center">
            <a
              href={`/track/${success.tracking_id}`}
              className="btn-primary flex-1 py-[14px] text-center text-[14px] shadow-[0_4px_14px_rgba(139,26,26,0.25)]"
            >
              Track Progress ↗
            </a>
            <button
              onClick={() => { setSuccess(null); setForm({ text: '', state: '', district: '', city: '' }); setAudioBlob(null); setAudioUrl(''); setMode('text'); }}
              className="btn-ghost flex-1 py-[14px] text-[14px] border border-border hover:border-text hover:text-text bg-white"
            >
              + File Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-12 w-full">
        <div className="mb-[24px]">
          <div className="text-[10px] font-bold tracking-[3px] uppercase text-burg mb-2 flex items-center gap-[10px] before:content-[''] before:w-6 before:h-[2px] before:bg-burg">
            Citizen Grievance
          </div>
          <h1 className="font-serif text-[32px] font-bold text-text leading-[1.2] mb-2">File a New Complaint</h1>
          <p className="text-[14px] text-muted max-w-[500px]">
            Describe your civic issue in detail. Our AI will automatically classify, translate, and route it to the appropriate municipal department.
          </p>
        </div>

        <div className="card p-[28px] space-y-[24px] bg-white border border-border rounded-[8px] shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          {/* Mode Switcher */}
          <div>
            <label className="block text-[12px] font-bold text-text uppercase tracking-wider mb-[12px]">Submission Method</label>
            <div className="grid grid-cols-2 gap-[12px]">
              {[
                { key: 'text', label: '✎ Text Description', desc: 'Type in any language' },
                { key: 'voice', label: '🎤 Voice Recording', desc: 'Speak your issue' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`p-[16px] rounded-[6px] border text-left transition-all duration-200 cursor-pointer ${
                    mode === m.key
                      ? 'border-burg bg-burg-bg/50 shadow-[0_2px_8px_rgba(139,26,26,0.08)] scale-[1.02]'
                      : 'border-border bg-white hover:border-burg/50 hover:bg-cream'
                  }`}
                >
                  <p className={`font-bold text-[14px] mb-[4px] ${mode === m.key ? 'text-burg' : 'text-text'}`}>{m.label}</p>
                  <p className="text-muted text-[11px] font-medium leading-[1.4]">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Complaint Input */}
          <div className="pt-[16px] border-t border-border/60">
            {mode === 'text' ? (
              <div>
                <label className="block text-[12px] font-bold text-text uppercase tracking-wider mb-[12px]">
                  Complaint Details
                </label>
                <textarea
                  rows={5}
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="E.g. 'There is a large pothole on MG Road near the bus stop. It has been there for 2 weeks and is causing accidents...' (You can write in Hindi, Marathi, etc.)"
                  className="input resize-vertical min-h-[120px] text-[15px] leading-[1.6] bg-cream border-border focus:border-burg focus:ring-1 focus:ring-burg shadow-inner"
                />
                <p className="text-[11px] text-muted mt-[8px] font-medium flex items-center gap-1.5">
                  <span className="text-burg">⚡</span> Write natively. Our AI handles the translation.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-[12px] font-bold text-text uppercase tracking-wider mb-[12px]">Record Audio Narrative</label>
                <div className="flex flex-col items-center gap-[16px] p-[32px] border-2 border-dashed border-border rounded-[8px] bg-cream/50 transition-colors hover:border-burg/30 hover:bg-burg-bg/30">
                  {!audioUrl ? (
                    <>
                      <button
                        onClick={recording ? stopRecording : startRecording}
                        className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-[28px] transition-all duration-300 shadow-md border-[4px] cursor-pointer ${
                          recording
                            ? 'bg-red-50 text-red-600 border-red-500 animate-pulse scale-[1.05]'
                            : 'bg-white text-burg border-burg/20 hover:border-burg'
                        }`}
                      >
                        {recording ? '⏹' : '🎤'}
                      </button>
                      <div className="text-center">
                         <p className="text-[14px] font-bold text-text mb-[4px]">
                           {recording ? 'Recording in progress...' : 'Click to start recording'}
                         </p>
                         <p className="text-[11px] text-muted">Please speak clearly describing the issue and location.</p>
                      </div>
                    </>
                  ) : (
                    <div className="w-full space-y-[16px] max-w-[400px]">
                      <div className="bg-white p-3 rounded-[8px] border border-border shadow-sm">
                         <audio src={audioUrl} controls className="w-full h-[40px]" />
                      </div>
                      <button
                        onClick={() => { setAudioBlob(null); setAudioUrl(''); }}
                        className="btn-ghost w-full py-[10px] text-[13px] text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 bg-white"
                      >
                        🗑️ Delete & Re-record
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="pt-[16px] border-t border-border/60">
            <label className="block text-[12px] font-bold text-text uppercase tracking-wider mb-[12px] flex items-center gap-2">
              📍 Incident Location
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px]">
              <div>
                <label className="text-[11px] font-semibold text-muted mb-[6px] block">State *</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="input text-[14px] bg-white border-border focus:border-burg cursor-pointer"
                >
                  <option value="">Select state...</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted mb-[6px] block">District</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="e.g. Mumbai Suburban"
                  className="input text-[14px] bg-white border-border focus:border-burg"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted mb-[6px] block">City / Area</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Bandra West"
                  className="input text-[14px] bg-white border-border focus:border-burg"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-burg-bg border border-burg/20 rounded-[6px] px-[16px] py-[12px]">
              <p className="text-burg text-[13px] font-semibold flex items-center gap-2"><span>⚠️</span> {error}</p>
            </div>
          )}

          <div className="pt-[8px]">
             <button
               onClick={handleSubmit}
               disabled={loading}
               className="btn-primary w-full py-[16px] text-[15px] shadow-[0_6px_20px_rgba(139,26,26,0.22)] transition-transform hover:-translate-y-[2px]"
             >
               {loading ? (
                 <span className="flex items-center justify-center gap-3">
                   <div className="w-[18px] h-[18px] border-[2.5px] border-white/30 border-t-white rounded-full animate-spin" />
                   {mode === 'voice' ? 'Processing Audio & Categorizing...' : 'AI Analyzing Complaint...'}
                 </span>
               ) : (
                 '🚀 Submit Grievance Securely'
               )}
             </button>
             
             <div className="mt-[16px] text-center">
               <p className="text-[11px] text-muted font-medium inline-flex items-center gap-1.5 bg-cream px-[12px] py-[6px] rounded-full border border-border">
                  <span className="text-burg">🤖</span> Intelligent routing driven by GPT-4o
               </p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
