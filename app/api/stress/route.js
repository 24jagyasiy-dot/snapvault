import { NextResponse } from 'next/server';
 
export async function POST() {
  const durationMs = 45000; // 45 seconds of CPU load
  const start = Date.now();
 
  setTimeout(() => {
    while (Date.now() - start < durationMs) {
      Math.sqrt(Math.random() * 999999);
    }
  }, 10);
 
  return NextResponse.json({
    message: 'High CPU load initiated for 45s! Auto Scaling Group target tracking policy will trigger.'
  });
}

