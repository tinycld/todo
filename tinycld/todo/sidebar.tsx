import { eq } from '@tanstack/db'
import { useStore } from '@tinycld/core/lib/pocketbase'
import { useThemeColor } from '@tinycld/core/lib/use-app-theme'
import { useOrgLiveQuery } from '@tinycld/core/lib/use-org-live-query'
import { Text, View } from 'react-native'
import type { TodoItem } from './types'

// Sidebar for the Todo package. Rendered in the workspace drawer when a user
// is on any /todo/... route. Shows a live count of remaining and
// completed items for the current org.
export default function TodoSidebar() {
    const fg = useThemeColor('foreground')
    const muted = useThemeColor('muted-foreground')

    const [todoItems] = useStore('todo_items')
    const { data } = useOrgLiveQuery((query, { userId }) =>
        query
            .from({ todo_items: todoItems })
            .where(({ todo_items }) => eq(todo_items.owner, userId))
    )

    const items = (data ?? []) as TodoItem[]
    const remaining = items.filter(item => !item.completed).length
    const completed = items.length - remaining

    return (
        <View className="p-3 gap-2">
            <Text style={{ color: fg, fontSize: 14, fontWeight: '600' }}>Todo</Text>
            <Text style={{ color: muted, fontSize: 12 }}>{remaining} remaining</Text>
            <Text style={{ color: muted, fontSize: 12 }}>{completed} completed</Text>
        </View>
    )
}
