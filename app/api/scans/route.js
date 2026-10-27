import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SCANS_REGISTRY = path.join(DATA_DIR, 'scans_registry.json');
if (!fs.existsSync(SCANS_REGISTRY)) {
  const initialScans = [
    {
      id: '1730000000101',
      fileName: 'Chest_XRay_PA_MarcusS.png',
      scanType: 'Chest X-Ray',
      patientRef: 'Marcus Sterling (MRN-4821)',
      clinicalNotes: 'PA view showing clear lung fields, normal cardiothoracic ratio, intact ribcage.',
      fileSize: '1.4 MB',
      fileUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      s3Key: 'scans/Chest_XRay_PA_MarcusS.png',
      isImage: true,
      uploadedAt: new Date(Date.now() - 3600000 * 3).toLocaleString()
    },
    {
      id: '1730000000102',
      fileName: 'Brain_MRI_T2_Axial.png',
      scanType: 'Brain MRI Scan',
      patientRef: 'Eleanor Vance (MRN-1092)',
      clinicalNotes: 'T2-weighted axial cranial MRI showing symmetrical ventricles and preserved grey-white differentiation.',
      fileSize: '2.3 MB',
      fileUrl: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80',
      isImage: true,
      uploadedAt: new Date(Date.now() - 3600000 * 2).toLocaleString()
    },
    {
      id: '1730000000103',
      fileName: 'Complete_Blood_Count_CBC_Report.pdf',
      scanType: 'Pathology & Blood Panel',
      patientRef: 'Sophia Chen (MRN-7734)',
      clinicalNotes: 'CBC with Differential: Hemoglobin 14.1 g/dL, Platelets 260k/uL, WBC 6.8k/uL within normal limits.',
      fileSize: '342.5 KB',
      fileUrl: '#',
      s3Key: 'scans/Complete_Blood_Count_CBC_Report.pdf',
      isImage: false,
      uploadedAt: new Date(Date.now() - 1800000).toLocaleString()
    }
  ];
  fs.writeFileSync(SCANS_REGISTRY, JSON.stringify(initialScans, null, 2));
}

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

export async function GET() {
  try {
    const raw = fs.readFileSync(SCANS_REGISTRY, 'utf-8');
    const scans = JSON.parse(raw);
    return NextResponse.json(scans.reverse());
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read diagnostic scans index from EBS: ' + err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('scanFile') || formData.get('file') || formData.get('photo');
    const scanType = formData.get('scanType') || 'Diagnostic Scan';
    const patientRef = formData.get('patientRef') || 'General Diagnostic';
    const clinicalNotes = formData.get('clinicalNotes') || formData.get('caption') || '';

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No diagnostic scan file provided' }, { status: 400 });
    }

    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `scans/${cleanName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const isImage = file.type.startsWith('image/');

    let fileUrl = '#';

    if (process.env.S3_BUCKET_NAME) {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type
        })
      );
      fileUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`;
    }

    const scanRecord = {
      id: Date.now().toString(),
      fileName: file.name,
      scanType,
      patientRef,
      clinicalNotes,
      fileSize: file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
        : `${(file.size / 1024).toFixed(1)} KB`,
      fileUrl,
      s3Key,
      isImage,
      uploadedAt: new Date().toLocaleString()
    };

    const scans = JSON.parse(fs.readFileSync(SCANS_REGISTRY, 'utf-8'));
    scans.push(scanRecord);
    fs.writeFileSync(SCANS_REGISTRY, JSON.stringify(scans, null, 2));

    return NextResponse.json({ success: true, scan: scanRecord });
  } catch (err) {
    console.error('Scan upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
