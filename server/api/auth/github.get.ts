export default eventHandler(async (event) => {
  // @ts-ignore
  const config = useRuntimeConfig(event)

  try {
    const ghUser = await loginWithGitHub(event, {
      clientId: config.github.clientId,
      clientSecret: config.github.clientSecret,
    })

    if (!ghUser) {
      // User redirected
      return
    }

    await setUserSession(event, {
      user: ghUser,
      createdAt: new Date()
    })
  } catch(e) {
    return sendRedirect(event, '/')
  }

  return sendRedirect(event, '/')
})
