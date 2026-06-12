/// <reference path="../pb_data/types.d.ts" />

// FIXTURE: an intentionally-failing UP migration for the rollback integration
// test (tag v0.0.1-pre-buggy-migration).
//
// This file is NOT in the installed _migrations history, so the package installer
// classifies it as a PENDING (UP) migration and does NOT run it during the
// rebuild's migration-sync; it is deferred to the freshly-built binary, which
// applies it on its post-swap `serve` boot (apis/serve.go RunAllMigrations, fatal
// on error, BEFORE the HTTP listener binds). When it throws there, the new binary
// fails to start, /api/health never answers, the entrypoint health probe fails,
// and the install is rolled back to the previous healthy build.
//
// IMPORTANT — must NOT fail at build time. The build pipeline's `pnpm install`
// postinstall regenerates the PB schema types via the `export-types` binary
// (scripts/export-types.ts), which ALSO runs every migration UP, but against a
// throwaway tmp pb_data created with mkdtemp(os.tmpdir() + 'tinycld-export-types-').
// If this migration threw unconditionally it would kill export-types and the
// install would fail at BUILD time (status 'failed', pre-activation) — never
// reaching the rollback path the test exercises. So the UP throws ONLY when it is
// running against a REAL deployment data dir (i.e. NOT the export-types tmp dir).
// app.dataDir() is the discriminator: export-types passes
// `--dir <tmp>/.../tinycld-export-types-XXXX/pb_data`; the real server runs from
// the deployment's pb_data (e.g. /workspace/pb_data). Matching the tmp marker
// lets the build's schema regen succeed while the real serve boot fails.
//
// The timestamp (1800000002) sorts AFTER create_todo (…000) and create_tags
// (…001) so it is always the last pending migration. The down closure is a no-op
// so nothing chokes if this build is ever stepped down.

migrate(
    app => {
        const dir = String(app.dataDir() || '')
        // export-types runs against a tmp pb_data named 'tinycld-export-types-*'.
        // Succeed (no-op) there so the build's schema regen passes; throw on the
        // real serve boot so the new binary crashes → rollback.
        if (dir.indexOf('tinycld-export-types') !== -1) {
            return
        }
        throw new Error(
            'todo fixture: intentional UP migration failure (v0.0.1-pre-buggy-migration)'
        )
    },
    _app => {
        // no-op down
    }
)
