import { describe, expect, it } from 'vitest'
import { isStatus } from '../tinycld/todo/lib/is-status'

// isStatus underpins the find-or-create recovery in use-tag-mutations: the
// race-on-create (400) and duplicate-link no-op (400) and not-found (404)
// branches all depend on it correctly digging the PocketBase status out of an
// error that may be wrapped by the pbtsdb transaction layer.
describe('isStatus', () => {
    it('matches a bare ClientResponseError-shaped error', () => {
        expect(isStatus({ status: 404 }, 404)).toBe(true)
        expect(isStatus({ status: 400 }, 400)).toBe(true)
    })

    it('does not match a different status', () => {
        expect(isStatus({ status: 500 }, 400)).toBe(false)
        expect(isStatus({ status: 404 }, 400)).toBe(false)
    })

    it('unwraps an error nested under `cause`', () => {
        expect(isStatus({ cause: { status: 400 } }, 400)).toBe(true)
    })

    it('unwraps an error nested under `originalError`', () => {
        expect(isStatus({ originalError: { status: 404 } }, 404)).toBe(true)
    })

    it('unwraps several levels deep', () => {
        const wrapped = { cause: { cause: { originalError: { status: 400 } } } }
        expect(isStatus(wrapped, 400)).toBe(true)
    })

    it('returns false for non-object errors', () => {
        expect(isStatus(null, 400)).toBe(false)
        expect(isStatus(undefined, 400)).toBe(false)
        expect(isStatus('boom', 400)).toBe(false)
        expect(isStatus(400, 400)).toBe(false)
    })

    it('returns false when no link in the chain carries the status', () => {
        expect(isStatus({ cause: { message: 'nope' } }, 400)).toBe(false)
    })

    it('does not loop forever on a cyclic cause chain', () => {
        const a: { cause?: unknown; status?: number } = {}
        a.cause = a
        expect(isStatus(a, 400)).toBe(false)
    })

    it('stops after the depth bound even on a long chain', () => {
        // Build a chain deeper than the bound (5) with the status only at the
        // very bottom; it should be out of reach and report false.
        let deep: { cause: unknown } | { status: number } = { status: 400 }
        for (let i = 0; i < 10; i++) deep = { cause: deep }
        expect(isStatus(deep, 400)).toBe(false)
    })
})
