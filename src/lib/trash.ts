/**
 * Trash-aware base filters (requirements §5.7). Live documents have no
 * `deletedAt`; trashed ones do. Every list/derived query starts from one of
 * these so soft-deleted rows are invisible until the trash view asks for them.
 */

/** Documents not in the trash. */
export function liveFilter(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { deletedAt: null, ...extra };
}

/** Documents sitting in the trash. */
export function trashFilter(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { deletedAt: { $ne: null }, ...extra };
}
