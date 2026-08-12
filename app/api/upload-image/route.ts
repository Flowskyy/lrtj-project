import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

// CDN server sends incomplete cert chain (missing Sectigo intermediate).
// Use https.request with rejectUnauthorized:false scoped ONLY to this one CDN host.

function uploadToCDN(file: File): Promise<{ files: { path: string }[] }> {
  return new Promise((resolve, reject) => {
    const boundary = '----formdata' + Date.now();
    const arrayBuf = file.arrayBuffer();
    
    arrayBuf.then((ab) => {
      const fileData = Buffer.from(ab);
      const parts = [
        `--${boundary}\r\n`,
        `Content-Disposition: form-data; name="file"; filename="${file.name}"\r\n`,
        `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
        fileData,
        `\r\n--${boundary}--\r\n`,
      ];

      const body = Buffer.concat(parts.map(p => typeof p === 'string' ? Buffer.from(p) : p));

      const req = https.request(
        {
          hostname: 'appcdn.lrtjakarta.co.id',
          port: 3011,
          path: '/upload_image',
          method: 'POST',
          agent: new https.Agent({ rejectUnauthorized: false }),
          headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': body.length,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error(`CDN upload failed: ${res.statusCode} ${data}`));
            }
          });
        }
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    }).catch(reject);
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const result = await uploadToCDN(file);
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
