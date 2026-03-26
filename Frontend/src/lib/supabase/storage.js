import { supabase } from "./client";

const BUCKET = "vault-files";

// ── UPLOAD ─────────────────────────────────────────────────────────────────
/**
 * Upload a file to the vault-files bucket.
 * Path format: userId/filename
 *
 * @param {string} userId
 * @param {File} file  - browser File object
 * @returns {string} public URL of the uploaded file
 */
export async function uploadFile(userId, file) {
  const filePath = `${userId}/${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  return getPublicUrl(filePath);
}

// ── GET PUBLIC URL ─────────────────────────────────────────────────────────
/**
 * Get the public URL for a stored file.
 */
export function getPublicUrl(filePath) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

// ── DOWNLOAD ───────────────────────────────────────────────────────────────
/**
 * Download a file as a Blob.
 */
export async function downloadFile(filePath) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(filePath);

  if (error) throw error;
  return data; // Blob
}

// ── LIST FILES ─────────────────────────────────────────────────────────────
/**
 * List all files uploaded by a user.
 */
export async function listUserFiles(userId) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(userId, {
      sortBy: { column: "created_at", order: "desc" },
    });

  if (error) throw error;
  return data;
}

// ── DELETE ─────────────────────────────────────────────────────────────────
/**
 * Delete a file from storage.
 */
export async function deleteFile(filePath) {
  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) throw error;
}