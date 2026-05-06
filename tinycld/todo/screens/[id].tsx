import { eq } from '@tanstack/db'
import { mutation, useMutation } from '@tinycld/core/lib/mutations'
import { useOrgHref } from '@tinycld/core/lib/org-routes'
import { useStore } from '@tinycld/core/lib/pocketbase'
import { useThemeColor } from '@tinycld/core/lib/use-app-theme'
import { useOrgLiveQuery } from '@tinycld/core/lib/use-org-live-query'
import { PlainInput } from '@tinycld/core/ui/PlainInput'
import { ThemedSwitch } from '@tinycld/core/ui/ThemedSwitch'
import { Link, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

export default function TodoDetail() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const fg = useThemeColor('foreground')
    const muted = useThemeColor('muted-foreground')
    const border = useThemeColor('border')
    const orgHref = useOrgHref()
    const [todoCollection] = useStore('todo_items')

    const { data: matches } = useOrgLiveQuery((query) =>
        query.from({ todo: todoCollection }).where(({ todo }) => eq(todo.id, id ?? ''))
    )
    const item = matches?.[0]

    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        if (item) {
            setName(item.name)
            setDescription(item.description ?? '')
        }
    }, [item])

    const save = useMutation({
        mutationFn: mutation(function* (input: { name: string; description: string }) {
            if (!item) return
            yield todoCollection.update(item.id, (draft) => {
                draft.name = input.name
                draft.description = input.description
            })
        }),
    })

    const toggle = useMutation({
        mutationFn: mutation(function* (completed: boolean) {
            if (!item) return
            yield todoCollection.update(item.id, (draft) => {
                draft.completed = completed
            })
        }),
    })

    if (!item) {
        return (
            <View className="p-6">
                <Text style={{ color: muted }}>Loading…</Text>
            </View>
        )
    }

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="p-6 gap-4">
                <Link href={orgHref('todo')}>
                    <Text style={{ color: muted, fontSize: 13 }}>{'< Back'}</Text>
                </Link>

                <View className="flex-row items-center gap-3">
                    <ThemedSwitch value={item.completed} onValueChange={(value) => toggle.mutate(value)} />
                    <Text style={{ color: muted, fontSize: 13 }}>{item.completed ? 'Completed' : 'Open'}</Text>
                </View>

                <View className="gap-1">
                    <Text style={{ color: muted, fontSize: 12 }}>Title</Text>
                    <PlainInput
                        value={name}
                        onChangeText={setName}
                        style={{
                            color: fg,
                            borderWidth: 1,
                            borderColor: border,
                            borderRadius: 6,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            fontSize: 16,
                        }}
                    />
                </View>

                <View className="gap-1">
                    <Text style={{ color: muted, fontSize: 12 }}>Description</Text>
                    <PlainInput
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={5}
                        style={{
                            color: fg,
                            borderWidth: 1,
                            borderColor: border,
                            borderRadius: 6,
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            minHeight: 100,
                            textAlignVertical: 'top',
                        }}
                    />
                </View>

                <View className="flex-row gap-2">
                    <Pressable
                        onPress={() => save.mutate({ name, description })}
                        className="px-4 py-2 rounded-md bg-primary"
                    >
                        <Text style={{ color: fg, fontWeight: '600' }}>Save</Text>
                    </Pressable>
                </View>

                <Text style={{ color: muted, fontSize: 12 }}>
                    Editing the description will mark this todo as not completed (server-side rule).
                </Text>
            </View>
        </ScrollView>
    )
}
