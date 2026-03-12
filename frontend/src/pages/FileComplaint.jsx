import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fileComplaint } from '../utils/api';

// Common Indian states (used as datalist suggestions — not restricted to these)
const INDIAN_STATE_SUGGESTIONS = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu and Kashmir','Ladakh',
];

/**
 * Reverse geocode lat/lng → { country, state, district, city } using OSM Nominatim.
 * Works globally — no country restriction.
 */
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'CivicAI/1.0' } }
    );
    const data = await res.json();
    const a = data.address || {};

    // Country (always first)
    const country = a.country || '';

    // State or Province — OSM uses 'state' for most countries
    const state = a.state || a.region || a.province || '';

    // District / County — OSM uses county / state_district / district
    const district = a.county || a.state_district || a.district || '';

    // City / Locality — most specific first
    const city = a.suburb || a.city_district || a.town || a.village || a.city || a.municipality || '';

    return { country, state, district, city };
  } catch {
    return { country: '', state: '', district: '', city: '' };
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
  const [geocoding, setGeocoding] = useState(false); // true while reverse geocoding
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  // Image capture state
  const [capturedImages, setCapturedImages] = useState([]); // [{file, previewUrl, lat, lng}]
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
      setError('Microphone access denied. Please allow mic access and try again.');
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  // ── EXIF GPS Parser ──────────────────────────────────────────────────────
  // Reads raw JPEG EXIF to extract GPS lat/lng without any library dependency.
  const readExifGPS = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const view = new DataView(e.target.result);
          if (view.getUint16(0, false) !== 0xFFD8) return resolve(null); // Not JPEG

          let offset = 2;
          while (offset < view.byteLength) {
            const marker = view.getUint16(offset, false);
            offset += 2;
            if (marker === 0xFFE1) { // APP1 = EXIF
              const exifStart = offset + 2;
              const isLittleEndian = view.getUint16(exifStart, false) === 0x4949;
              const firstIFD = exifStart + view.getUint32(exifStart + 4, isLittleEndian);
              const numEntries = view.getUint16(firstIFD, isLittleEndian);

              let gpsOffset = null;
              for (let i = 0; i < numEntries; i++) {
                const tag = view.getUint16(firstIFD + 2 + i * 12, isLittleEndian);
                if (tag === 0x8825) { // GPSInfo tag
                  gpsOffset = exifStart + view.getUint32(firstIFD + 2 + i * 12 + 8, isLittleEndian);
                }
              }
              if (!gpsOffset) return resolve(null);

              const gpsEntries = view.getUint16(gpsOffset, isLittleEndian);
              const gps = {};
              for (let i = 0; i < gpsEntries; i++) {
                const tag = view.getUint16(gpsOffset + 2 + i * 12, isLittleEndian);
                const valOff = gpsOffset + 2 + i * 12 + 8;
                if (tag === 1) gps.latRef = String.fromCharCode(view.getUint8(valOff));
                if (tag === 3) gps.lngRef = String.fromCharCode(view.getUint8(valOff));
                if (tag === 2 || tag === 4) {
                  const dOff = exifStart + view.getUint32(valOff, isLittleEndian);
                  const toDecimal = () =>
                    view.getUint32(dOff, isLittleEndian) / view.getUint32(dOff + 4, isLittleEndian) +
                    view.getUint32(dOff + 8, isLittleEndian) / view.getUint32(dOff + 12, isLittleEndian) / 60 +
                    view.getUint32(dOff + 16, isLittleEndian) / view.getUint32(dOff + 20, isLittleEndian) / 3600;
                  if (tag === 2) gps.lat = toDecimal();
                  if (tag === 4) gps.lng = toDecimal();
                }
              }

              if (gps.lat != null && gps.lng != null) {
                return resolve({
                  lat: gps.latRef === 'S' ? -gps.lat : gps.lat,
                  lng: gps.lngRef === 'W' ? -gps.lng : gps.lng,
                });
              }
              return resolve(null);
            }
            offset += view.getUint16(offset, false);
          }
          resolve(null);
        } catch { resolve(null); }
      };
      reader.readAsArrayBuffer(file.slice(0, 65536)); // Only first 64KB needed for EXIF
    });

  // Called when user picks an image from the camera/file picker
  const handleImageCapture = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const remaining = 5 - capturedImages.length;
    const toAdd = files.slice(0, remaining);

    // Immediately show previews without coords first
    const initialImages = toAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      lat: null,
      lng: null,
    }));
    setCapturedImages((prev) => [...prev, ...initialImages]);
    e.target.value = '';

    setGeocoding(true);

    // 1. Try reading EXIF GPS from image (works for real camera photos)
    let lat = null, lng = null;
    for (const file of toAdd) {
      const exif = await readExifGPS(file);
      if (exif) { lat = exif.lat; lng = exif.lng; break; }
    }

    // 2. Fallback: ask browser for current position
    if (lat === null && navigator.geolocation) {
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;

        // Annotate the previews with the live GPS coords
        setCapturedImages((prev) =>
          prev.map((img, i) =>
            i >= prev.length - toAdd.length
              ? { ...img, lat, lng, accuracy: Math.round(pos.coords.accuracy) }
              : img
          )
        );
      } catch {
        setError('⚠ Location access denied. Photos attached without GPS tag. You can fill location manually below.');
        setGeocoding(false);
        return;
      }
    } else if (lat !== null) {
      // Annotate previews with EXIF coords
      setCapturedImages((prev) =>
        prev.map((img, i) =>
          i >= prev.length - toAdd.length
            ? { ...img, lat, lng }
            : img
        )
      );
    }

    // 3. Reverse geocode coordinates → fill form
    if (lat !== null) {
      const geo = await reverseGeocode(lat, lng);
      setForm((prev) => ({
        ...prev,
        state: prev.state || geo.state,
        district: prev.district || geo.district,
        city: prev.city || geo.city,
        country: prev.country || geo.country || 'India',
      }));
    }

    setGeocoding(false);
  };

  const removeImage = (idx) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (!form.text.trim() && !audioBlob) return setError('Please enter a complaint or record a voice note.');
    if (!form.state) return setError('Please select your state.');
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

      // Append images and their specific metadata
      const imageMetadata = [];
      capturedImages.forEach(({ file, lat, lng }) => {
        fd.append('images', file, file.name);
        imageMetadata.push({ fileName: file.name, lat, lng });
      });
      fd.append('image_metadata', JSON.stringify(imageMetadata));

      // Geolocation for the complaint itself
      // Use the first image's geotag if available, otherwise ask the browser
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
          <div className="w-[80px] h-[80px] mx-auto bg-green-bg border-2 border-green rounded-full flex items-center justify-center mb-6 shadow-[0_8px_24px_rgba(22,84,58,0.15)]">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-green"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
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
            {success.complaint.images?.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-muted">Photos Attached</span>
                <span className="text-[13px] font-bold text-green">{success.complaint.images.length} geotagged photo{success.complaint.images.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {success.complaint.summary_en !== 'Audio complaint submitted.' && (
              <div className="pt-[16px] mt-[8px] border-t border-border">
                <p className="text-[10px] font-bold text-burg uppercase tracking-[2px] mb-2 flex items-center gap-2 before:content-[''] before:w-[12px] before:h-[2px] before:bg-burg">AI Summary</p>
                <p className="text-[14px] text-text font-serif leading-[1.6] bg-cream p-[12px] rounded-[4px] border border-border">{success.complaint.summary_en}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-[12px] justify-center">
            <a
              href={`/track/${success.tracking_id}`}
              className="btn-primary flex-1 py-[14px] text-center text-[14px] shadow-[0_4px_14px_rgba(139,26,26,0.25)]"
            >
              Track Progress ↗
            </a>
            <button
              onClick={() => { setSuccess(null); setForm({ text: '', state: '', district: '', city: '' }); setAudioBlob(null); setAudioUrl(''); setMode('text'); setCapturedImages([]); }}
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
                {
                  key: 'text',
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
                  label: 'Text Description',
                  desc: 'Type in any language',
                },
                {
                  key: 'voice',
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
                  label: 'Voice Recording',
                  desc: 'Speak your issue',
                },
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
                  <p className={`font-bold text-[14px] mb-[4px] flex items-center gap-2 ${mode === m.key ? 'text-burg' : 'text-text'}`}>{m.icon}{m.label}</p>
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
                  <svg className="text-burg shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  Write natively. Our AI handles the translation.
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
                        className={`w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-300 shadow-md border-[4px] cursor-pointer ${
                          recording
                            ? 'bg-red-50 text-red-600 border-red-500 animate-pulse scale-[1.05]'
                            : 'bg-white text-burg border-burg/20 hover:border-burg'
                        }`}
                      >
                        {recording ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                        )}
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
                        className="btn-ghost w-full py-[10px] text-[13px] text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 bg-white flex items-center justify-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        Delete and Re-record
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── PHOTO CAPTURE ─────────────────────────────────────────────── */}
          <div className="pt-[16px] border-t border-border/60">
            <label className="block text-[12px] font-bold text-text uppercase tracking-wider mb-[12px] flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              Attach Photos
              <span className="text-muted font-medium normal-case tracking-normal text-[11px]">(optional, up to 5, geotagged automatically)</span>
            </label>

            {/* Hidden camera input */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleImageCapture}
              className="hidden"
            />

            {/* Image preview grid */}
            {capturedImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                {capturedImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-[6px] overflow-hidden border border-border aspect-square bg-cream">
                    <img src={img.previewUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    {/* Geotag indicator */}
                    {img.lat && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] font-mono px-1 py-0.5 flex items-center gap-0.5">
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        {img.lat.toFixed(4)}, {img.lng.toFixed(4)}
                        {img.accuracy && <span className="ml-0.5 text-green-300">±{img.accuracy}m</span>}
                      </div>
                    )}
                    {/* Remove button */}
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-burg text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add photo button */}
            {capturedImages.length < 5 && (
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-[6px] py-[16px] flex items-center justify-center gap-2 text-[13px] font-semibold text-muted hover:border-burg hover:text-burg hover:bg-burg-bg/20 transition-all bg-cream/50 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                {capturedImages.length === 0 ? 'Open Camera / Choose Photo' : `Add More Photos (${capturedImages.length}/5)`}
              </button>
            )}
            {capturedImages.length > 0 && (
              <p className="text-[11px] text-muted mt-2 flex items-center gap-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
                </svg>
                Photos are automatically tagged with your GPS coordinates for precise location mapping.
              </p>
            )}
          </div>

          {/* Location */}
          <div className="pt-[16px] border-t border-border/60">
            <label className="block text-[12px] font-bold text-text uppercase tracking-wider mb-[12px] flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Incident Location
              {geocoding && (
                <span className="flex items-center gap-1.5 text-burg font-semibold normal-case tracking-normal text-[11px]">
                  <div className="w-3 h-3 border-[2px] border-burg/30 border-t-burg rounded-full animate-spin" />
                  Detecting location from photo...
                </span>
              )}
            </label>

            {/* Hidden datalist for Indian state autocomplete */}
            <datalist id="state-suggestions">
              {INDIAN_STATE_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
            </datalist>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              {/* Country - always first */}
              <div>
                <label className="text-[11px] font-semibold text-muted mb-[6px] block">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="Auto-filled from photo location"
                  className={`input text-[14px] bg-white border-border focus:border-burg transition-colors ${geocoding ? 'bg-amber-50 border-amber' : ''}`}
                />
              </div>

              {/* State / Province — dropdown for India, text for other countries */}
              <div>
                <label className="text-[11px] font-semibold text-muted mb-[6px] flex items-center justify-between">
                  <span>State / Province *</span>
                  {form.country && form.country.toLowerCase() !== 'india' && (
                    <span className="font-normal text-muted normal-case tracking-normal">({form.country})</span>
                  )}
                </label>
                {(!form.country || form.country.toLowerCase() === 'india') ? (
                  // Indian states dropdown
                  <select
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className={`input text-[14px] bg-white border-border focus:border-burg cursor-pointer transition-colors ${geocoding ? 'bg-amber-50 border-amber' : ''}`}
                  >
                    <option value="">Select state...</option>
                    {INDIAN_STATE_SUGGESTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="__other__">Other / International</option>
                  </select>
                ) : (
                  // Free text for non-Indian locations (auto-filled by geocoding)
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="State / Province / Region"
                    className={`input text-[14px] bg-white border-border focus:border-burg transition-colors ${geocoding ? 'bg-amber-50 border-amber' : ''}`}
                  />
                )}
              </div>

              {/* District */}
              <div>
                <label className="text-[11px] font-semibold text-muted mb-[6px] block">District / County</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="Auto-filled from photo location"
                  className={`input text-[14px] bg-white border-border focus:border-burg transition-colors ${geocoding ? 'bg-amber-50 border-amber' : ''}`}
                />
              </div>

              {/* City */}
              <div>
                <label className="text-[11px] font-semibold text-muted mb-[6px] block">City / Area</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Auto-filled from photo location"
                  className={`input text-[14px] bg-white border-border focus:border-burg transition-colors ${geocoding ? 'bg-amber-50 border-amber' : ''}`}
                />
              </div>
            </div>

            {/* Helper hint */}
            <p className="text-[11px] text-muted mt-[10px] flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              Upload a photo to auto-fill location, or type manually. Works for any country.
            </p>
          </div>

          {error && (
            <div className="bg-burg-bg border border-burg/20 rounded-[6px] px-[16px] py-[12px]">
              <p className="text-burg text-[13px] font-semibold flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {error}
              </p>
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
                   {mode === 'voice' ? 'Processing Audio and Categorizing...' : 'AI Analyzing Complaint...'}
                 </span>
               ) : (
                 <span className="flex items-center justify-center gap-2">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                   Submit Grievance Securely
                 </span>
               )}
             </button>

             <div className="mt-[16px] text-center">
               <p className="text-[11px] text-muted font-medium inline-flex items-center gap-1.5 bg-cream px-[12px] py-[6px] rounded-full border border-border">
                 <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-burg"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                 Intelligent AI-powered routing
               </p>
             </div>
           </div>

        </div>
      </div>
    </div>
  );
}
