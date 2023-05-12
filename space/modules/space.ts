import { defineNuxtModule, logger } from 'nuxt/kit'
import { defu } from 'defu'
import { join } from 'pathe'
import { sha256 } from 'ohash'

export default defineNuxtModule({
  meta: {
    name: 'nuxt-space',
  },
  setup(_options, nuxt) {
    const runtimeConfig = nuxt.options.runtimeConfig
    // Db settings
    runtimeConfig.db = defu(runtimeConfig.db, {
      dir: join(nuxt.options.rootDir, 'server', 'db'),
      name: 'db.sqlite'
    })
    // Session settings
    runtimeConfig.session = defu(runtimeConfig.session, {
      name: 'nuxt-space-session',
      passsword: ''
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
    })
    logger.success('Nuxt Space module ready')
  }
})