<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
      <LoginModal />
    </NuxtLayout>
  </div>
</template>

<script setup>
  const user = useCurrentUser()
  const router = useRouter()

  watch(user, (currentUser, prevUser)=> {
    window.location.reload()
    return router.replace('/')
  })
</script>