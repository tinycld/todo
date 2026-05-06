import type PocketBase from 'pocketbase'

interface SeedContext {
    user: { id: string; email: string; name: string }
    org: { id: string }
    userOrg: { id: string }
}

export default async function seed(pb: PocketBase, ctx: SeedContext): Promise<void> {
    await pb.collection('todo_items').create({
        owner: ctx.userOrg.id,
        name: 'Buy groceries',
        description: 'Eggs, milk, bread',
        completed: false,
    })
    await pb.collection('todo_items').create({
        owner: ctx.userOrg.id,
        name: 'Test tinycld framework',
        description: 'Build a TODO app and verify the Go re-open hook works',
        completed: true,
    })
}
