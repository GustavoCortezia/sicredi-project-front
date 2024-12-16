<script setup lang="ts">
import router from '@/router';

  function goToInformations() {
    router.push('/informations')
  }

  function goToHome() {
    router.push('/')
  }
</script>


<template>
  <v-app-bar class="nav-bar d-flex justify-center" :elevation="5" rounded>
    <v-app-bar-title><img class="nav-img mt-11" width="130px" src="../assets/sicredi-825x293.png" alt=""></v-app-bar-title>
    <v-btn @click="goToHome" icon="mdi-file-document-outline"></v-btn>
    <v-btn @click="goToInformations" icon="mdi-information"></v-btn>
    <v-btn icon="mdi-account"></v-btn>
  </v-app-bar>
</template>

<style scoped>
  ::v-deep(.v-toolbar__content) {
    height: 90px !important;
  }
  .nav-img{
    margin: 2%;

  }
</style>
