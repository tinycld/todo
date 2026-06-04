package todo

import (
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tests"
)

// setupTodoTestApp builds a TestApp with a minimal todo_items collection
// (description + completed) and the uncomplete-on-edit hook bound. The owner
// relation from the production migration is irrelevant to the hook logic, so
// it's omitted to keep the fixture small.
func setupTodoTestApp(t *testing.T) *tests.TestApp {
	t.Helper()

	app, err := tests.NewTestApp()
	if err != nil {
		t.Fatalf("NewTestApp: %v", err)
	}
	t.Cleanup(func() { app.Cleanup() })

	todoItems := core.NewBaseCollection("todo_items")
	todoItems.Fields.Add(&core.TextField{Name: "description", Required: true})
	todoItems.Fields.Add(&core.BoolField{Name: "completed"})
	if err := app.Save(todoItems); err != nil {
		t.Fatalf("save todo_items: %v", err)
	}

	bindUncompleteOnDescriptionChange(app)

	return app
}

// newTodo persists a fresh todo and returns its id.
func newTodo(t *testing.T, app *tests.TestApp, description string, completed bool) string {
	t.Helper()

	collection, err := app.FindCollectionByNameOrId("todo_items")
	if err != nil {
		t.Fatalf("find todo_items: %v", err)
	}

	record := core.NewRecord(collection)
	record.Set("description", description)
	record.Set("completed", completed)
	if err := app.Save(record); err != nil {
		t.Fatalf("save new todo: %v", err)
	}
	return record.Id
}

// loadTodo fetches a fresh copy of the record from the DB. This mirrors how
// PocketBase processes a real update request — it loads the persisted record,
// applies the incoming changes, then fires OnRecordUpdate — which is what
// populates Record.Original() that the hook compares against.
func loadTodo(t *testing.T, app *tests.TestApp, id string) *core.Record {
	t.Helper()

	record, err := app.FindRecordById("todo_items", id)
	if err != nil {
		t.Fatalf("load todo %s: %v", id, err)
	}
	return record
}

func TestEditingDescriptionUncompletesCompletedTodo(t *testing.T) {
	app := setupTodoTestApp(t)
	id := newTodo(t, app, "ship it", true)

	record := loadTodo(t, app, id)
	record.Set("description", "ship it carefully")
	if err := app.Save(record); err != nil {
		t.Fatalf("update todo: %v", err)
	}

	reloaded := loadTodo(t, app, id)
	if reloaded.GetBool("completed") {
		t.Errorf("expected completed=false after editing description, got true")
	}
	if got := reloaded.GetString("description"); got != "ship it carefully" {
		t.Errorf("description not saved: got %q", got)
	}
}

func TestEditingDescriptionLeavesIncompleteTodoIncomplete(t *testing.T) {
	app := setupTodoTestApp(t)
	id := newTodo(t, app, "draft the plan", false)

	record := loadTodo(t, app, id)
	record.Set("description", "draft the detailed plan")
	if err := app.Save(record); err != nil {
		t.Fatalf("update todo: %v", err)
	}

	reloaded := loadTodo(t, app, id)
	if reloaded.GetBool("completed") {
		t.Errorf("expected completed to stay false, got true")
	}
}

func TestCompletingTodoWithoutDescriptionChangeIsPreserved(t *testing.T) {
	app := setupTodoTestApp(t)
	id := newTodo(t, app, "review the PR", false)

	// Toggle to completed WITHOUT touching the description — the hook must
	// not interfere, or marking things done would be impossible.
	record := loadTodo(t, app, id)
	record.Set("completed", true)
	if err := app.Save(record); err != nil {
		t.Fatalf("update todo: %v", err)
	}

	reloaded := loadTodo(t, app, id)
	if !reloaded.GetBool("completed") {
		t.Errorf("expected completed=true to be preserved, got false")
	}
}

func TestEditingSameDescriptionKeepsCompleted(t *testing.T) {
	app := setupTodoTestApp(t)
	id := newTodo(t, app, "no-op save", true)

	// Re-save with an identical description (and no other change). Since the
	// description didn't actually change, completed must remain true.
	record := loadTodo(t, app, id)
	record.Set("description", "no-op save")
	if err := app.Save(record); err != nil {
		t.Fatalf("update todo: %v", err)
	}

	reloaded := loadTodo(t, app, id)
	if !reloaded.GetBool("completed") {
		t.Errorf("expected completed to stay true when description unchanged, got false")
	}
}
