import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Upload to external CDN
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const response = await fetch('https://appcdn.lrtjakarta.co.id:3011/upload_image', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    const relativePath = result.files?.[0]?.path;

    if (!relativePath) {
      throw new Error('No path returned from upload');
    }

    return NextResponse.json({ path: relativePath });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
