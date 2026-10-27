import { NextResponse } from 'next/server';

export async function POST() {
  const durationMs = 45000; // 45 seconds of CPU load
  const start = Date.now();

  // Run in a non-blocking timeout so the HTTP response returns immediately
  // while the thread spins high CPU load for 45 seconds to trigger CloudWatch alarm (>50% CPU)
  setTimeout(() => {
    while (Date.now() - start < durationMs) {
      Math.sqrt(Math.random() * 99999999);
    }
  }, 15);

  return NextResponse.json({
    status: 'ACTIVE_SURGE',
    message: '🚨 Emergency Patient Surge Simulation Active! High CPU computation triggered for 45s. The AWS Auto Scaling Group (ASG) target tracking policy (>50% CPU) will detect load and upscale EC2 instances.'
  });
}
