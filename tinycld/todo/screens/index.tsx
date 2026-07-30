import { eq } from '@tanstack/db'
import { useOrgHref } from '@tinycld/core/lib/org-routes'
import { useStore } from '@tinycld/core/lib/pocketbase'
import { useThemeColor } from '@tinycld/core/lib/use-app-theme'
import { useOrgLiveQuery } from '@tinycld/core/lib/use-org-live-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useTodoMutations } from '../hooks/use-todo-mutations'
import type { TodoItem } from '../types'

// Org-scoped index route for Todo, served at /a/<orgSlug>/todo.
// A typical todo list: add via the input, toggle the checkbox, tap a row to
// edit its description, or delete it inline.
export default function TodoIndex() {
    const fg = useThemeColor('foreground')
    const muted = useThemeColor('muted-foreground')
    const border = useThemeColor('border')
    const primary = useThemeColor('primary')
    const danger = useThemeColor('danger')

    const router = useRouter()
    const orgHref = useOrgHref()
    const [todoItems] = useStore('todo_items')
    const { addTodo, toggleTodo, deleteTodo } = useTodoMutations()

    const [draft, setDraft] = useState('')

    const { data } = useOrgLiveQuery((query, { userId }) =>
        query
            .from({ todo_items: todoItems })
            .where(({ todo_items }) => eq(todo_items.owner, userId))
            .orderBy(({ todo_items }) => todo_items.created, 'desc')
    )

    const items = (data ?? []) as TodoItem[]
    const remaining = items.filter(item => !item.completed).length

    const submit = () => {
        const description = draft.trim()
        if (!description) return
        addTodo.mutate(description)
        setDraft('')
    }

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="p-6 gap-4">
                <View className="gap-1">
                    <Text style={{ color: fg, fontSize: 22, fontWeight: '600' }}>Todo</Text>
                    <Text style={{ color: muted, fontSize: 13 }}>
                        {remaining} of {items.length} remaining
                    </Text>
                </View>

                <View className="flex-row items-center gap-2">
                    <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        onSubmitEditing={submit}
                        placeholder="Add a todo…"
                        placeholderTextColor={muted}
                        returnKeyType="done"
                        style={{
                            flex: 1,
                            color: fg,
                            borderWidth: 1,
                            borderColor: border,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 15,
                        }}
                    />
                    <Pressable
                        onPress={submit}
                        accessibilityRole="button"
                        accessibilityLabel="Add todo"
                        style={{
                            backgroundColor: primary,
                            borderRadius: 8,
                            paddingHorizontal: 16,
                            paddingVertical: 11,
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Add</Text>
                    </Pressable>
                </View>

                <View className="gap-2">
                    {items.length === 0 ? (
                        <Text style={{ color: muted, fontSize: 14 }}>
                            Nothing here yet. Add your first todo above.
                        </Text>
                    ) : (
                        items.map(item => (
                            <View
                                key={item.id}
                                className="flex-row items-center gap-3"
                                style={{
                                    borderWidth: 1,
                                    borderColor: border,
                                    borderRadius: 10,
                                    paddingHorizontal: 12,
                                    paddingVertical: 12,
                                }}
                            >
                                <Pressable
                                    onPress={() =>
                                        toggleTodo.mutate({
                                            id: item.id,
                                            completed: !item.completed,
                                        })
                                    }
                                    accessibilityRole="checkbox"
                                    accessibilityState={{ checked: item.completed }}
                                    accessibilityLabel={`Toggle ${item.description}`}
                                    style={{
                                        width: 22,
                                        height: 22,
                                        borderRadius: 6,
                                        borderWidth: 2,
                                        borderColor: item.completed ? primary : border,
                                        backgroundColor: item.completed ? primary : 'transparent',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {item.completed ? (
                                        <Text
                                            style={{ color: '#fff', fontSize: 14, lineHeight: 16 }}
                                        >
                                            ✓
                                        </Text>
                                    ) : null}
                                </Pressable>

                                <Pressable
                                    style={{ flex: 1 }}
                                    onPress={() =>
                                        router.push(orgHref('todo/[id]', { id: item.id }))
                                    }
                                    accessibilityRole="button"
                                    accessibilityLabel={`Edit ${item.description}`}
                                >
                                    <Text
                                        style={{
                                            color: item.completed ? muted : fg,
                                            fontSize: 15,
                                            textDecorationLine: item.completed
                                                ? 'line-through'
                                                : 'none',
                                        }}
                                    >
                                        {item.description}
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => deleteTodo.mutate(item.id)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Delete ${item.description}`}
                                    hitSlop={8}
                                >
                                    <Text style={{ color: danger, fontSize: 18, lineHeight: 18 }}>
                                        ×
                                    </Text>
                                </Pressable>
                            </View>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    )
}
