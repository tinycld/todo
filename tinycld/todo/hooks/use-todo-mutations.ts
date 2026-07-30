import { useAuth } from '@tinycld/core/lib/auth'
import { captureException } from '@tinycld/core/lib/errors'
import { mutation, useMutation } from '@tinycld/core/lib/mutations'
import { useStore } from '@tinycld/core/lib/pocketbase'
import { newRecordId } from 'pbtsdb/core'

// User-scoped mutations for todo_items. Single-org deployment: each row is
// owned by the caller's `users` record (see the create rule in pb-migrations).
// New items default to incomplete; toggling and editing run as in-place updates.
export function useTodoMutations() {
    const [todoItems] = useStore('todo_items')
    const { user } = useAuth()

    const onError = (error: unknown) => {
        captureException('Todo action failed', error)
    }

    const addTodo = useMutation({
        mutationFn: mutation(function* (description: string) {
            yield todoItems.insert({
                id: newRecordId(),
                description,
                completed: false,
                owner: user.id,
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
