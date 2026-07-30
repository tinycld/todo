// Schema types for this package, merged into core's MergedSchema by the
// generator. Each entry maps a pbtsdb collection name to its record type
// and optional relations.

import type { Users } from '@tinycld/core/types/pbSchema'

export interface TodoItem {
    id: string
    description: string
    completed: boolean
    owner: string
    created: string
    updated: string
}

// A distinct tag name within an org. `name` is the arbitrary text the user
// types; find-or-create (see use-tag-mutations.ts) keeps one row per name.
export interface Tag {
    id: string
    name: string
    owner: string
    created: string
    updated: string
}

// Join row linking a todo to a tag (many todos ↔ many tags).
export interface TodoTag {
    id: string
    todo: string
    tag: string
    owner: string
    created: string
    updated: string
}

export type TodoSchema = {
    todo_items: {
        type: TodoItem
        relations: {
            owner: Users
        }
    }
    tags: {
        type: Tag
        relations: {
            owner: Users
        }
    }
    todo_tags: {
        type: TodoTag
        relations: {
            todo: TodoItem
            tag: Tag
            owner: Users
        }
    }
}
