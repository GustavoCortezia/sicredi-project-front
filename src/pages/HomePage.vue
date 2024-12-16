<script setup lang="ts">
import FileComponent from '@/components/FileComponent.vue';
import router from '@/router';

function linkMetricas() {
  router.push('/informations')
}
</script>

<template>
  <NavComponent />

  <div class="div-file d-flex justify-center align-center flex-column">
    <FileComponent class="file mb-10"/>
    <v-btn @click="linkMetricas" class="btn-metricas bg-green d-flex">Ver sumarizações e métricas das movimentações</v-btn>
  </div>

</template>

<style scoped>
  .btn-metricas:hover{
    background-color: white !important;
    color: rgb(0, 184, 0) !important;
    border: 2px solid rgb(0, 184, 0);
  }

  .div-file{
    height: 100%;
  }



</style>
