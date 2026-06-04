import { eq } from '@tanstack/db'
import { useOrgHref } from '@tinycld/core/lib/org-routes'
import { useStore } from '@tinycld/core/lib/pocketbase'
import { useThemeColor } from '@tinycld/core/lib/use-app-theme'
import { useOrgLiveQuery } from '@tinycld/core/lib/use-org-live-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useTodoMutations } from '../hooks/use-todo-mutations'
import type { TodoItem } from '../types'

// Dynamic detail route at /a/<orgSlug>/todo/<id>. Lets you edit a todo's
// description. Note: saving a new description deliberately leaves `completed`
// alone here — the Go server hook resets it to incomplete when the text
// actually changes, so the behaviour is enforced server-side for every client.
export default function TodoDetail() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const muted = useThemeColor('muted-foreground')

    const [todoItems] = useStore('todo_items')
    const { data } = useOrgLiveQuery(
        (query, { userOrgId }) =>
            query
                .from({ todo_items: todoItems })
                .where(({ todo_items }) => eq(todo_items.owner, userOrgId)),
        [id]
    )

    const item = ((data ?? []) as TodoItem[]).find(t => t.id === id) ?? null

    if (!item) {
        return (
            <View className="p-6 gap-3">
                <Text style={{ color: muted, fontSize: 14 }}>Loading item {id}…</Text>
            </View>
        )
    }

    // Keyed by item.id so the editor's local input state re-initialises from
    // scratch whenever a different todo is shown — no syncing effect needed.
    return <TodoEditor key={item.id} item={item} />
}

function TodoEditor({ item }: { item: TodoItem }) {
    const fg = useThemeColor('foreground')
    const muted = useThemeColor('muted-foreground')
    const border = useThemeColor('border')
    const primary = useThemeColor('primary')

    const router = useRouter()
    const orgHref = useOrgHref()
    const { editTodo, toggleTodo } = useTodoMutations()

    const [description, setDescription] = useState(item.description)

    const goBack = () => router.push(orgHref('todo'))
    const dirty = description.trim() !== item.description && description.trim().length > 0

    const save = () => {
        if (!dirty) {
            goBack()
            return
        }
        editTodo.mutate({ id: item.id, description: description.trim() }, { onSuccess: goBack })
    }

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="p-6 gap-4">
                <Text style={{ color: fg, fontSize: 22, fontWeight: '600' }}>Edit todo</Text>

                <View className="gap-2">
                    <Text style={{ color: muted, fontSize: 12, fontWeight: '600' }}>
                        DESCRIPTION
                    </Text>
                    <TextInput
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        placeholder="Describe the todo…"
                        placeholderTextColor={muted}
                        style={{
                            color: fg,
                            borderWidth: 1,
                            borderColor: border,
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 10,
                            fontSize: 15,
                            minHeight: 80,
                            textAlignVertical: 'top',
                        }}
                    />
                </View>

                <Pressable
                    onPress={() => toggleTodo.mutate({ id: item.id, completed: !item.completed })}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.completed }}
                    className="flex-row items-center gap-3"
                >
                    <View
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
                            <Text style={{ color: '#fff', fontSize: 14, lineHeight: 16 }}>✓</Text>
                        ) : null}
                    </View>
                    <Text style={{ color: fg, fontSize: 15 }}>
                        {item.completed ? 'Completed' : 'Not completed'}
                    </Text>
                </Pressable>

                {item.completed && dirty ? (
                    <Text style={{ color: muted, fontSize: 12 }}>
                        Editing the description will mark this todo as not completed.
                    </Text>
                ) : null}

                <View className="flex-row gap-2">
                    <Pressable
                        onPress={save}
                        accessibilityRole="button"
                        accessibilityLabel="Save todo"
                        style={{
                            backgroundColor: primary,
                            borderRadius: 8,
                            paddingHorizontal: 16,
                            paddingVertical: 11,
                        }}
                    >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                    </Pressable>
                    <Pressable
                        onPress={goBack}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel"
                        style={{
                            borderWidth: 1,
                            borderColor: border,
                            borderRadius: 8,
                            paddingHorizontal: 16,
                            paddingVertical: 11,
                        }}
                    >
                        <Text style={{ color: fg, fontWeight: '600' }}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    )
}
