import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  let instanceId = 'Localhost (Dev Simulation)';
  let availabilityZone = 'Local-AZ (Dev)';

  try {
    // 1. Fetch IMDSv2 Token (1 second timeout to avoid stalling on localhost)
    const tokenRes = await fetch('http://169.254.169.254/latest/api/token', {
      method: 'PUT',
      headers: { 'X-aws-ec2-metadata-token-ttl-seconds': '60' },
      signal: AbortSignal.timeout(1000)
    });

    if (tokenRes.ok) {
      const token = await tokenRes.text();

      // 2. Fetch Instance ID & AZ with token
      const [idRes, azRes] = await Promise.all([
        fetch('http://169.254.169.254/latest/meta-data/instance-id', {
          headers: { 'X-aws-ec2-metadata-token': token }
        }),
        fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone', {
          headers: { 'X-aws-ec2-metadata-token': token }
        })
      ]);

      if (idRes.ok) instanceId = await idRes.text();
      if (azRes.ok) availabilityZone = await azRes.text();
    }
  } catch (e) {
    // Falls back gracefully on localhost / non-EC2 environments
  }

  return NextResponse.json({
    instanceId,
    availabilityZone,
    hostname: os.hostname(),
    platform: `${os.type()} ${os.arch()}`,
    uptimeSec: Math.floor(os.uptime()),
    loadAvg: os.loadavg ? os.loadavg()[0].toFixed(2) : 'N/A',
    storagePath: process.env.DATA_PATH || '/data/clinical_records.json',
    s3Bucket: process.env.S3_BUCKET_NAME || 'Not Configured (Demo Mode)',
    region: process.env.AWS_REGION || 'ap-south-1'
  });
}
