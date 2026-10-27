import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
 

 
const DATA_DIR = fs.existsSync('/data') ? '/data' : path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
 
const JOURNAL_FILE = path.join(DATA_DIR, 'journal.json');
if (!fs.existsSync(JOURNAL_FILE)) {
  fs.writeFileSync(JOURNAL_FILE, JSON.stringify([]));
}
 
export async function GET() {
  try {
    const entries = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf-8'));
    return NextResponse.json(entries.reverse());
  } catch (err) {
    return NextResponse.json({ error: 'Failed to read journal from EBS' }, { status: 500 });
  }
}
 
export async function POST(req) {
  try {
    const { title, mood, content } = await req.json();
 
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }
 
    const newEntry = {
      id: Date.now().toString(),
      title,
      mood: mood || '😊',
      content,
      createdAt: new Date().toLocaleString()
    };
 
    const entries = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf-8'));
    entries.push(newEntry);
    fs.writeFileSync(JOURNAL_FILE, JSON.stringify(entries, null, 2));
 
    return NextResponse.json({ success: true, entry: newEntry });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

