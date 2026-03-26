import { supabase } from "./client";

// ── VAULT ENTRIES ──────────────────────────────────────────────────────────

/**
 * Fetch all vault entries for the logged-in user.
 * Ordered by most recently updated.
 */
export async function getVaultEntries(userId) {
  const { data, error } = await supabase
    .from("vault_entries")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Fetch a single vault entry by its ID.
 */
export async function getVaultEntry(entryId) {
  const { data, error } = await supabase
    .from("vault_entries")
    .select("*")
    .eq("id", entryId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create a new vault entry.
 * @param {Object} entry - { user_id, title, content, tags, is_pinned }
 */
export async function createVaultEntry(entry) {
  const { data, error } = await supabase
    .from("vault_entries")
    .insert([entry])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing vault entry by ID.
 * @param {string} entryId
 * @param {Object} updates - fields to update
 */
export async function updateVaultEntry(entryId, updates) {
  const { data, error } = await supabase
    .from("vault_entries")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", entryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a vault entry by ID.
 */
export async function deleteVaultEntry(entryId) {
  const { error } = await supabase
    .from("vault_entries")
    .delete()
    .eq("id", entryId);

  if (error) throw error;
}

/**
 * Search vault entries by title or content (full-text search).
 */
export async function searchVaultEntries(userId, query) {
  const { data, error } = await supabase
    .from("vault_entries")
    .select("*")
    .eq("user_id", userId)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ── USER PROFILES ──────────────────────────────────────────────────────────

/**
 * Get a user's profile row from the profiles table.
 */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Upsert (create or update) a user profile.
 */
export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile)
    .select()
    .single();

  if (error) throw error;
  return data;
}