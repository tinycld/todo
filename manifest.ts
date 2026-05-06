const manifest = {
    name: 'Todo',
    slug: 'todo',
    version: '0.1.0',
    description: 'Simple TODO app for testing tinycld',
    routes: { directory: 'screens' },
    nav: {
        label: 'Todo',
        icon: 'box',
        order: 20,
        shortcut: '',
    },
    sidebar: { component: 'sidebar' },
    provider: { component: 'provider' },
    migrations: { directory: 'pb-migrations' },
    collections: { register: 'collections', types: 'types' },
    seed: { script: 'seed' },
    server: { package: 'server', module: 'tinycld.org/packages/todo' },
}

export default manifest
