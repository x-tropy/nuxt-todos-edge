import type { H3Event } from 'h3'
import { withQuery } from 'ufo'
import { defu } from 'defu'

export interface LoginGitHubConfig {
  clientId: string
  clientSecret: string
  scope?: string[]
  emailRequired?: boolean
}

export async function loginWithGitHub(event: H3Event, config?: LoginGitHubConfig) {
  // @ts-ignore
  config = defu(config, useRuntimeConfig(event).oauth.github)
  const { code } = getQuery(event)

  if (!config.clientId || !config.clientSecret) {
    console.error('GitHub OAuth error: missing NUXT_OAUTH_GITHUB_CLIENT_ID or NUXT_OAUTH_GITHUB_CLIENT_SECRET env variables.')
  }

  if (!code) {
    config.scope = config.scope || []
    if (config.emailRequired && !config.scope.includes('user:email')) {
      config.scope.push('user:email')
    }
    // Redirect to GitHub Oauth page
    const redirectUrl = getRequestURL(event).href
    return sendRedirect(
      event,
      withQuery('https://github.com/login/oauth/authorize', {
        client_id: config.clientId,
        redirect_uri: redirectUrl,
        scope: config.scope.join('%20')
      })
    )
  }
  
  const response: any = await $fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      body: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code
      }
    }
  )
  if (response.error) {
    throw new Error(`GitHub login failed: ${response.error || 'Unknown error'}`)
  }
  
  const ghUser: any = await $fetch('https://api.github.com/user', {
    headers: {
      'User-Agent': `Github-OAuth-${config.clientId}`,
      Authorization: `token ${response.access_token}`
    }
  })

  // if no public email, check the private ones
  if (!ghUser.email && config.emailRequired) {
    const emails: any[] = await $fetch('https://api.github.com/user/emails', {
      headers: {
        'User-Agent': `Github-OAuth-${config.clientId}`,
        Authorization: `token ${response.access_token}`
      }
    })
    const primaryEmail = emails.find((email: any) => email.primary)
    // Still no email
    if (!primaryEmail) {
      throw new Error('GitHub login failed: no user email found')
    }
    ghUser.email = primaryEmail.email
  }

  return ghUser
}