import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
 
export const dynamic = 'force-dynamic';
 
const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
 
const PHOTOS_REGISTRY = path.join(DATA_DIR, 'photos_registry.json');
if (!fs.existsSync(PHOTOS_REGISTRY)) {
  fs.writeFileSync(PHOTOS_REGISTRY, JSON.stringify([]));
}
 
const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });
 
export async function GET() {
  try {
    const photos = JSON.parse(fs.readFileSync(PHOTOS_REGISTRY, 'utf-8'));
    return NextResponse.json(photos.reverse());
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read photo index' }, { status: 500 });
  }
}
 
export async function POST(req) {
  try {
    const formData = await req.formData();
    const photo = formData.get('photo');
    const caption = formData.get('caption') || '';
 
    if (!photo || photo.size === 0) {
      return NextResponse.json({ error: 'No photo uploaded' }, { status: 400 });
    }
    if (!photo.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }
 
    const cleanName = photo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `gallery/${cleanName}`;
    const buffer = Buffer.from(await photo.arrayBuffer());
 
    let photoUrl = '#';
 
    if (process.env.S3_BUCKET_NAME) {
      await s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: s3Key,
          Body: buffer,
          ContentType: photo.type
        })
      );
      photoUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${s3Key}`;
    }
 
    const photoRecord = {
      id: Date.now().toString(),
      fileName: photo.name,
      caption,
      fileSize: `${(photo.size / 1024).toFixed(1)} KB`,
      photoUrl,
      s3Key,
      uploadedAt: new Date().toLocaleString()
    };
 
    const photos = JSON.parse(fs.readFileSync(PHOTOS_REGISTRY, 'utf-8'));
    photos.push(photoRecord);
    fs.writeFileSync(PHOTOS_REGISTRY, JSON.stringify(photos, null, 2));
 
    return NextResponse.json({ success: true, photo: photoRecord });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
