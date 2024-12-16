<script setup lang="ts"></script>

<template>
  <NavComponent />
  <div class="infos-div d-flex justify-center align-center flex-column">
      <h3 class="d-flex justify-center mb-15">Informações</h3>

      <div>
        <h5>Data com a maior movimentação: </h5>
        <h5>Data com a menor movimentação: </h5>
        <h5>Maior soma de movimentações: </h5>
        <h5>Menor soma de movimentações: </h5>
      </div>
    </div>
</template>

<style scoped>
  .infos-div{
    height: 100%;
  }
</style>
