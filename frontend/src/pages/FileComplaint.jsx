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
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-white mb-3">Complaint Registered!</h2>
          <p className="text-slate-400 mb-8">Your complaint has been received and is being processed by our AI.</p>

          <div className="card p-6 text-left space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Tracking ID</span>
              <span className="font-mono font-bold text-indigo-400 text-lg">{success.tracking_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Department</span>
              <span className="text-white font-medium">{success.complaint.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Severity</span>
              <span className={`badge badge-${success.complaint.severity.toLowerCase()}`}>
                {success.complaint.severity}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Expected Resolution</span>
              <span className="text-white">{success.complaint.eta_days} days</span>
            </div>
            <div className="border-t border-slate-800 pt-4">
              <p className="text-slate-400 text-xs">AI Summary</p>
              <p className="text-slate-300 text-sm mt-1">{success.complaint.summary_en}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={`/track/${success.tracking_id}`}
              className="btn-primary py-3 text-center"
            >
              📍 Track Your Complaint
            </a>
            <button
              onClick={() => { setSuccess(null); setForm({ text: '', state: '', district: '', city: '' }); setAudioBlob(null); setAudioUrl(''); }}
              className="btn-secondary py-3"
            >
              File Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">File a Complaint</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Describe your civic issue. Our AI will classify and route it automatically.
          </p>
        </div>

        <div className="card p-6 space-y-6">
          {/* Mode Switcher */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">How would you like to report?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'text', label: '✏️ Type complaint', desc: 'Write in any language' },
                { key: 'voice', label: '🎤 Voice note', desc: 'Speak your complaint' },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === m.key
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  <p className="font-medium text-white text-sm">{m.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Complaint Input */}
          {mode === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Describe your complaint
              </label>
              <textarea
                rows={5}
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                placeholder="E.g. 'There is a large pothole on MG Road near the bus stop. It has been there for 2 weeks and is causing accidents...' (Any language)"
                className="input resize-none"
              />
              <p className="text-xs text-slate-600 mt-1">
                Write in any Indian language — Hindi, Tamil, Marathi, etc. AI handles translation.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Record your complaint</label>
              <div className="flex flex-col items-center gap-4 p-8 border border-slate-700 rounded-xl bg-slate-800/20">
                {!audioUrl ? (
                  <>
                    <button
                      onClick={recording ? stopRecording : startRecording}
                      className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all ${
                        recording
                          ? 'bg-red-500 hover:bg-red-400 animate-pulse'
                          : 'bg-indigo-600 hover:bg-indigo-500'
                      }`}
                    >
                      {recording ? '⏹' : '🎤'}
                    </button>
                    <p className="text-sm text-slate-400">
                      {recording ? 'Recording... Click to stop' : 'Click to start recording'}
                    </p>
                  </>
                ) : (
                  <div className="w-full space-y-3">
                    <audio src={audioUrl} controls className="w-full" />
                    <button
                      onClick={() => { setAudioBlob(null); setAudioUrl(''); }}
                      className="btn-ghost w-full text-sm text-red-400 hover:text-red-300"
                    >
                      🗑️ Re-record
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">📍 Location</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">State *</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="input text-sm"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">District</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="e.g. Andheri"
                  className="input text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">City / Area</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Bandra West"
                  className="input text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {mode === 'voice' ? 'Transcribing & classifying...' : 'Classifying complaint...'}
              </span>
            ) : (
              '🚀 Submit Complaint'
            )}
          </button>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>⚡</span>
            <span>AI will auto-classify department, severity, and route your complaint in ~5 seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
}
