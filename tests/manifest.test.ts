import { describe, expect, it } from 'vitest'
import manifest from '../manifest'

describe('todo manifest', () => {
    it('declares required identifiers', () => {
        expect(manifest.name).toBe('Todo')
        expect(manifest.slug).toBe('todo')
        expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/)
    })

    it('has a description', () => {
        expect(manifest.description).toBe('Simple TODO app for testing tinycld')
    })
})
