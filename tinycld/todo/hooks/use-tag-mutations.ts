import { and, eq } from '@tanstack/db'
import { useAuth } from '@tinycld/core/lib/auth'
import { captureException } from '@tinycld/core/lib/errors'
import { mutation, useMutation } from '@tinycld/core/lib/mutations'
import { pb, useStore } from '@tinycld/core/lib/pocketbase'
import { useOrgLiveQuery } from '@tinycld/core/lib/use-org-live-query'
import { newRecordId } from 'pbtsdb/core'
import { isStatus } from '../lib/is-status'
import type { Tag, TodoTag } from '../types'

// User-scoped tagging for todos. `tags` holds one row per distinct name; a todo
// is linked to a tag through a `todo_tags` join row.
//
// addTag uses find-or-create: it looks for an existing tag with the given name
// for this user, creates one only if none exists, then links it to the todo. The
// (owner, name) unique index in the migration backs this — two near-simultaneous
// creates of the same name surface as a unique-constraint error rather than a
// duplicate row, and we recover by re-reading the now-existing tag.
export function useTagMutations() {
    // Note: tag creation goes through `pb.collection('tags').create()` (not the
    // pbtsdb store) so unique-constraint errors surface as a plain 400; only the
    // join store is needed here for inserts/deletes.
    const [todoTags] = useStore('todo_tags')
    const { user } = useAuth()

    const onError = (error: unknown) => {
        captureException('Tag action failed', error)
    }

    // Find an existing tag by name for this user, or create it. Returns the
    // tag id. Both the read and the create go through the PocketBase client
    // directly (rather than the pbtsdb store) so the unique-constraint error
    // surfaces as a plain PocketBase 400 we can branch on; the store still
    // picks up the new row via realtime. Mirrors core's label mutations,
    // which likewise hit `pb.collection(...)` for read-then-write flows.
    const findOrCreateTag = async (name: string): Promise<string> => {
        const filter = pb.filter('owner = {:owner} && name = {:name}', {
            owner: user.id,
            name,
        })
        const findExisting = () => pb.collection('tags').getFirstListItem<Tag>(filter)

        const existing = await findExisting().catch(error => {
            // 404 = no match yet; anything else is a real failure.
            if (isStatus(error, 404)) return null
            throw error
        })
        if (existing) return existing.id

        try {
            const created = await pb
                .collection('tags')
                .create<Tag>({ id: newRecordId(), name, owner: user.id })
            return created.id
        } catch (error) {
            // Lost a create race against the unique (owner, name) index — the
            // other writer won, so re-read and use their row.
            if (isStatus(error, 400)) return (await findExisting()).id
            throw error
        }
    }

    // Tag a todo with arbitrary text: find-or-create the tag, then link it.
    const addTag = useMutation<void, Error, { todoId: string; name: string }>({
        mutationFn: async ({ todoId, name }) => {
            const trimmed = name.trim()
            if (!trimmed) return

            const tagId = await findOrCreateTag(trimmed)

            // Skip if this todo already carries the tag. This is a best-effort
            // pre-check; the (todo, tag) unique index is the real guard, so the
            // insert below still tolerates the race where two adds slip past
            // this check concurrently.
            const alreadyLinked = await pb
                .collection('todo_tags')
                .getFirstListItem<TodoTag>(
                    pb.filter('todo = {:todo} && tag = {:tag}', { todo: todoId, tag: tagId })
                )
                .then(() => true)
                .catch(error => {
                    if (isStatus(error, 404)) return false
                    throw error
                })
            if (alreadyLinked) return

            try {
                await mutation(function* () {
                    yield todoTags.insert({
                        id: newRecordId(),
                        todo: todoId,
                        tag: tagId,
                        owner: user.id,
                    })
                })()
            } catch (error) {
                // A concurrent add already created the link — the unique
                // (todo, tag) index rejected this one. The desired end state
                // (todo carries the tag) holds, so treat it as a no-op rather
                // than surfacing a failure.
                if (!isStatus(error, 400)) throw error
            }
        },
        onError,
    })

    // Remove a single todo↔tag link by the join row's id. The tag itself is
    // left in place so it stays available for other todos.
    const removeTag = useMutation({
        mutationFn: mutation(function* (todoTagId: string) {
            yield todoTags.delete(todoTagId)
        }),
        onError,
    })

    return { addTag, removeTag }
}

// Live list of a todo's tags, joining todo_tags → tags. Returns the join row
// id (for removal) alongside the tag id and name.
export interface TodoTagView {
    todoTagId: string
    tagId: string
    name: string
}

export function useTodoTags(todoId: string): TodoTagView[] {
    const [todoTags] = useStore('todo_tags')
    const [tags] = useStore('tags')

    // Inner-join the join table to tags and project the exact fields we need.
    // An explicit .select() flattens the result to { todoTagId, tagId, name }
    // rows, so we don't depend on the default namespaced join-row shape.
    const { data } = useOrgLiveQuery(
        (query, { userId }) =>
            query
                .from({ todo_tags: todoTags })
                .join({ tags }, ({ todo_tags, tags }) => eq(todo_tags.tag, tags.id), 'inner')
                .where(({ todo_tags }) =>
                    and(eq(todo_tags.todo, todoId), eq(todo_tags.owner, userId))
                )
                .select(({ todo_tags, tags }) => ({
                    todoTagId: todo_tags.id,
                    tagId: tags.id,
                    name: tags.name,
                })),
        [todoId]
    )

    return [...((data ?? []) as TodoTagView[])].sort((a, b) => a.name.localeCompare(b.name))
}
