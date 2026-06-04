import { captureException } from '@tinycld/core/lib/errors'
import { mutation, useMutation } from '@tinycld/core/lib/mutations'
import { useStore } from '@tinycld/core/lib/pocketbase'
import { useCurrentRole } from '@tinycld/core/lib/use-current-role'
import { newRecordId } from 'pbtsdb/core'

// Org-scoped mutations for todo_items. Each row is owned by the caller's
// user_org (see the create rule in pb-migrations). New items default to
// incomplete; toggling and editing run as in-place updates.
export function useTodoMutations() {
    const [todoItems] = useStore('todo_items')
    const { userOrgId } = useCurrentRole()

    const onError = (error: unknown) => {
        captureException('Todo action failed', error)
    }

    const addTodo = useMutation({
        mutationFn: mutation(function* (description: string) {
            yield todoItems.insert({
                id: newRecordId(),
                description,
                completed: false,
                owner: userOrgId,
            })
        }),
        onError,
    })

    const toggleTodo = useMutation({
        mutationFn: mutation(function* ({ id, completed }: { id: string; completed: boolean }) {
            yield todoItems.update(id, draft => {
                draft.completed = completed
            })
        }),
        onError,
    })

    // Editing the description intentionally does NOT touch `completed` here.
    // The Go server hook is responsible for clearing the completed flag when
    // a description changes, so the behaviour holds for every client and for
    // direct API writes — not just this UI.
    const editTodo = useMutation({
        mutationFn: mutation(function* ({ id, description }: { id: string; description: string }) {
            yield todoItems.update(id, draft => {
                draft.description = description
            })
        }),
        onError,
    })

    const deleteTodo = useMutation({
        mutationFn: mutation(function* (id: string) {
            yield todoItems.delete(id)
        }),
        onError,
    })

    return { addTodo, toggleTodo, editTodo, deleteTodo }
}
