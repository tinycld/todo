/// <reference path="../pb_data/types.d.ts" />

// Initial migration for todo. Creates a single `todo_items`
// collection matching the shape declared in types.ts / collections.ts.
// Replace or extend this as you build out the package.
//
// Auth rules: every TinyCld collection ships with rules. Without them
// PocketBase falls back to "superusers only" and every insert/select fails
// with "Only superusers can perform this action." Single-org deployment: the
// process IS one org, so there is no org to scope by — each row has an `owner`
// relation pointing straight at the `users` collection, and the rule allows
// access when the caller owns the row. This matches the pattern used by
// @tinycld/contacts and friends.
//
// If your data isn't user-scoped (public, shared, anything else), pick the
// right rule pattern from the docs:
//   https://tinycld.org/docs/tasks/auth-rules

migrate(
    app => {
        const collection = new Collection({
            type: 'base',
            name: 'todo_items',
            listRule: 'owner = @request.auth.id',
            viewRule: 'owner = @request.auth.id',
            createRule: 'owner = @request.auth.id',
            updateRule: 'owner = @request.auth.id',
            deleteRule: 'owner = @request.auth.id',
            fields: [
                {
                    name: 'description',
                    type: 'text',
                    required: true,
                    min: 1,
                    max: 500,
                },
                {
                    name: 'completed',
                    type: 'bool',
                    required: false,
                },
                {
                    name: 'owner',
                    type: 'relation',
                    required: true,
                    collectionId: '_pb_users_auth_',
                    cascadeDelete: true,
                    maxSelect: 1,
                },
                {
                    name: 'created',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: false,
                },
                {
                    name: 'updated',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: true,
                },
            ],
            indexes: [
                'CREATE INDEX `idx_todo_items_owner` ON `todo_items` (`owner`)',
            ],
        })
        app.save(collection)
    },
    app => {
        const collection = app.findCollectionByNameOrId('todo_items')
        app.delete(collection)
    }
)
