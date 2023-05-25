import { defineNuxtModule, logger, useNitro } from 'nuxt/kit'
import { defu } from 'defu'
import { join, relative } from 'pathe'
import { sha256 } from 'ohash'
import { writeFile } from 'node:fs/promises'
import { existsSync, mkdirSync } from 'node:fs'
import { watch } from 'chokidar'
import { debounce } from 'perfect-debounce'
import { execa } from 'execa'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'

export default defineNuxtModule({
  meta: {
    name: 'nuxt-space',
  },
  async setup(_options, nuxt) {
    const rootDir = nuxt.options.rootDir
    const runtimeConfig = nuxt.options.runtimeConfig
    // Db settings
    runtimeConfig.db = defu(runtimeConfig.db, {
      dir: join(rootDir, 'server', 'db'),
      name: 'db.sqlite'
    })

    // Session settings
    runtimeConfig.session = defu(runtimeConfig.session, {
      name: 'nuxt-space-session',
      password: ''
    })
    if (nuxt.options.dev && !process.env.NUXT_SESSION_PASSWORD) {
      const randomPassword = sha256(`${Date.now()}${Math.random()}`).slice(0, 32)
      logger.warn(`No session password set, using a random password.\nPlease set NUXT_SESSION_PASSWORD in your .env file with at least 32 chars.\nNUXT_SESSION_PASSWORD=${randomPassword}`)
      runtimeConfig.session.password = randomPassword
    }

    // OAuth settings
    runtimeConfig.oauth = defu(runtimeConfig.oauth, {})
    // GitHub Oauth
    runtimeConfig.oauth.github = defu(runtimeConfig.oauth.github, {
      clientId: '',
      clientSecret: '',
      authorizationURL: 'https://github.com/login/oauth/authorize',
      tokenURL: 'https://github.com/login/oauth/access_token'
    })
    
    // Drizzle Files
    if (nuxt.options.dev) {
      const drizzleConfig = {
        out: relative(rootDir, join(runtimeConfig.db.dir, 'migrations')),
        schema: relative(rootDir, join(runtimeConfig.db.dir, 'tables.ts')),
        breakpoints: true
      }
      // Create drizzle.config.json
      const drizzleConfigPath = join(rootDir, 'drizzle.config.json')
      await writeFile(drizzleConfigPath, JSON.stringify(drizzleConfig, null, 2), 'utf8')
      // Create tables.ts if it doesn't exist
      const tablesPath = join(runtimeConfig.db.dir, 'tables.ts')
      if (!existsSync(tablesPath)) {
        mkdirSync(runtimeConfig.db.dir, { recursive: true })
        await writeFile(tablesPath, 'import { sqliteTable, text, integer } from \'drizzle-orm/sqlite-core\'\n', 'utf8')
      }

      watch(tablesPath).on('change', debounce(async () => {
        logger.info('`'+relative(rootDir, tablesPath) + '` changed, running `npx drizzle-kit generate:sqlite`')
        await execa('npx', ['drizzle-kit', 'generate:sqlite'], { cwd: rootDir })
        logger.info('Restarting server to migrate database')
        await nuxt.hooks.callHook('restart')
      }))
    }
    // logger.info('Make sure to run `npx drizzle-kit generate:sqlite` to generate the database schema and migrations when changing `server/db/tables.ts`')
    logger.success('Nuxt Space module ready')
    await execa('npx', ['drizzle-kit', 'generate:sqlite'], { cwd: rootDir })
  }
})