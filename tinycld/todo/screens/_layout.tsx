import { Stack } from 'expo-router'
// FIXTURE: intentional build-time failure for the rollback/fail integration test
// (tag v0.0.1-pre-buggy-fe). This relative import resolves to no file on disk, so
// Metro's static resolver throws during `expo export --platform web` in the
// install pipeline — BEFORE the DB backup / symlink swap. The install therefore
// aborts at the expo-export step (status 'failed'), the current build is left
// untouched, and no restart/rollback occurs. (A runtime `throw` would NOT fail the
// build — only a module-resolution error caught by the bundler does.)
import './__intentional_build_failure_fixture__'

export default function TodoLayout() {
    return <Stack screenOptions={{ headerShown: false }} />
}
