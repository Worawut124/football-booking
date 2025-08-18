import { supabase } from './supabaseClient';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * อัพโหลดไฟล์ไปยัง Supabase Storage
 */
export async function uploadFile(
  file: File | Buffer,
  bucket: string,
  path: string,
  fileName?: string
): Promise<UploadResult> {
  try {
    let fileBuffer: Buffer;
    let fileType: string;
    let finalFileName: string;

    if (file instanceof File) {
      fileBuffer = Buffer.from(await file.arrayBuffer());
      fileType = file.type;
      finalFileName = fileName || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    } else {
      fileBuffer = file;
      fileType = 'image/jpeg'; // default type
      finalFileName = fileName || `${Date.now()}-image.jpg`;
    }

    const fullPath = `${path}/${finalFileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fullPath, fileBuffer, {
        contentType: fileType,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return { url: '', path: '', error: error.message };
    }

    // ดึง public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fullPath);

    return {
      url: urlData.publicUrl,
      path: fullPath
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: '', path: '', error: 'Failed to upload file' };
  }
}

/**
 * ลบไฟล์จาก Supabase Storage
 */
export async function deleteFile(bucket: string, path: string): Promise<DeleteResult> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Supabase delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'Failed to delete file' };
  }
}

/**
 * อัพเดทไฟล์ใน Supabase Storage (ลบเก่าและอัพโหลดใหม่)
 */
export async function updateFile(
  file: File | Buffer,
  bucket: string,
  path: string,
  oldPath?: string,
  fileName?: string
): Promise<UploadResult> {
  try {
    // ลบไฟล์เก่าถ้ามี
    if (oldPath) {
      await deleteFile(bucket, oldPath);
    }

    // อัพโหลดไฟล์ใหม่
    return await uploadFile(file, bucket, path, fileName);
  } catch (error) {
    console.error('Update file error:', error);
    return { url: '', path: '', error: 'Failed to update file' };
  }
}

/**
 * แปลง base64 string เป็น Buffer
 */
export function base64ToBuffer(base64String: string): Buffer {
  // ลบ data URL prefix ถ้ามี
  const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
  return Buffer.from(base64Data, 'base64');
}

/**
 * แปลง Buffer เป็น base64 string
 */
export function bufferToBase64(buffer: Buffer, mimeType: string = 'image/jpeg'): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

