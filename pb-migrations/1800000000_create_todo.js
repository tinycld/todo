/// <reference path="../pb_data/types.d.ts" />

migrate(
    app => {
        const collection = new Collection({
            id: 'pbc_todo_items_01',
            type: 'base',
            name: 'todo_items',
            listRule: 'owner.user = @request.auth.id',
            viewRule: 'owner.user = @request.auth.id',
            createRule: 'owner.user = @request.auth.id',
            updateRule: 'owner.user = @request.auth.id',
            deleteRule: 'owner.user = @request.auth.id',
            fields: [
                {
                    id: 'todo_owner',
                    name: 'owner',
                    type: 'relation',
                    required: true,
                    collectionId: 'pbc_user_org_01',
                    cascadeDelete: true,
                    maxSelect: 1,
                },
                {
                    id: 'todo_name',
                    name: 'name',
                    type: 'text',
                    required: true,
                    min: 1,
                    max: 200,
                },
                {
                    id: 'todo_description',
                    name: 'description',
                    type: 'text',
                    max: 5000,
                },
                {
                    id: 'todo_completed',
                    name: 'completed',
                    type: 'bool',
                },
                {
                    id: 'todo_created',
                    name: 'created',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: false,
                },
                {
                    id: 'todo_updated',
                    name: 'updated',
                    type: 'autodate',
                    onCreate: true,
                    onUpdate: true,
                },
            ],
            indexes: [
                'CREATE INDEX `idx_todo_owner` ON `todo_items` (`owner`)',
            ],
        })
        app.save(collection)
    },
    app => {
        const collection = app.findCollectionByNameOrId('todo_items')
        app.delete(collection)
    }
)
