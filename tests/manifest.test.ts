import { describe, expect, it } from 'vitest'
import manifest from '../manifest'

describe('todo manifest', () => {
    it('declares required identifiers', () => {
        expect(manifest.name).toBe('Todo')
        expect(manifest.slug).toBe('todo')
        expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/)
    })

    it('has a description', () => {
        expect(manifest.description).toBe('Todo for your organization')
    })

    it('wires its collections and migrations', () => {
        expect(manifest.collections).toEqual({ register: 'collections', types: 'types' })
        expect(manifest.migrations).toEqual({ directory: 'pb-migrations' })
    })

    it('declares the Go server extension that uncompletes edited todos', () => {
        expect(manifest.server).toEqual({
            package: 'server',
            module: 'tinycld.org/packages/todo',
        })
    })
})
