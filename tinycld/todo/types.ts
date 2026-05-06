import type { Orgs, UserOrg, Users } from '@tinycld/core/types/pbSchema'

export interface TodoItem {
    id: string
    owner: string
    name: string
    description: string
    completed: boolean
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

export type { Orgs, UserOrg, Users }
