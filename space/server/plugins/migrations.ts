import { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { join } from 'pathe'

export default defineNitroPlugin(async () => {
  if (process.dev) {
    const config = useRuntimeConfig().db

    try {
      migrate(useDB() as BetterSQLite3Database, { migrationsFolder: config.migrations })
    } catch (err) {
      console.log('Cannot migrate database', err)
      // @ts-ignore
    }
  }
})