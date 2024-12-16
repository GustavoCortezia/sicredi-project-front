<script setup lang="ts">
import { getInfos } from '@/services/api';
import type { DataMovimentacao } from '@/types/InfosTypes';

onMounted( () => {
  handleGetInfos();
})

const maiorData = ref<DataMovimentacao>();
const maiorSoma = ref<DataMovimentacao>();
const menorData = ref<DataMovimentacao>();
const menorSoma = ref<DataMovimentacao>();
const semanaRX1PX1 = ref<DataMovimentacao>();

async function handleGetInfos() {
  const response = await getInfos();
  console.log(response.data);

  maiorData.value = response.data.maior_data_movimentacao;
  maiorSoma.value = response.data.maior_soma_movimentacao;
  menorData.value = response.data.menor_data_movimentacao;
  menorSoma.value = response.data.menor_soma_movimentacao;
  semanaRX1PX1.value = response.data.movimentacoes_dia_semana_RX1_PX1;

}

</script>

<template>
  <NavComponent />
  <div class="infos-div d-flex justify-center align-center flex-column">
      <h2 class="d-flex justify-center mb-15">Sumarizações e Métricas</h2>

      <div>
        <h4 class="info-topic pa-5 mb-3 rounded-xl">Data com a maior movimentação: <span class="mr-5">{{ maiorData?.data }}</span> Total: <span>{{ maiorData?.total }}</span>  </h4>
        <h4 class="info-topic pa-5 mb-3 rounded-xl">Data com a menor movimentação: <span class="mr-5">{{ menorData?.data }}</span>   Total: <span>{{ menorData?.total }}</span> </h4>
        <h4 class="info-topic pa-5 mb-3 rounded-xl">Maior soma de movimentações: <span class="mr-5">{{ maiorSoma?.data }}</span>   Total: <span>{{ maiorSoma?.total }}</span> </h4>
        <h4 class="info-topic pa-5 mb-3 rounded-xl">Menor soma de movimentações: <span class="mr-5">{{ menorSoma?.data }}</span>  Total: <span>{{ menorSoma?.total }}</span>  </h4>
        <h4 class="info-topic pa-5 mb-3 rounded-xl">Dia da semana com mais movimentações RX1 e PX1: <span class="mr-5">{{ semanaRX1PX1?.data }}</span>  Total: <span>{{ semanaRX1PX1?.total }}</span>  </h4>
      </div>
    </div>
</template>

<style scoped>
  span {
    color: rgb(0, 184, 0);
  }

  .info-topic{
    background-color: #ffffff;
    transition: transform 0.4s !important;
  }

  .info-topic:hover{
    transform: scale(1.03);
  }

  .infos-div{
    background-color: #f4f7fa;
    height: 100%;
  }
</style>
