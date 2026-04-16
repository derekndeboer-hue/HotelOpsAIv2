import { config } from './env';
import fs from 'fs';
import path from 'path';
import * as gcpStorage from '@google-cloud/storage';

const isLocalDev = !config.GCP_PROJECT_ID;

let storageClient: gcpStorage.Storage | null = null;

if (!isLocalDev) {
  storageClient = new gcpStorage.Storage({ projectId: config.GCP_PROJECT_ID });
} else {
  console.warn('[Storage] Running in local mode — files saved to .local-uploads/');
  const uploadsDir = path.join(process.cwd(), '.local-uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload a file to Cloud Storage and return the public URL.
 */
export async function uploadFile(
  bucketName: string,
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (isLocalDev) {
    const localPath = path.join(process.cwd(), '.local-uploads', filePath);
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(localPath, buffer);
    console.warn(`[Storage:local] Saved ${filePath} (${buffer.length} bytes)`);
    return `http://localhost:${config.PORT}/local-uploads/${filePath}`;
  }

  const bucket = storageClient!.bucket(bucketName);
  const file = bucket.file(filePath);

  await file.save(buffer, {
    metadata: {
      contentType,
    },
    resumable: false,
  });

  return `https://storage.googleapis.com/${bucketName}/${filePath}`;
}

/**
 * Get a signed URL for temporary access to a private file.
 */
export async function getSignedUrl(
  bucketName: string,
  filePath: string,
  expiresInMinutes: number = 60
): Promise<string> {
  if (isLocalDev) {
    return `http://localhost:${config.PORT}/local-uploads/${filePath}`;
  }

  const bucket = storageClient!.bucket(bucketName);
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}

export const storage = storageClient;
