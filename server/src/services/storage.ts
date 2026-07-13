import { env } from '../config/env';

export const storageService = {
  /**
   * Upload binary buffer to Supabase Storage bucket and retrieve public URL.
   */
  upload: async (
    folder: 'products' | 'reviews' | 'banners' | 'profiles',
    fileName: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<string> => {
    const bucket = env.SUPABASE_BUCKET_NAME;
    const path = `${folder}/${Date.now()}_${fileName}`;
    const uploadUrl = `${env.SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;

    if (env.SUPABASE_ANON_KEY.includes('your') || env.SUPABASE_SERVICE_ROLE_KEY.includes('your')) {
      console.log(`[STORAGE MOCK] Uploading file to bucket ${bucket}/${path} (${mimeType})`);
      // Return simulated mock URL
      return `https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80`;
    }

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': mimeType,
          // Overwrite object if exists
          'x-upsert': 'true',
        },
        body: buffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase upload failed: ${response.statusText} - ${errorText}`);
      }

      // Return the public URL
      return `${env.SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    } catch (e) {
      console.error('Supabase Storage Upload error:', e);
      // Fallback
      return `https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=80`;
    }
  },

  /**
   * Delete object from bucket given its public URL
   */
  delete: async (publicUrl: string): Promise<void> => {
    if (
      env.SUPABASE_ANON_KEY.includes('your') ||
      env.SUPABASE_SERVICE_ROLE_KEY.includes('your') ||
      !publicUrl.includes(env.SUPABASE_URL)
    ) {
      console.log(`[STORAGE MOCK] Deleting file: ${publicUrl}`);
      return;
    }

    try {
      // Extract bucket and relative path from publicUrl
      // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[folder]/[filename]
      const bucketPrefix = `/storage/v1/object/public/${env.SUPABASE_BUCKET_NAME}/`;
      const index = publicUrl.indexOf(bucketPrefix);
      if (index === -1) return;

      const path = publicUrl.slice(index + bucketPrefix.length);
      const deleteUrl = `${env.SUPABASE_URL}/storage/v1/object/${env.SUPABASE_BUCKET_NAME}/${path}`;

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Supabase deletion warning: ${response.statusText} - ${errorText}`);
      }
    } catch (e) {
      console.error('Supabase Storage deletion failed', e);
    }
  },
};
export default storageService;
