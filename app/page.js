'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [serverInfo, setServerInfo] = useState(null);
  const [records, setRecords] = useState([]);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingTelemetry, setFetchingTelemetry] = useState(false);
  const [stressMsg, setStressMsg] = useState('');
  const [stressActive, setStressActive] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL');
  const [previewImage, setPreviewImage] = useState(null);
  const [showVivaGuide, setShowVivaGuide] = useState(false);

  // Form states
  const [recordForm, setRecordForm] = useState({
    patientName: '',
    mrn: '',
    triage: 'Urgent',
    vitals: '',
    diagnosis: '',
    physician: 'Dr. Y. Jagyasi'
  });

  const [scanForm, setScanForm] = useState({
    scanType: 'Chest X-Ray',
    patientRef: '',
    clinicalNotes: ''
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  useEffect(() => {
    fetchTelemetry();
    loadData();
  }, []);

  const fetchTelemetry = async () => {
    setFetchingTelemetry(true);
    try {
      const res = await fetch('/api/info', { cache: 'no-store' });
      const data = await res.json();
      setServerInfo(data);
    } catch (err) {
      console.error('Failed to fetch node telemetry:', err);
    } finally {
      setTimeout(() => setFetchingTelemetry(false), 400);
    }
  };

  const loadData = async () => {
    try {
      const [resRecords, resScans] = await Promise.all([
        fetch('/api/records', { cache: 'no-store' }),
        fetch('/api/scans', { cache: 'no-store' })
      ]);
      const dataRecords = await resRecords.json();
      const dataScans = await resScans.json();

      if (Array.isArray(dataRecords)) setRecords(dataRecords);
      if (Array.isArray(dataScans)) setScans(dataScans);
    } catch (e) {
      console.error('Data load error:', e);
    }
  };

  const handleRecordSubmit = async (e) => {
    e.preventDefault();
    if (!recordForm.patientName || !recordForm.diagnosis) return;
    setLoading(true);

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordForm)
      });
      if (res.ok) {
        setRecordForm({
          patientName: '',
          mrn: '',
          triage: 'Urgent',
          vitals: '',
          diagnosis: '',
          physician: 'Dr. Y. Jagyasi'
        });
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScanUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('scanFile', uploadFile);
      formData.append('scanType', scanForm.scanType);
      formData.append('patientRef', scanForm.patientRef || 'General Diagnostic');
      formData.append('clinicalNotes', scanForm.clinicalNotes);

      const res = await fetch('/api/scans', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setUploadFile(null);
        setScanForm({
          scanType: 'Chest X-Ray',
          patientRef: '',
          clinicalNotes: ''
        });
        setFileInputKey((k) => k + 1);
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerStress = async () => {
    setStressActive(true);
    setStressMsg('Dispatching CPU surge instruction across the EC2 cluster...');
    try {
      const res = await fetch('/api/stress', { method: 'POST' });
      const data = await res.json();
      setStressMsg(data.message);
    } catch (err) {
      setStressMsg('Failed to trigger load surge: ' + err.message);
    } finally {
      setTimeout(() => setStressActive(false), 5000);
    }
  };

  const filteredRecords = records.filter((r) => {
    if (activeFilter === 'ALL') return true;
    return r.triage === activeFilter;
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased selection:bg-teal-500 selection:text-slate-900">
      {/* Top Clinical Nav / Telemetry Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-teal-500/20">
                🩺
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                    PulseCare <span className="text-teal-400 font-medium">Portal</span>
                  </h1>
                  <span className="text-[10px] uppercase tracking-wider bg-teal-500/10 text-teal-300 font-semibold px-2 py-0.5 rounded-full border border-teal-500/20">
                    Clinical EHR
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Resilient Multi-AZ Healthcare EHR & Diagnostic Imaging Hub on AWS
                </p>
              </div>
            </div>

            {/* Quick mobile refresh */}
            <button
              onClick={fetchTelemetry}
              disabled={fetchingTelemetry}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Refresh ALB Routing"
            >
              🔄
            </button>
          </div>

          {/* Live IMDSv2 Node Telemetry Banner (Practical 1 & 5 Verification) */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2 flex items-center gap-4 text-xs font-mono shadow-inner">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-400 text-[11px]">EC2 Node:</span>
                <span className="text-emerald-400 font-bold tracking-wide">
                  {serverInfo?.instanceId || 'Detecting IMDSv2...'}
                </span>
              </div>

              <div className="h-3 w-px bg-slate-700 hidden sm:block"></div>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Zone:</span>
                <span className="bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2 py-0.5 rounded text-[11px] font-bold">
                  {serverInfo?.availabilityZone || 'Detecting...'}
                </span>
              </div>
            </div>

            <button
              onClick={fetchTelemetry}
              disabled={fetchingTelemetry}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl border transition ${
                fetchingTelemetry
                  ? 'bg-teal-500 text-slate-950 border-teal-400'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-teal-300 border-slate-700 hover:border-teal-500/50'
              }`}
              title="Simulates or triggers request distribution across AZs"
            >
              <span className={fetchingTelemetry ? 'animate-spin' : ''}>🔄</span>
              <span className="hidden sm:inline">Test ALB Distribution</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6 flex-1">
        {/* Architecture & Infrastructure Quick Indicators */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Block Storage (EBS gp3)</span>
              <span className="text-cyan-400 font-mono text-[10px]">Encrypted</span>
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {serverInfo?.storagePath || '/data/clinical_records.json'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400">●</span> Disaster Snapshot Ready
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Object Storage (S3)</span>
              <span className="text-emerald-400 font-mono text-[10px]">Versioning ON</span>
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {serverInfo?.s3Bucket || 'snapvault-gallery'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-teal-400">●</span> SSE-S3 & Delete Markers
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>High Availability (ALB)</span>
              <span className="text-amber-400 font-mono text-[10px]">Multi-AZ</span>
            </div>
            <div className="text-sm font-semibold text-white">2 AZs Balanced</div>
            <div className="text-[11px] text-slate-400 mt-1">ap-south-1a ⇄ ap-south-1b</div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Auto Scaling Group</span>
              <span className="text-violet-400 font-mono text-[10px]">Target 50% CPU</span>
            </div>
            <div className="text-sm font-semibold text-white">Capacity: 1 - 4 Instances</div>
            <div className="text-[11px] text-slate-400 mt-1">Golden AMI Template</div>
          </div>
        </section>

        {/* Dual Pillar: Clinical Records (EBS) vs Diagnostic Scans (S3) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pillar 1: Clinical Records & Triage Ledger (Amazon EBS) */}
          <section className="lg:col-span-6 bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center text-base">
                  📋
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Clinical Records Ledger</h2>
                  <p className="text-[11px] text-slate-400">Patient Vitals & Encounter Log</p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-slate-700/60 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-600/60">
                  EBS /data/clinical_records.json
                </span>
                <p className="text-[10px] text-teal-400 mt-0.5 font-medium">Encrypted gp3 Block Storage</p>
              </div>
            </div>

            {/* Patient Encounter Form */}
            <form onSubmit={handleRecordSubmit} className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Patient Name *</label>
                  <input
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="e.g. Johnathan Davis"
                    value={recordForm.patientName}
                    onChange={(e) => setRecordForm({ ...recordForm, patientName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Medical Record # (MRN)</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition"
                    placeholder="MRN-XXXX (Auto-assigned if blank)"
                    value={recordForm.mrn}
                    onChange={(e) => setRecordForm({ ...recordForm, mrn: e.target.value })}
                  />
                </div>
              </div>

              {/* Triage Level Selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Triage Classification</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '🔴 Critical (P1)', value: 'Critical', bg: 'hover:border-rose-500/60 active:border-rose-500', activeBg: 'bg-rose-500/20 border-rose-500 text-rose-300' },
                    { label: '🟡 Urgent (P2)', value: 'Urgent', bg: 'hover:border-amber-500/60 active:border-amber-500', activeBg: 'bg-amber-500/20 border-amber-500 text-amber-300' },
                    { label: '🟢 Stable (P3)', value: 'Stable', bg: 'hover:border-emerald-500/60 active:border-emerald-500', activeBg: 'bg-emerald-500/20 border-emerald-500 text-emerald-300' }
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setRecordForm({ ...recordForm, triage: t.value })}
                      className={`text-[11px] font-medium py-1.5 px-2 rounded-lg border text-center transition ${
                        recordForm.triage === t.value
                          ? t.activeBg
                          : `bg-slate-950 border-slate-700 text-slate-400 ${t.bg}`
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vitals Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Vital Signs</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition"
                  placeholder="BP 120/80 mmHg • HR 75 bpm • SpO2 99% • Temp 98.6°F"
                  value={recordForm.vitals}
                  onChange={(e) => setRecordForm({ ...recordForm, vitals: e.target.value })}
                />
              </div>

              {/* Diagnosis / Notes */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Clinical Diagnosis & Care Plan *</label>
                <textarea
                  required
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition resize-none"
                  placeholder="Enter clinical assessment, interventions, and doctor's prescription..."
                  value={recordForm.diagnosis}
                  onChange={(e) => setRecordForm({ ...recordForm, diagnosis: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <input
                  className="w-1/2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 placeholder-slate-500 outline-none"
                  placeholder="Physician: Dr. Y. Jagyasi"
                  value={recordForm.physician}
                  onChange={(e) => setRecordForm({ ...recordForm, physician: e.target.value })}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-slate-950 font-bold py-2 rounded-lg text-xs shadow-md shadow-teal-500/20 transition disabled:opacity-50"
                >
                  {loading ? 'Committing...' : '💾 Save to EBS Volume'}
                </button>
              </div>
            </form>

            {/* Filter Pills */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 text-[11px] font-medium">Recorded Encounters ({filteredRecords.length})</span>
              <div className="flex gap-1">
                {['ALL', 'Critical', 'Urgent', 'Stable'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`text-[10px] px-2 py-0.5 rounded-md transition ${
                      activeFilter === filter
                        ? 'bg-teal-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Records List */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl text-slate-500 text-xs">
                  No patient clinical records found in this category.
                </div>
              ) : (
                filteredRecords.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl hover:border-slate-700 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            r.triage === 'Critical'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : r.triage === 'Urgent'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {r.triageCode || r.triage}
                        </span>
                        <span className="font-bold text-white text-xs">{r.patientName}</span>
                        <span className="text-[10px] font-mono text-slate-500">({r.mrn || 'MRN-N/A'})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{r.createdAt}</span>
                    </div>

                    <div className="text-[11px] text-teal-300 bg-teal-950/40 border border-teal-900/50 px-2 py-1 rounded font-mono">
                      ❤️ {r.vitals}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{r.diagnosis}</p>

                    <div className="text-[10px] text-slate-500 flex justify-between items-center pt-1 border-t border-slate-800/80">
                      <span>Attending: {r.physician}</span>
                      <span className="font-mono text-slate-600">ID: {r.id.slice(-6)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Pillar 2: Diagnostic Scans & Lab Archive (Amazon S3) */}
          <section className="lg:col-span-6 bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/70 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-base">
                  🩻
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Diagnostic Imaging Vault</h2>
                  <p className="text-[11px] text-slate-400">Radiology, Lab Reports & Pathology</p>
                </div>
              </div>
              <div className="text-right">
                <span className="bg-emerald-500/10 text-emerald-300 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-500/20">
                  S3 Versioning Enabled
                </span>
                <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">SSE-S3 AES-256 Encrypted</p>
              </div>
            </div>

            {/* Scan Upload Form */}
            <form onSubmit={handleScanUpload} className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Diagnostic Modality</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    value={scanForm.scanType}
                    onChange={(e) => setScanForm({ ...scanForm, scanType: e.target.value })}
                  >
                    <option>Chest X-Ray</option>
                    <option>Brain MRI Scan</option>
                    <option>Pathology & Blood Panel</option>
                    <option>Cardio ECG Tracing</option>
                    <option>Abdominal Ultrasound</option>
                    <option>Computed Tomography (CT)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">Patient Ref / MRN</label>
                  <input
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="e.g. Eleanor Vance (MRN-1092)"
                    value={scanForm.patientRef}
                    onChange={(e) => setScanForm({ ...scanForm, patientRef: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Diagnostic File (Image or PDF) *</label>
                <input
                  key={fileInputKey}
                  type="file"
                  required
                  accept="image/*,.pdf"
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-300 hover:file:bg-emerald-500/20 cursor-pointer"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Radiologist / Clinical Notes</label>
                <input
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  placeholder="Clinical observation, radiologist findings, impressions..."
                  value={scanForm.clinicalNotes}
                  onChange={(e) => setScanForm({ ...scanForm, clinicalNotes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !uploadFile}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-2 rounded-lg text-xs shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
              >
                {loading ? 'Uploading to S3...' : '☁️ Upload Scan to Amazon S3'}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 text-[11px] font-medium">Archived Objects in S3 ({scans.length})</span>
              <span className="text-[10px] text-slate-500 font-mono">Bucket: {serverInfo?.s3Bucket}</span>
            </div>

            {/* Scans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
              {scans.length === 0 ? (
                <div className="col-span-2 text-center py-8 border border-dashed border-slate-700 rounded-xl text-slate-500 text-xs">
                  No diagnostic scans uploaded to S3 yet.
                </div>
              ) : (
                scans.map((s) => (
                  <div
                    key={s.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition flex flex-col justify-between group"
                  >
                    {s.isImage && s.fileUrl !== '#' ? (
                      <div
                        onClick={() => setPreviewImage(s.fileUrl)}
                        className="relative h-28 w-full bg-black/40 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={s.fileUrl}
                          alt={s.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute top-1.5 left-1.5 bg-slate-950/80 backdrop-blur-sm text-cyan-300 text-[10px] px-1.5 py-0.5 rounded font-medium border border-cyan-500/20">
                          {s.scanType}
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 w-full bg-gradient-to-br from-slate-900 to-slate-950 flex flex-col items-center justify-center border-b border-slate-800 p-3">
                        <span className="text-3xl mb-1">{s.fileName.endsWith('.pdf') ? '📄' : '🔬'}</span>
                        <span className="text-[10px] text-cyan-300 font-medium px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                          {s.scanType}
                        </span>
                      </div>
                    )}

                    <div className="p-3 space-y-1">
                      <div className="font-bold text-white text-xs truncate" title={s.fileName}>
                        {s.fileName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{s.patientRef}</div>
                      {s.clinicalNotes && (
                        <p className="text-[11px] text-slate-300 line-clamp-1 italic">"{s.clinicalNotes}"</p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                        <span>{s.fileSize}</span>
                        {s.fileUrl !== '#' ? (
                          <a
                            href={s.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-400 hover:text-teal-300 font-semibold"
                          >
                            View S3 Object ↗
                          </a>
                        ) : (
                          <span className="text-slate-500">Local S3 Mock</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Practical 6 Auto Scaling Group Surge Simulation Banner */}
        <section className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚨</span>
                <h3 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                  Practical 6: Emergency Patient Surge Simulation (Auto Scaling)
                </h3>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl">
                Simulates an unexpected surge in hospital emergency intake. Triggers 45 seconds of heavy CPU calculation across the EC2 node.
                Watch the AWS Auto Scaling Group Target Tracking Policy (&gt;50% CPU) provision a 3rd instance automatically!
              </p>
            </div>

            <button
              onClick={triggerStress}
              disabled={stressActive}
              className={`font-bold px-6 py-3 rounded-xl text-xs transition shadow-lg whitespace-nowrap ${
                stressActive
                  ? 'bg-amber-600 text-slate-950 animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 hover:shadow-amber-500/20'
              }`}
            >
              {stressActive ? '🔥 Emergency Surge Active...' : '⚡ Simulate Heavy Patient Surge (Upscale)'}
            </button>
          </div>

          {stressMsg && (
            <div className="mt-3 p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-xs font-mono text-amber-200">
              {stressMsg}
            </div>
          )}
        </section>

        {/* AWS Practicals Viva Demonstration Guide (Expandable) */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowVivaGuide(!showVivaGuide)}>
            <div className="flex items-center gap-2">
              <span className="text-base">🎓</span>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Cloud Computing Practicals Mapping & Viva Demonstration Guide
              </h3>
            </div>
            <button className="text-xs text-teal-400 font-semibold hover:underline">
              {showVivaGuide ? '▲ Hide Guide' : '▼ Show Viva Checklist'}
            </button>
          </div>

          {showVivaGuide && (
            <div className="mt-4 pt-4 border-t border-slate-800 overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-[11px]">
                    <th className="py-2 pr-4 font-semibold">Practical</th>
                    <th className="py-2 pr-4 font-semibold">AWS Service & Configuration</th>
                    <th className="py-2 pr-4 font-semibold">Implementation in PulseCare</th>
                    <th className="py-2 font-semibold">How to Demonstrate in Viva</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 text-[11px]">
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-teal-400">Practical 1</td>
                    <td className="py-2.5 pr-4">Amazon EC2 (Ubuntu 24.04, t3.micro) + PM2</td>
                    <td className="py-2.5 pr-4">Next.js application runs under PM2 daemon; IMDSv2 reads instance-id.</td>
                    <td className="py-2">Point to the top header displaying the live Server Instance ID.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-teal-400">Practical 2</td>
                    <td className="py-2.5 pr-4">Amazon EBS gp3 (5 GiB) & Amazon S3 Bucket</td>
                    <td className="py-2.5 pr-4">EBS mounted at /data for patient records; S3 stores diagnostic scans.</td>
                    <td className="py-2">Show ext4 /data mount using `lsblk` and files in S3 console.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-teal-400">Practical 3</td>
                    <td className="py-2.5 pr-4">Backup & Disaster Recovery (EBS Snapshot + S3 Versioning)</td>
                    <td className="py-2.5 pr-4">Snapshot recovers /data/clinical_records.json. S3 Delete Marker recovers deleted scans.</td>
                    <td className="py-2">Delete file in S3, toggle 'Show versions', delete the Delete Marker to restore!</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-teal-400">Practical 4</td>
                    <td className="py-2.5 pr-4">Custom Amazon VPC (10.0.0.0/16, 2 Public Subnets)</td>
                    <td className="py-2.5 pr-4">Subnets span ap-south-1a and ap-south-1b with Internet Gateway.</td>
                    <td className="py-2">Show VPC Resource Map in AWS Console with 2 public subnets and IGW.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-teal-400">Practical 5</td>
                    <td className="py-2.5 pr-4">Application Load Balancer (ALB) across Multi-AZ</td>
                    <td className="py-2.5 pr-4">ALB forwards port 80 to port 3000 target group with Stickiness disabled.</td>
                    <td className="py-2">Click 'Test ALB Distribution' or refresh to see AZ toggle between 1a & 1b.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-teal-400">Practical 6</td>
                    <td className="py-2.5 pr-4">Auto Scaling Group (ASG) + Golden AMI</td>
                    <td className="py-2.5 pr-4">Target Tracking policy scales fleet from 1 to 4 instances at 50% CPU.</td>
                    <td className="py-2">Click 'Simulate Heavy Patient Surge' and show EC2 ASG Activity launching instances.</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-bold text-teal-400">Practical 7</td>
                    <td className="py-2.5 pr-4">Security Groups, IAM Roles & Encryption</td>
                    <td className="py-2.5 pr-4">EC2 only allows HTTP from ALB; S3 accessed via IAM Role; SSE-S3 enabled.</td>
                    <td className="py-2">Show code has NO credentials; IAM role attached; S3/EBS encryption active.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <img src={previewImage} alt="Scan Preview" className="max-w-full max-h-[85vh] rounded-xl object-contain border border-slate-700 shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-slate-900/90 text-white rounded-full p-2 border border-slate-600 hover:bg-rose-600 text-xs transition"
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        PulseCare Clinical Portal • Cloud Computing Practical Project • AWS Region: Asia Pacific (Mumbai) ap-south-1
      </footer>
    </div>
  );
}
