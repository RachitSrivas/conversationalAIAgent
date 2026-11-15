import { NextResponse } from 'next/server';
import { memoryStore } from '@/lib/memory/memory-store';

export async function GET() {
  try {
    const sessions = memoryStore.getSessions();
    return NextResponse.json({ sessions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = body.title || 'New Conversation';
    const session = memoryStore.createSession(title);
    return NextResponse.json({ session }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
