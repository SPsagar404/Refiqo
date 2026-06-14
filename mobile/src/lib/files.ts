import { api, unwrap } from './apiClient';

export type FileKind = 'resume' | 'avatar' | 'attachment';

interface SignedUpload {
  uploadUrl: string;
  fileKey: string;
  method: 'PUT' | 'POST';
  headers?: Record<string, string>;
}

export interface UploadedFile {
  id?: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Three-step upload via the backend's StoragePort contract:
 * 1) request a signed URL, 2) PUT the bytes, 3) confirm to persist a row.
 * Works against the local adapter in dev and Cloudinary/Supabase in prod.
 */
export async function uploadFile(input: {
  uri: string;
  kind: FileKind;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<UploadedFile> {
  const signed = unwrap<SignedUpload>(
    (
      await api.post('/files/upload-url', {
        kind: input.kind,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      })
    ).data,
  );

  const blob = await (await fetch(input.uri)).blob();
  await fetch(signed.uploadUrl, {
    method: signed.method,
    headers: signed.headers ?? { 'Content-Type': input.mimeType },
    body: blob,
  });

  const confirmed = unwrap<{ id?: string }>(
    (
      await api.post('/files/confirm', {
        fileKey: signed.fileKey,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
      })
    ).data,
  );

  return {
    id: confirmed.id,
    fileKey: signed.fileKey,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
  };
}
