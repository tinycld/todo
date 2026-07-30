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
        { description: 'Read the tinycld docs', completed: true },
        { description: 'Scaffold a feature package', completed: true },
        { description: 'Build a TODO app', completed: false },
        { description: 'Ship it', completed: false },
    ]

    for (const sample of samples) {
        await pb.collection('todo_items').create({
            description: sample.description,
            completed: sample.completed,
            owner: ctx.user.id,
        })
    }
}
