import type PocketBase from 'pocketbase'

// Seed function invoked by core/scripts/seed-db.ts for the primary test user.
// Receives the authenticated `pb` client plus the user context so records can
// be owned correctly. Return nothing; throw to abort the seed.
//
// Example:
//
//     await pb.collection('todo_items').create({
//         name: 'Sample',
//         owner: user.id,
//     })

interface SeedContext {
    user: { id: string; email: string; name: string }
}

export default async function seed(pb: PocketBase, ctx: SeedContext): Promise<void> {
    const samples = [
        { description: 'Read the tinycld docs', completed: true, tags: ['docs', 'learning'] },
        { description: 'Scaffold a feature package', completed: true, tags: ['learning'] },
        { description: 'Build a TODO app', completed: false, tags: ['code', 'fun'] },
        { description: 'Ship it', completed: false, tags: ['code'] },
    ]

    // Reuse one tag row per distinct name within the org (the same find-or-create
    // behaviour the UI relies on, backed by the unique (owner, name) index).
    const tagIds = new Map<string, string>()
    const findOrCreateTag = async (name: string): Promise<string> => {
        const cached = tagIds.get(name)
        if (cached) return cached
        const tag = await pb.collection('tags').create({ name, owner: ctx.userOrg.id })
        tagIds.set(name, tag.id)
        return tag.id
    }

    for (const sample of samples) {
        const todo = await pb.collection('todo_items').create({
            description: sample.description,
            completed: sample.completed,
            owner: ctx.user.id,
        })

        for (const name of sample.tags) {
            const tagId = await findOrCreateTag(name)
            await pb.collection('todo_tags').create({
                todo: todo.id,
                tag: tagId,
                owner: ctx.userOrg.id,
            })
        }
    }
}
