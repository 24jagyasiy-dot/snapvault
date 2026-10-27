'use client';
 
import { useState, useEffect } from 'react';
 
export default function Home() {
  const [serverInfo, setServerInfo] = useState(null);
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [entryForm, setEntryForm] = useState({ title: '', mood: '😊', content: '' });
  const [uploadFile, setUploadFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [fileKey, setFileKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stressMsg, setStressMsg] = useState('');
 
  useEffect(() => {
    fetch('/api/info').then(res => res.json()).then(setServerInfo).catch(console.error);
    loadData();
  }, []);
 
  const loadData = async () => {
    try {
      const [resEntries, resPhotos] = await Promise.all([
        fetch('/api/journal'),
        fetch('/api/photos')
      ]);
      const dataEntries = await resEntries.json();
      const dataPhotos = await resPhotos.json();
      if (Array.isArray(dataEntries)) setEntries(dataEntries);
      if (Array.isArray(dataPhotos)) setPhotos(dataPhotos);
    } catch (e) {
      console.error(e);
    }
  };
 
  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryForm)
    });
    if (res.ok) {
      setEntryForm({ title: '', mood: '😊', content: '' });
      loadData();
    }
    setLoading(false);
  };
 
  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('photo', uploadFile);
    formData.append('caption', caption);
    const res = await fetch('/api/photos', { method: 'POST', body: formData });
    if (res.ok) {
      setUploadFile(null);
      setCaption('');
      setFileKey(k => k + 1);
      loadData();
    }
    setLoading(false);
  };
 
  const triggerStress = async () => {
    const res = await fetch('/api/stress', { method: 'POST' });
    const data = await res.json();
    setStressMsg(data.message);
  };
 
  return (
    <div className="min-h-screen bg-violet-50 text-slate-800">
      {/* Header: Load Balancer Info Banner */}
      <header className="bg-violet-900 text-white px-6 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">📸 SnapVault Gallery</h1>
            <p className="text-xs text-violet-200">Resilient Multi-AZ Photo Gallery & Journal on AWS</p>
          </div>
          <div className="bg-violet-950 border border-violet-800 px-4 py-2 rounded-lg text-xs font-mono space-y-1">
            <div>⚡ <strong>Server Instance:</strong> <span className="text-emerald-300 font-bold">{serverInfo?.instanceId || 'Detecting...'}</span></div>
            <div>🌐 <strong>Availability Zone:</strong> <span className="text-amber-300 font-bold">{serverInfo?.availabilityZone || 'Detecting...'}</span></div>
          </div>
        </div>
      </header>
 
      <main className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 
          {/* Section 1: Daily Journal (EBS Block Storage) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-slate-900">📔 Daily Journal (Amazon EBS)</h2>
              <span className="text-[11px] bg-violet-100 text-violet-800 px-2 py-0.5 rounded font-mono">/data/journal.json</span>
            </div>
 
            <form onSubmit={handleEntrySubmit} className="space-y-3 mb-6">
              <div className="flex gap-2">
                <select
                  className="border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  value={entryForm.mood}
                  onChange={e => setEntryForm({ ...entryForm, mood: e.target.value })}
                >
                  <option>😊</option>
                  <option>😎</option>
                  <option>😴</option>
                  <option>🤔</option>
                  <option>🎉</option>
                </select>
                <input
                  required
                  className="flex-1 border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Entry Title..."
                  value={entryForm.title}
                  onChange={e => setEntryForm({ ...entryForm, title: e.target.value })}
                />
              </div>
              <textarea
                required
                rows="3"
                className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="How was your day?"
                value={entryForm.content}
                onChange={e => setEntryForm({ ...entryForm, content: e.target.value })}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2 rounded-lg text-sm transition"
              >
                Save Entry to EBS
              </button>
            </form>
 
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {entries.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No journal entries yet.</p>
              ) : (
                entries.map(n => (
                  <div key={n.id} className="p-3 bg-slate-50 border rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{n.mood} {n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.createdAt}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
 
          {/* Section 2: Photo Gallery (Amazon S3 Object Storage) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold text-slate-900">🖼️ Photo Gallery (Amazon S3)</h2>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">Versioning Enabled</span>
            </div>
 
            <form onSubmit={handlePhotoUpload} className="space-y-3 mb-6">
              <input
                key={fileKey}
                type="file"
                accept="image/*"
                required
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                onChange={e => setUploadFile(e.target.files[0])}
              />
              <input
                className="w-full border rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Caption (optional)..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg text-sm transition"
              >
                Upload Photo to Amazon S3
              </button>
            </form>
 
            <div className="max-h-72 overflow-y-auto pr-1">
              {photos.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No photos uploaded to S3 yet.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {photos.map(p => (
                    <a
                      key={p.id}
                      href={p.photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-slate-50 border rounded-lg overflow-hidden hover:shadow-md transition"
                    >
                      {p.photoUrl !== '#' && (
                        <img src={p.photoUrl} alt={p.caption || p.fileName} className="w-full h-24 object-cover" />
                      )}
                      <div className="p-2">
                        <div className="font-bold text-slate-800 text-[11px] truncate">{p.caption || p.fileName}</div>
                        <div className="text-[10px] text-slate-400">{p.fileSize}</div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
 
        {/* Section 3: Practical 6 Stress Testing Banner */}
        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">🚀 Practical 6: Auto Scaling Demonstration</h3>
            <p className="text-xs text-slate-500">Spike CPU load across the fleet to trigger the dynamic upscaling policy.</p>
          </div>
          <button
            onClick={triggerStress}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition whitespace-nowrap"
          >
            🔥 Simulate Heavy Load (Upscale Instances)
          </button>
        </div>
        {stressMsg && <div className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-200">{stressMsg}</div>}
      </main>
    </div>
  );
}

