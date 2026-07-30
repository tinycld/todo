import type { CoreStores } from '@tinycld/core/lib/pocketbase'
import type { Schema } from '@tinycld/core/types/pbSchema'
import type { createCollection } from 'pbtsdb/core'
import { BasicIndex } from 'pbtsdb/core'
import type { TodoSchema } from './types'

type MergedSchema = Schema & TodoSchema

// Collections contributed by this package. Core calls this during pbtsdb
// bootstrap; the returned object's keys become top-level keys on the app's
// MergedSchema (accessible via `useStore('...')`).
export function registerCollections(
    newCollection: ReturnType<typeof createCollection<MergedSchema>>,
    core: CoreStores
) {
    const indexing = {
        collectionOptions: {
            autoIndex: 'eager' as const,
            defaultIndexType: BasicIndex,
        },
    }

    const todo_items = newCollection('todo_items', {
        omitOnInsert: ['created', 'updated'] as const,
        ...indexing,
    })

    const tags = newCollection('tags', {
        omitOnInsert: ['created', 'updated'] as const,
        expand: { owner: core.users },
        ...indexing,
    })

    // Join table between todo_items and tags. Declaring the `todo` and `tag`
    // relations under expand lets queries load the linked records eagerly.
    const todo_tags = newCollection('todo_tags', {
        omitOnInsert: ['created', 'updated'] as const,
        expand: { todo: todo_items, tag: tags, owner: core.users },
        ...indexing,
    })

    return {
        todo_items,
        tags,
        todo_tags,
    }
}
