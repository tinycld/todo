import { useThemeColor } from '@tinycld/core/lib/use-app-theme'
import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { useTagMutations, useTodoTags } from '../hooks/use-tag-mutations'

// Tag editor for a single todo: shows its current tags as removable chips and
// an input to add a new one. Typing arbitrary text and submitting runs
// find-or-create (see use-tag-mutations) — an existing tag with that name is
// reused, otherwise a new tag row is created, then linked to this todo.
export function TagEditor({ todoId }: { todoId: string }) {
    const fg = useThemeColor('foreground')
    const muted = useThemeColor('muted-foreground')
    const border = useThemeColor('border')
    const primary = useThemeColor('primary')

    const tags = useTodoTags(todoId)
    const { addTag, removeTag } = useTagMutations()
    const [draft, setDraft] = useState('')

    const submit = () => {
        const name = draft.trim()
        if (!name) return
        addTag.mutate({ todoId, name })
        setDraft('')
    }

    return (
        <View className="gap-2">
            <Text style={{ color: muted, fontSize: 12, fontWeight: '600' }}>TAGS</Text>

            {tags.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                    {tags.map(tag => (
                        <View
                            key={tag.todoTagId}
                            className="flex-row items-center gap-1"
                            style={{
                                borderWidth: 1,
                                borderColor: border,
                                borderRadius: 999,
                                paddingLeft: 10,
                                paddingRight: 6,
                                paddingVertical: 4,
                            }}
                        >
                            <Text style={{ color: fg, fontSize: 13 }}>{tag.name}</Text>
                            <Pressable
                                onPress={() => removeTag.mutate(tag.todoTagId)}
                                accessibilityRole="button"
                                accessibilityLabel={`Remove tag ${tag.name}`}
                                hitSlop={8}
                            >
                                <Text style={{ color: muted, fontSize: 15, lineHeight: 15 }}>
                                    ×
                                </Text>
                            </Pressable>
                        </View>
                    ))}
                </View>
            ) : null}

            <View className="flex-row items-center gap-2">
                <TextInput
                    value={draft}
                    onChangeText={setDraft}
                    onSubmitEditing={submit}
                    placeholder="Add a tag…"
                    placeholderTextColor={muted}
                    returnKeyType="done"
                    autoCapitalize="none"
                    style={{
                        flex: 1,
                        color: fg,
                        borderWidth: 1,
                        borderColor: border,
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 14,
                    }}
                />
                <Pressable
                    onPress={submit}
                    accessibilityRole="button"
                    accessibilityLabel="Add tag"
                    style={{
                        backgroundColor: primary,
                        borderRadius: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                    }}
                >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Tag</Text>
                </Pressable>
            </View>
        </View>
    )
}

// Read-only inline list of a todo's tags, for the index rows.
export function TagChips({ todoId }: { todoId: string }) {
    const muted = useThemeColor('muted-foreground')
    const border = useThemeColor('border')
    const tags = useTodoTags(todoId)

    if (tags.length === 0) return null

    return (
        <View className="flex-row flex-wrap gap-1">
            {tags.map(tag => (
                <View
                    key={tag.todoTagId}
                    style={{
                        borderWidth: 1,
                        borderColor: border,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                    }}
                >
                    <Text style={{ color: muted, fontSize: 11 }}>{tag.name}</Text>
                </View>
            ))}
        </View>
    )
}
