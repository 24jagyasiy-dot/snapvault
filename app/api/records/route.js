import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const RECORDS_FILE = path.join(DATA_DIR, 'clinical_records.json');

// Initialize with sample records if file doesn't exist
if (!fs.existsSync(RECORDS_FILE)) {
  const initialRecords = [
    {
      id: '1730000000001',
      patientName: 'Eleanor Vance',
      mrn: 'MRN-1092',
      triage: 'Critical',
      triageCode: 'P1',
      vitals: 'BP 145/95 mmHg • HR 108 bpm • SpO2 93% • Temp 101.2°F',
      diagnosis: 'Acute respiratory distress with bilateral wheezing. High-flow oxygen initiated.',
      physician: 'Dr. Y. Jagyasi',
      createdAt: new Date(Date.now() - 3600000 * 2).toLocaleString()
    },
    {
      id: '1730000000002',
      patientName: 'Marcus Sterling',
      mrn: 'MRN-4821',
      triage: 'Urgent',
      triageCode: 'P2',
      vitals: 'BP 128/82 mmHg • HR 82 bpm • SpO2 98% • Temp 98.6°F',
      diagnosis: 'Suspected hairline fracture in left radius after fall. Diagnostic X-ray ordered.',
      physician: 'Dr. Y. Jagyasi',
      createdAt: new Date(Date.now() - 3600000).toLocaleString()
    },
    {
      id: '1730000000003',
      patientName: 'Sophia Chen',
      mrn: 'MRN-7734',
      triage: 'Stable',
      triageCode: 'P3',
      vitals: 'BP 118/76 mmHg • HR 68 bpm • SpO2 99% • Temp 98.4°F',
      diagnosis: 'Routine post-operative consultation. Incision clean, sutures intact.',
      physician: 'Dr. Y. Jagyasi',
      createdAt: new Date().toLocaleString()
    }
  ];
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(initialRecords, null, 2));
}

export async function GET() {
  try {
    const raw = fs.readFileSync(RECORDS_FILE, 'utf-8');
    const records = JSON.parse(raw);
    return NextResponse.json(records.reverse());
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read clinical records from EBS volume: ' + err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { patientName, mrn, triage, vitals, diagnosis, physician } = body;

    if (!patientName || !diagnosis) {
      return NextResponse.json({ error: 'Patient name and diagnosis are required' }, { status: 400 });
    }

    const triageCodeMap = {
      Critical: 'P1',
      Urgent: 'P2',
      Stable: 'P3'
    };

    const newRecord = {
      id: Date.now().toString(),
      patientName: patientName.trim(),
      mrn: mrn?.trim() || `MRN-${Math.floor(1000 + Math.random() * 9000)}`,
      triage: triage || 'Stable',
      triageCode: triageCodeMap[triage] || 'P3',
      vitals: vitals?.trim() || 'Vitals within normal limits',
      diagnosis: diagnosis.trim(),
      physician: physician?.trim() || 'Attending Physician',
      createdAt: new Date().toLocaleString()
    };

    const records = JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf-8'));
    records.push(newRecord);
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));

    return NextResponse.json({ success: true, record: newRecord });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
