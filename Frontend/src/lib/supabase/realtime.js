import { supabase } from "./client";

/**
 * Subscribe to real-time changes on a user's vault entries.
 * Fires onInsert / onUpdate / onDelete callbacks as rows change.
 *
 * Usage:
 *   const unsub = subscribeToVault(userId, {
 *     onInsert: (entry) => addEntry(entry),
 *     onUpdate: (entry) => updateEntry(entry),
 *     onDelete: (entry) => removeEntry(entry.id),
 *   });
 *   return () => unsub();
 *
 * @returns {Function} unsubscribe — call this in your cleanup / useEffect return
 */
export function subscribeToVault(userId, { onInsert, onUpdate, onDelete } = {}) {
  const channel = supabase
    .channel(`vault:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "vault_entries",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onInsert?.(payload.new)
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "vault_entries",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onUpdate?.(payload.new)
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "vault_entries",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => onDelete?.(payload.old)
    )
    .subscribe();

  // Return unsubscribe function
  return () => supabase.removeChannel(channel);
}

/**
 * Subscribe to presence — track which users are online.
 * Useful for collaborative features later.
 *
 * @param {string} roomId
 * @param {Object} userInfo - { id, name } of the current user
 * @param {Function} onSync - called whenever presence state changes
 */
export function subscribeToPresence(roomId, userInfo, onSync) {
  const channel = supabase.channel(`presence:${roomId}`, {
    config: { presence: { key: userInfo.id } },
  });

  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      onSync?.(state);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track(userInfo);
      }
    });

  return () => supabase.removeChannel(channel);
}