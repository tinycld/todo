// Does an error (possibly wrapped by the pbtsdb transaction layer) carry the
// given PocketBase HTTP status? Reads through the PocketBase client surface a
// bare ClientResponseError, but writes routed through pbtsdb's optimistic
// transactions can nest it under `cause` / `originalError`, so we walk a few
// common wrapper links before giving up. Unique-constraint violations come
// back as 400; missing records as 404.
//
// Kept dependency-free in its own module so it can be unit-tested without
// pulling in the PocketBase/React stack that use-tag-mutations depends on.
export function isStatus(error: unknown, status: number): boolean {
    let current: unknown = error
    for (let depth = 0; depth < 5 && current && typeof current === 'object'; depth++) {
        if ((current as { status?: number }).status === status) return true
        const next = current as { cause?: unknown; originalError?: unknown }
        current = next.cause ?? next.originalError
    }
    return false
}
