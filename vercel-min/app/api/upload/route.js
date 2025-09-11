import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const form = await req.formData();
    const fields = {};
    const files = [];
    for (const [key, value] of form.entries()) {
      if (value instanceof File) {
        files.push({
          fieldname: key,
          filename: value.name,
          mimeType: value.type,
          size: value.size
        });
        // NOTE: We do NOT persist files. On Vercel, the filesystem is ephemeral.
      } else {
        fields[key] = value;
      }
    }
    return NextResponse.json({
      ok: true,
      count: files.length,
      files,
      fields,
      service: 'justice-dashboard-min',
      at: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'POST a multipart/form-data request to this endpoint.' }, { status: 405 });
}
