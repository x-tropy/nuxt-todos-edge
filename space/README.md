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

## Database Helpers (SQLite)

```ts
// Returns a Drizzle instance
const db = useDb()

// All tables defined in `~/server/db/tables.ts`
tables.*
```

### Example

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


### OAuth Helpers

Login with GitHub, it will automatically redirect to GitHub OAuth page and then redirect back to the same route with the `code` query parameter.

```ts
// Login with GitHub OAuth
const ghUser = await loginWithGitHub(event, {
  clientId: string,
  clientSecret: string,
  scope?: string[]
  emailRequired?: boolean
})
```

Example: `~/server/api/auth/github.get.ts`

```ts
export default eventHandler(async (event) => {
  try {
    const ghUser = await loginWithGitHub(event, {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    })
    if (!ghUser) {
      // User redirected
      return
    }

    await setUserSession(event, {
      user: ghUser,
      loggedInAt: new Date()
    })
  } catch (e) {
    return sendRedirect(event, '/login')
  }

  return sendRedirect(event, '/')
})
```
