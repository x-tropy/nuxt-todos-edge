export default eventHandler(async (event) => {
  try {
    const ghUser = await loginWithGitHub(event)

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
