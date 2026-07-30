/// <reference path="../pb_data/types.d.ts" />

// Adds tagging to todo. Two collections:
//
//   tags       — one row per distinct tag name within an org. `name` holds the
//                arbitrary text the user types. A unique index on (owner, name)
//                makes find-or-create reliable: a given org can only have one
//                `tags` row for a given name, so the lookup-then-create flow in
//                use-tag-mutations.ts can never produce duplicates.
//
//   todo_tags  — join table linking a todo_items row to a tags row (many todos
//                ↔ many tags). Both relations cascade-delete, so removing a
//                todo or a tag clears the corresponding links automatically.
//                A unique index on (todo, tag) keeps a tag from being attached
//                to the same todo twice.
//
// Auth rules follow the same user-scoped pattern as todo_items: access is
// granted when the caller owns the row (`owner` points at `users`).

migrate(
    app => {
        const tags = new Collection({
            id: 'pbc_todo_tags_01',
            type: 'base',
            name: 'tags',
            listRule: 'owner = @request.auth.id',
            viewRule: 'owner = @request.auth.id',
            createRule: 'owner = @request.auth.id',
            updateRule: 'owner = @request.auth.id',
            deleteRule: 'owner = @request.auth.id',
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                    min: 1,
                    max: 50,
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
                'CREATE UNIQUE INDEX `idx_tags_owner_name` ON `tags` (`owner`, `name`)',
            ],
        })
        app.save(tags)

        // todo_items was created without an explicit id in the initial
        // migration, so PocketBase generated one. Resolve it by name rather
        // than hard-coding, so the relation points at the real collection.
        const todoItems = app.findCollectionByNameOrId('todo_items')

        const todoTags = new Collection({
            id: 'pbc_todo_tag_link01',
            type: 'base',
            name: 'todo_tags',
            listRule: 'owner = @request.auth.id',
            viewRule: 'owner = @request.auth.id',
            createRule: 'owner = @request.auth.id',
            updateRule: 'owner = @request.auth.id',
            deleteRule: 'owner = @request.auth.id',
            fields: [
                {
                    name: 'todo',
                    type: 'relation',
                    required: true,
                    collectionId: todoItems.id,
                    cascadeDelete: true,
                    maxSelect: 1,
                },
                {
                    name: 'tag',
                    type: 'relation',
                    required: true,
                    collectionId: 'pbc_todo_tags_01',
                    cascadeDelete: true,
                    maxSelect: 1,
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
                'CREATE UNIQUE INDEX `idx_todo_tags_pair` ON `todo_tags` (`todo`, `tag`)',
                'CREATE INDEX `idx_todo_tags_owner` ON `todo_tags` (`owner`)',
                'CREATE INDEX `idx_todo_tags_tag` ON `todo_tags` (`tag`)',
            ],
        })
        app.save(todoTags)
    },
    app => {
        // Drop the join table first so its relations to `tags` are gone before
        // `tags` itself is removed.
        app.delete(app.findCollectionByNameOrId('todo_tags'))
        app.delete(app.findCollectionByNameOrId('tags'))
    }
)
