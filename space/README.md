# Nuxt Space

Enter to the galaxy of fullstack apps running on the edge.

## Features

- Session management with secured & sealed cookie sessions
- Helpers for OAuth support (GitHub, more soon)
- Create and query typed collections

Nuxt Space leverages SQLite in development and uses [D1](https://developers.cloudflare.com/d1/) or [Turso](https://turso.tech) in production.

## Setup

You need to add a `NUXT_SESSION_PASSWORD` env variable with at least 32 characters in the `.env`.

```bash
# .env
NUXT_SESSION_PASSWORD=password-with-at-least-32-characters
```

Add `runtimeConfig.dbDir` to your `nuxt.config.ts`.

## Vue Composables

Space automatically add some plugins to fetch the current user session to let you access it from your Vue components.

### User Session

```vue
<script setup>
const { loggedIn, user, session, clear } = useUserSession()
</script>

<template>
  <div v-if="loggedIn">
    <h1>Welcome {{ user.login }}!</h1>
    <p>Logged in since {{ session.loggedInAt }}</p>
    <button @click="clear">Logout</button>
  </div>
  <div v-else>
    <h1>Not logged in</h1>
    <a href="/api/auth/github">Login with GitHub</a>
  </div>
</template>
```

## Server Utils

### Session Management

```ts
// Set a user session
await setUserSession(event, {
  user: {
    // ... user data
  },
  // Any extra fields
})

// Get the current user session
const session = await getUserSession(event)

// Clear the current user session
await clearUserSession(event)

// Require a user session (send back 401 if no user in session)
await requireUserSession(event)
```

### Database Helpers (SQLite)

```ts
// Returns a Drizzle instance
const db = useDb()

// All tables defined in `~/server/db/tables.ts`
tables.*
```

#### Example

Table definition in `~/server/db/tables.ts`

```ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull(), // GitHub Id
  title: text('title').notNull(),
  completed: integer('completed').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

API route to list all todos for the current user in `~/server/api/todos.get.ts`

```ts
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await requireUserSession(event)

  // List todos for the current user
  return await useDb()
    .select()
    .from(tables.todos)
    .where(eq(tables.todos.userId, session.user.id))
    .all()
})
```


### OAuth Event Handlers

### GitHub

The `githubOAuthEventHandler({ onSuccess, config?, onError? })` will return an event handler that automatically redirects to GitHub OAuth page and then call `onSuccess` or `onError` depending on the result.

Example: `~/server/api/auth/github.get.ts`

```ts
export default gitHubOAuthEventHandler({
  async onSuccess(event, { user, accessToken }) {
    await setUserSession(event, { user })
    return sendRedirect(event, '/')
  },
  // Optional, will return a json error and status code by default
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
```

### Event Handlers Helpers

Coming soon.

```ts
export default spaceEventHandler({
  // require session
  session: true,
  // validation
  validate: {
    body: {
      title: z.string(),
      completed: z.boolean().optional().default(false),
    },
  },
  handler (event) {
    // event.context.session
    // event.context.body is parsed and validation
  }
})