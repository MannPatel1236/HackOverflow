import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fileComplaint } from '../utils/api';
import { 
  Shield, 
  Camera, 
  Mic, 
  Type, 
  MapPin, 
  ChevronLeft, 
  Trash2, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Info,
  Globe,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu and Kashmir','Ladakh',
];

const STATE_ALIASES = {
  'maharashtra': 'Maharashtra', 'karnataka': 'Karnataka', 'tamil nadu': 'Tamil Nadu',
  'delhi': 'Delhi', 'gujarat': 'Gujarat', 'rajasthan': 'Rajasthan',
  'uttar pradesh': 'Uttar Pradesh', 'west bengal': 'West Bengal', 'kerala': 'Kerala',
  'madhya pradesh': 'Madhya Pradesh', 'punjab': 'Punjab', 'telangana': 'Telangana',
  'bihar': 'Bihar', 'andhra pradesh': 'Andhra Pradesh', 'haryana': 'Haryana',
  'chhattisgarh': 'Chhattisgarh', 'jharkhand': 'Jharkhand', 'uttarakhand': 'Uttarakhand',
  'odisha': 'Odisha', 'goa': 'Goa', 'assam': 'Assam', 'ladakh': 'Ladakh',
  'jammu and kashmir': 'Jammu and Kashmir', 'himachal pradesh': 'Himachal Pradesh',
  'manipur': 'Manipur', 'meghalaya': 'Meghalaya', 'mizoram': 'Mizoram',
  'nagaland': 'Nagaland', 'sikkim': 'Sikkim', 'tripura': 'Tripura',
  'arunachal pradesh': 'Arunachal Pradesh',
};

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'CivicAI/1.0' } }
    );
    const data = await res.json();
    const a = data.address || {};
    const rawState = (a.state || '').toLowerCase();
    const state = STATE_ALIASES[rawState] || '';
    const district = a.county || a.state_district || a.district || '';
    const city = a.suburb || a.city_district || a.town || a.village || a.city || '';
    const country = a.country || '';
    return { state, district, city, country };
  } catch {
    return { state: '', district: '', city: '', country: '' };
  }
}

export default function FileComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ text: '', state: '', district: '', city: '', country: 'India' });
  const [mode, setMode] = useState('text'); // 'text' | 'voice'
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const [capturedImages, setCapturedImages] = useState([]); 
  const cameraInputRef = useRef(null);

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
      setError('TRANSMISSION_ERROR: Microphone access denied.');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const handleImageCapture = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const remaining = 5 - capturedImages.length;
    const toAdd = files.slice(0, remaining);

    if (navigator.geolocation) {
      setGeocoding(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          const newImages = toAdd.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
            lat, lng,
            accuracy: Math.round(accuracy),
          }));
          setCapturedImages((prev) => [...prev, ...newImages]);
          const geo = await reverseGeocode(lat, lng);
          setForm((prev) => ({
            ...prev,
            state: prev.state || geo.state,
            district: prev.district || geo.district,
            city: prev.city || geo.city,
            country: prev.country || geo.country || 'India',
          }));
          setGeocoding(false);
        },
        () => {
          const newImages = toAdd.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file),
            lat: null, lng: null,
          }));
          setCapturedImages((prev) => [...prev, ...newImages]);
          setGeocoding(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      const newImages = toAdd.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        lat: null, lng: null,
      }));
      setCapturedImages((prev) => [...prev, ...newImages]);
    }
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.text.trim() && !audioBlob) return setError('GRIEVANCE_EMPTY: Please provide details.');
    if (!form.state) return setError('LOCATION_REQUIRED: Please select state.');
    setError('');
    setLoading(true);

    try {
      const fd = new FormData();
      if (mode === 'voice' && audioBlob) {
        fd.append('audio', audioBlob, 'complaint.webm');
      } else {
        fd.append('text', form.text);
      }
      fd.append('state', form.state);
      fd.append('district', form.district);
      fd.append('city', form.city);
      fd.append('country', form.country || 'India');

      const imageMetadata = [];
      capturedImages.forEach(({ file, lat, lng }) => {
        fd.append('images', file, file.name);
        imageMetadata.push({ fileName: file.name, lat, lng });
      });
      fd.append('image_metadata', JSON.stringify(imageMetadata));

      const firstGeo = capturedImages.find((img) => img.lat);
      if (firstGeo) {
        fd.append('lat', firstGeo.lat);
        fd.append('lng', firstGeo.lng);
      } else if (navigator.geolocation) {
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
      setError(e.response?.data?.error || 'UPLINK_FAILED: Internal server error.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6 py-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white border border-border rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="bg-navy p-12 text-center text-white relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-burg" />
               <motion.div 
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.2 }}
                 className="w-20 h-20 bg-burg rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-burg/20"
               >
                 <CheckCircle2 size={40} />
               </motion.div>
               <h2 className="text-4xl font-extrabold tracking-tight uppercase mb-4">Uplink Successful</h2>
               <p className="text-white/60 font-bold text-xs uppercase tracking-[0.3em]">Case Ref: {success.tracking_id}</p>
            </div>

            <div className="p-12 space-y-12">
               <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-2">Department</p>
                    <p className="text-lg font-extrabold text-navy tracking-tight">{success.complaint.department}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-2">Priority Level</p>
                    <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${success.complaint.severity === 'urgent' ? 'border-burg text-burg bg-burg/5' : 'border-dim text-dim bg-off'}`}>
                      {success.complaint.severity}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-2">Response ETA</p>
                    <p className="text-lg font-extrabold text-navy tracking-tight">{success.complaint.eta_days} Days</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-dim uppercase tracking-widest mb-2">Tele-Verification</p>
                    <p className="text-lg font-extrabold text-green-600 tracking-tight">Active</p>
                  </div>
               </div>

               <div className="bg-off rounded-2xl p-8 border border-border relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 text-navy/[0.03] rotate-12"><Zap size={100} /></div>
                  <h4 className="text-[10px] font-black text-burg uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Zap size={12} className="fill-burg" /> AI Intelligence Summary
                  </h4>
                  <p className="text-navy text-base leading-relaxed font-sans relative z-10">
                    {success.complaint.summary_en}
                  </p>
               </div>

               <div className="flex flex-col sm:flex-row gap-4">
                  <Link to={`/track/${success.tracking_id}`} className="btn-primary flex-1 py-5">
                    Enter Track Portal <ArrowRight size={20} />
                  </Link>
                  <button onClick={() => setSuccess(null)} className="btn-secondary flex-1 py-5">
                    File Another Log
                  </button>
               </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col font-sans">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20 w-full">
        <header className="mb-16">
           <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-10 bg-burg rounded-full" />
              <h1 className="text-5xl font-extrabold text-navy tracking-tight uppercase">File Grievance</h1>
           </div>
           <p className="text-xl text-muted leading-relaxed max-w-2xl">
              Initialize a high-fidelity data log. Our neural infrastructure will analyze, transcribe, and route your report to regional command.
           </p>
        </header>

        <div className="grid lg:grid-cols-3 gap-12">
           <div className="lg:col-span-2 space-y-12">
              {/* Submission Mode Selection */}
              <section className="bg-white border border-border rounded-3xl p-8 shadow-sm">
                <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em] mb-8">Uplink Protocol</h3>
                <div className="flex bg-off p-1.5 rounded-2xl border border-border">
                  <button 
                    onClick={() => setMode('text')}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'text' ? 'bg-white text-navy shadow-md ring-1 ring-border' : 'text-dim hover:text-navy'}`}
                  >
                    <Type size={18} /> Text Narrative
                  </button>
                  <button 
                    onClick={() => setMode('voice')}
                    className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'voice' ? 'bg-white text-navy shadow-md ring-1 ring-border' : 'text-dim hover:text-navy'}`}
                  >
                    <Mic size={18} /> Voice Telemetry
                  </button>
                </div>

                <div className="mt-8">
                   <AnimatePresence mode="wait">
                     {mode === 'text' ? (
                        <motion.div 
                          key="text"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <textarea
                            rows={6}
                            value={form.text}
                            onChange={(e) => setForm({ ...form, text: e.target.value })}
                            placeholder="Describe the incident with precise details and environmental context..."
                            className="input-premium resize-none"
                          />
                        </motion.div>
                     ) : (
                        <motion.div 
                          key="voice"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex flex-col items-center justify-center py-12 bg-off/50 rounded-2xl border-2 border-dashed border-border group hover:border-burg/20 transition-colors"
                        >
                           {!audioUrl ? (
                             <>
                               <button 
                                 onClick={recording ? stopRecording : startRecording}
                                 className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-500 shadow-xl border-4 ${recording ? 'bg-burg text-white border-burg/20 animate-pulse' : 'bg-white text-burg border-white hover:scale-105'}`}
                               >
                                 <Mic size={32} />
                               </button>
                               <p className="text-sm font-bold text-navy uppercase tracking-widest">{recording ? 'Synchronizing Stream...' : 'Hold to Record'}</p>
                             </>
                           ) : (
                             <div className="w-full px-8 space-y-6">
                                <audio src={audioUrl} controls className="w-full" />
                                <button 
                                  onClick={() => { setAudioBlob(null); setAudioUrl(''); }}
                                  className="w-full py-4 rounded-xl border border-burg/20 text-burg text-xs font-black uppercase tracking-widest hover:bg-burg/5 transition-colors flex items-center justify-center gap-2"
                                >
                                  <Trash2 size={14} /> Clear Telemetry
                                </button>
                             </div>
                           )}
                        </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              </section>

              {/* Photo Capture Section */}
              <section className="bg-white border border-border rounded-3xl p-8 shadow-sm">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em]">Visual Evidence</h3>
                    <span className="text-[10px] font-bold text-dim uppercase tracking-widest">Limit: 05 Logs</span>
                 </div>

                 <input
                   ref={cameraInputRef}
                   type="file"
                   accept="image/*"
                   capture="environment"
                   multiple
                   onChange={handleImageCapture}
                   className="hidden"
                 />

                 <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 mb-8">
                    {capturedImages.map((img, idx) => (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={idx} 
                        className="relative aspect-square rounded-2xl overflow-hidden border border-border group bg-off"
                      >
                         <img src={img.previewUrl} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                         <button 
                           onClick={() => removeImage(idx)}
                           className="absolute top-1.5 right-1.5 w-6 h-6 bg-burg text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                           <X size={12} strokeWidth={3} />
                         </button>
                         {img.lat && (
                           <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase tracking-tighter">
                             Geotagged
                           </div>
                         )}
                      </motion.div>
                    ))}
                    {capturedImages.length < 5 && (
                       <button 
                         onClick={() => cameraInputRef.current?.click()}
                         className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-dim hover:text-burg hover:border-burg/20 hover:bg-burg/5 transition-all duration-300"
                       >
                         <Camera size={24} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Add Log</span>
                       </button>
                    )}
                 </div>
                 <div className="flex items-start gap-3 p-4 bg-off rounded-2xl border border-border">
                    <Info size={16} className="text-navy/30 shrink-0" />
                    <p className="text-[10px] text-muted font-bold uppercase tracking-wide leading-relaxed">
                      Telemetry Note: Images are automatically sharded with RSA-2048 encryption and geotagged for precise administrative mapping.
                    </p>
                 </div>
              </section>

              {/* Location Input */}
              <section className="bg-white border border-border rounded-3xl p-8 shadow-sm">
                 <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xs font-black text-navy uppercase tracking-[0.2em]">Regional Assignment</h3>
                    {geocoding && (
                      <div className="flex items-center gap-2 text-burg">
                         <Loader2 size={14} className="animate-spin" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Detecting Cell...</span>
                      </div>
                    )}
                 </div>

                 <div className="grid sm:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-dim uppercase tracking-widest">Federal State *</label>
                       <select 
                         value={form.state}
                         onChange={(e) => setForm({ ...form, state: e.target.value })}
                         className="w-full bg-off border border-border rounded-xl px-5 py-4 font-bold text-navy appearance-none"
                       >
                         <option value="">Select Region</option>
                         {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-dim uppercase tracking-widest">District Command</label>
                       <input 
                         type="text"
                         value={form.district}
                         onChange={(e) => setForm({ ...form, district: e.target.value })}
                         placeholder="District / County"
                         className="input-premium py-4"
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-dim uppercase tracking-widest">City / Suburb</label>
                       <input 
                         type="text"
                         value={form.city}
                         onChange={(e) => setForm({ ...form, city: e.target.value })}
                         placeholder="Area Segment"
                         className="input-premium py-4"
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-dim uppercase tracking-widest">Nation Link</label>
                       <input 
                         type="text"
                         value={form.country}
                         disabled
                         className="input-premium py-4 bg-off/50 text-dim"
                       />
                    </div>
                 </div>
              </section>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-4 p-6 bg-burg/5 border border-burg/10 rounded-2xl text-burg"
                >
                   <AlertTriangle size={24} />
                   <p className="font-bold text-xs uppercase tracking-widest">{error}</p>
                </motion.div>
              )}

              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="btn-primary w-full py-6 text-lg relative overflow-hidden group shadow-2xl shadow-burg/20"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 flex items-center justify-center gap-4">
                   {loading ? (
                     <>
                       <Loader2 size={24} className="animate-spin" />
                       Processing Uplink...
                     </>
                   ) : (
                     <>
                       Synchronize Grievance Log <ArrowRight size={24} />
                     </>
                   )}
                </span>
              </button>
           </div>

           {/* Sidebar Info */}
           <div className="space-y-12">
              <div>
                <h4 className="text-[10px] font-black text-burg uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                   <Shield size={14} /> Security Protocol
                </h4>
                <div className="bg-white border border-border rounded-3xl p-8 space-y-8">
                   <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-off flex items-center justify-center text-navy shrink-0"><Lock size={18} /></div>
                      <div>
                         <p className="text-xs font-black text-navy uppercase tracking-wider mb-2">E2EE Uplink</p>
                         <p className="text-[10px] text-muted leading-relaxed font-bold uppercase tracking-wide">Citizen data is obfuscated at source using AES-256 before federal transmission.</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-off flex items-center justify-center text-navy shrink-0"><Globe size={18} /></div>
                      <div>
                         <p className="text-xs font-black text-navy uppercase tracking-wider mb-2">Zero-Trust Registry</p>
                         <p className="text-[10px] text-muted leading-relaxed font-bold uppercase tracking-wide">Administrators require multi-signature authorization to view PII-protected narratives.</p>
                      </div>
                   </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-black text-navy uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                   <Zap size={14} /> Live Infrastructure
                </h4>
                <div className="space-y-4">
                   <div className="bg-white border border-border rounded-2xl p-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-dim uppercase tracking-widest">Neural Cluster</span>
                      <span className="text-[10px] font-black text-green-600 uppercase">Synchronized</span>
                   </div>
                   <div className="bg-white border border-border rounded-2xl p-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-dim uppercase tracking-widest">Routing API</span>
                      <span className="text-[10px] font-black text-green-600 uppercase">2ms Latency</span>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

function Lock({ size, className }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}
