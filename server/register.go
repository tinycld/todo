package todo

import (
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

// Register wires server-side hooks for the Todo package. Core's generator
// injects a call to this function from `server/package_extensions.go` once the
// package is linked.
//
// The Todo package enforces one rule server-side: whenever a todo's
// description is edited, the item is automatically marked as NOT completed.
// Doing this in Go (rather than in the client) means the rule holds for every
// caller — the app UI, a third-party API client, an admin edit, anything that
// updates the record goes through the same hook.
func Register(app *pocketbase.PocketBase) {
	bindUncompleteOnDescriptionChange(app)
}

// bindUncompleteOnDescriptionChange registers a pre-update hook on the
// todo_items collection. It fires before the row is persisted, so any field we
// set on e.Record is saved as part of the same write — no second update, no
// race. It takes the core.App interface (rather than *pocketbase.PocketBase)
// so the hook can be exercised against tests.TestApp in register_test.go.
func bindUncompleteOnDescriptionChange(app core.App) {
	app.OnRecordUpdate("todo_items").BindFunc(func(e *core.RecordEvent) error {
		// Original() is the currently-persisted record; e.Record holds the
		// incoming changes. A nil Original means this isn't a normal update
		// (e.g. an upsert of a new row) — nothing to compare against.
		original := e.Record.Original()
		if original == nil {
			return e.Next()
		}

		newDescription := e.Record.GetString("description")
		oldDescription := original.GetString("description")

		// Only act when the description actually changed and the item is
		// currently marked complete. Toggling completion or editing other
		// fields must not be disturbed.
		if newDescription != oldDescription && e.Record.GetBool("completed") {
			e.Record.Set("completed", false)
		}

		return e.Next()
	})
}
