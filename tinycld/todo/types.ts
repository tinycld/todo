// Schema types for this package, merged into core's MergedSchema by the
// generator. Each entry maps a pbtsdb collection name to its record type
// and optional relations.

import type { UserOrg } from '@tinycld/core/types/pbSchema'

export interface TodoItem {
    id: string
    description: string
    completed: boolean
    owner: string
    created: string
    updated: string
}

export type TodoSchema = {
    todo_items: {
        type: TodoItem
        relations: {
            owner: UserOrg
        }
    }
}
