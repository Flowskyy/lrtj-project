import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

// CDN server sends incomplete cert chain (missing Sectigo intermediate).
// Use https.request with rejectUnauthorized:false scoped ONLY to this one CDN host.

function uploadToCDN(file: File): Promise<{ files: { path: string }[] }> {
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [500, 1000]; // Exponential backoff: 500ms, 1000ms

  const attemptUpload = (attempt: number): Promise<{ files: { path: string }[] }> => {
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
                // 4xx errors are client/validation errors - don't retry
                if (res.statusCode && res.statusCode >= 400 && res.statusCode < 500) {
                  reject(new Error(`CDN upload failed: ${res.statusCode} ${data}`));
                } else {
                  // 5xx errors are server/transient errors - retryable
                  reject(new Error(`CDN upload failed: ${res.statusCode} ${data}`));
                }
              }
            });
          }
        );

        req.on('error', (err) => {
          // Network errors like EBUSY, ECONNRESET, timeout - retryable
          reject(err);
        });
        req.write(body);
        req.end();
      }).catch(reject);
    });
  };

  const retryWithBackoff = async (attempt: number): Promise<{ files: { path: string }[] }> => {
    try {
      return await attemptUpload(attempt);
    } catch (error) {
      const isLastAttempt = attempt >= MAX_RETRIES;
      
      // Check if error is retryable
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isNetworkError = errorMessage.includes('EBUSY') || 
                             errorMessage.includes('ECONNRESET') ||
                             errorMessage.includes('ETIMEDOUT') ||
                             errorMessage.includes('ECONNREFUSED') ||
                             errorMessage.includes('timeout');
      
      // Extract status code if present
      const statusCodeMatch = errorMessage.match(/CDN upload failed: (\d+)/);
      const statusCode = statusCodeMatch ? parseInt(statusCodeMatch[1]) : null;
      
      // Don't retry on 4xx client errors
      if (statusCode && statusCode >= 400 && statusCode < 500) {
        throw error;
      }
      
      // Don't retry if it's the last attempt
      if (isLastAttempt) {
        throw error;
      }
      
      // Retry for network errors or 5xx server errors
      if (isNetworkError || (statusCode && statusCode >= 500)) {
        const delay = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        console.log(`CDN upload attempt ${attempt} failed (${errorMessage}). Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return retryWithBackoff(attempt + 1);
      }
      
      // Non-retryable error
      throw error;
    }
  };

  return retryWithBackoff(1);
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
