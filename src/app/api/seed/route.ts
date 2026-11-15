import { NextResponse } from 'next/server';
import { memoryStore } from '@/lib/memory/memory-store';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const referenceDate = body.referenceDate ? new Date(body.referenceDate) : new Date();
    memoryStore.seedBenchmark(referenceDate);
    const sessions = memoryStore.getSessions();
    return NextResponse.json({
      success: true,
      message: 'Benchmark fixtures loaded successfully',
      sessions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
