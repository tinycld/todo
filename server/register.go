package todo

import (
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
	"tinycld.org/core/audit"
)

// Register wires server-side hooks for the Todo package.
//
// Behavior contract: editing a todo's description re-opens it. If a record
// update changes `description`, force `completed` to false before the save
// commits. This runs for any write path (API, JS hooks, Go callers) because
// it binds to OnRecordUpdate, not OnRecordUpdateRequest.
func Register(app *pocketbase.PocketBase) {
	audit.RegisterCollection(app, "todo_items", &audit.CollectionConfig{
		ExtractLabel: audit.LabelFromField("name"),
	})

	app.OnRecordUpdate("todo_items").BindFunc(func(e *core.RecordEvent) error {
		original := e.Record.Original()
		if original == nil {
			return e.Next()
		}
		if e.Record.GetString("description") != original.GetString("description") {
			e.Record.Set("completed", false)
		}
		return e.Next()
	})
}
