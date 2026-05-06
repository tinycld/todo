import { eq } from '@tanstack/db'
import { mutation, useMutation } from '@tinycld/core/lib/mutations'
import { useOrgHref } from '@tinycld/core/lib/org-routes'
import { useStore } from '@tinycld/core/lib/pocketbase'
import { useThemeColor } from '@tinycld/core/lib/use-app-theme'
import { useCurrentRole } from '@tinycld/core/lib/use-current-role'
import { useOrgLiveQuery } from '@tinycld/core/lib/use-org-live-query'
import { PlainInput } from '@tinycld/core/ui/PlainInput'
import { ThemedSwitch } from '@tinycld/core/ui/ThemedSwitch'
import { Link } from 'expo-router'
import { newRecordId } from 'pbtsdb/core'
import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

export default function TodoIndex() {
    const fg = useThemeColor('foreground')
    const muted = useThemeColor('muted-foreground')
    const border = useThemeColor('border')
    const orgHref = useOrgHref()
    const [todoCollection] = useStore('todo_items')
    const { userOrgId } = useCurrentRole()

    const [draftName, setDraftName] = useState('')

    const { data: items } = useOrgLiveQuery((query, { userOrgId }) =>
        query
            .from({ todo: todoCollection })
            .where(({ todo }) => eq(todo.owner, userOrgId))
            .orderBy(({ todo }) => todo.created, 'desc')
    )

    const create = useMutation({
        mutationFn: mutation(function* (name: string) {
            yield todoCollection.insert({
                id: newRecordId(),
                owner: userOrgId,
                name,
                description: '',
                completed: false,
            })
        }),
    })

    const toggle = useMutation({
        mutationFn: mutation(function* (input: { id: string; completed: boolean }) {
            yield todoCollection.update(input.id, (draft) => {
                draft.completed = input.completed
            })
        }),
    })

    const remove = useMutation({
        mutationFn: mutation(function* (id: string) {
            yield todoCollection.delete(id)
        }),
    })

    const submitNew = () => {
        const name = draftName.trim()
        if (!name || !userOrgId) return
        create.mutate(name)
        setDraftName('')
    }

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="p-6 gap-4">
                <Text style={{ color: fg, fontSize: 22, fontWeight: '600' }}>Todo</Text>

                <View className="flex-row gap-2 items-center">
                    <PlainInput
                        value={draftName}
                        onChangeText={setDraftName}
                        placeholder="What needs doing?"
                        style={{
                            flex: 1,
                            color: fg,
                            borderWidth: 1,
                            borderColor: border,
                            borderRadius: 6,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                        }}
                        onSubmitEditing={submitNew}
                    />
                    <Pressable onPress={submitNew} className="px-3 py-2 rounded-md bg-primary">
                        <Text style={{ color: fg, fontWeight: '600' }}>Add</Text>
                    </Pressable>
                </View>

                {items && items.length === 0 ? (
                    <Text style={{ color: muted, fontSize: 14 }}>No todos yet — add one above.</Text>
                ) : null}

                <View className="gap-2">
                    {(items ?? []).map((item) => (
                        <View
                            key={item.id}
                            className="flex-row items-center gap-3 p-3 rounded-md border border-border bg-card"
                        >
                            <ThemedSwitch
                                value={item.completed}
                                onValueChange={(value) => toggle.mutate({ id: item.id, completed: value })}
                            />
                            <Link href={orgHref(`todo/${item.id}`)} style={{ flex: 1 }}>
                                <View>
                                    <Text
                                        style={{
                                            color: fg,
                                            fontSize: 15,
                                            textDecorationLine: item.completed ? 'line-through' : 'none',
                                        }}
                                    >
                                        {item.name}
                                    </Text>
                                    {item.description ? (
                                        <Text style={{ color: muted, fontSize: 12 }} numberOfLines={1}>
                                            {item.description}
                                        </Text>
                                    ) : null}
                                </View>
                            </Link>
                            <Pressable onPress={() => remove.mutate(item.id)}>
                                <Text style={{ color: muted, fontSize: 13 }}>Delete</Text>
                            </Pressable>
                        </View>
                    ))}
                </View>
            </View>
        </ScrollView>
    )
}
