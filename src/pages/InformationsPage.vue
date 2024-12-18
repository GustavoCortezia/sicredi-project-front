<script setup lang="ts">
import { getInfos } from '@/services/api';
import type { CreditosDebitosHora, DataMovimentacao, MovimentacoesCoopAgencia } from '@/types/InfosTypes';

onMounted( async () => {
  spinner.value = true;
 await handleGetInfos();
  spinner.value = false;
})

const spinner = ref<boolean>(false)
const agencia = ref<string>('');
const coop = ref<string>('');
const horario = ref<string>('-');
const procurado = ref<boolean>(false);
const horaProcurada = ref<boolean>(false);

const maiorData = ref<DataMovimentacao>();
const maiorSoma = ref<DataMovimentacao>();
const menorData = ref<DataMovimentacao>();
const menorSoma = ref<DataMovimentacao>();
const semanaRX1PX1 = ref<DataMovimentacao>();
const valorMovimentado = ref<MovimentacoesCoopAgencia[]>();
const valorSelecionado = ref<MovimentacoesCoopAgencia>();
const MovimentacoesHora = ref<CreditosDebitosHora[]>()
const HoraSelecionada = ref<CreditosDebitosHora>();


async function handleGetInfos() {
  const response = await getInfos();
  console.log(response.data);

  maiorData.value = response.data.metricas.maior_data_movimentacao;
  maiorSoma.value = response.data.metricas.maior_soma_movimentacao;
  menorData.value = response.data.metricas.menor_data_movimentacao;
  menorSoma.value = response.data.metricas.menor_soma_movimentacao;
  semanaRX1PX1.value = response.data.metricas.movimentacoes_dia_semana_RX1_PX1;
  valorMovimentado.value = response.data.metricas.movimentacoes_por_coop_agencia;
  MovimentacoesHora.value = response.data.metricas.creditos_debitos_por_hora;
}

async function handlegetValue() {
  procurado.value = true
  if (valorMovimentado.value) {
    valorMovimentado.value.forEach(valor => {
      if(valor.coop == coop.value && valor.agencia == agencia.value){
        valorSelecionado.value = valor;
        procurado.value = false

      }
    });
  }
}

async function handleGetHour() {
  horaProcurada.value = true
  if (MovimentacoesHora.value) {
    MovimentacoesHora.value.forEach(movimentacao => {
      if(movimentacao.hora == horario.value.split(':')[0]){
        HoraSelecionada.value = movimentacao;
        horaProcurada.value = false;

      }
    });
  }
}

</script>

<template>
<div  v-if="spinner"  class="spinner-div">
  <v-progress-circular class="spinner" indeterminate color="green" :size="60" :width="10"  aria-label="Loading"/>
</div>




  <NavComponent />
  <div class="infos-div d-flex align-center flex-column">
      <h2 class="d-flex justify-center mb-15 text-green">Sumarizações e Métricas</h2>

      <div class="infos-topic-div">
        <h4 class="info-topic pa-5 mb-3 rounded-xl">Data com a maior movimentação: <span class="mr-5">{{ maiorData?.data }}</span> Total: <span>{{ maiorData?.total }}</span>  </h4>
        <h4 class="info-topic pa-5 mb-3 rounded-xl">Data com a menor movimentação: <span class="mr-5">{{ menorData?.data }}</span>   Total: <span>{{ menorData?.total }}</span> </h4>
        <h4 class="info-topic pa-5 mb-3 rounded-xl">Data com a maior soma de movimentações: <span class="mr-5">{{ maiorSoma?.data }}</span>   Total: <span>R${{ maiorSoma?.total }}</span> </h4>
        <h4 class="info-topic pa-5 mb-3 rounded-xl">Data com a menor soma de movimentações: <span class="mr-5">{{ menorSoma?.data }}</span>  Total: <span>R${{ menorSoma?.total }}</span>  </h4>
        <h4 class="info-topic pa-5 mb-3 rounded-xl">Dia da semana com mais movimentações RX1 e PX1: <span class="mr-5">{{ semanaRX1PX1?.data }}</span>  Total: <span>{{ semanaRX1PX1?.total }}</span>  </h4>
      </div>



      <h3 class="subtitulo my-6 text-green">Verificar quantidade e valor movimentado por coop/agência</h3>

      <div class="div-inputs d-flex ">
        <v-text-field
              v-model="agencia"
              width="50px"
              :counter="2"
              label="Agência"
              class="text-field mx-3"
            ></v-text-field>

            <v-text-field
              width="50px"
              v-model="coop"
              :counter="4"
              label="Cooperativa"
              class="text-field mx-3"
            ></v-text-field>


            <v-btn class="procurar-btn mx-3" @click="handlegetValue">Procurar</v-btn>
      </div>


        <h4 v-if="procurado" > Coop/Agência não encontrado(s)</h4>
      <div v-if="valorSelecionado" class="d-flex justify-center" >
        <h4 class="mx-5">Quantidade de movimentações: <span> {{ valorSelecionado?.total }}</span></h4>
        <h4 class="mx-5">Valor total movimentado: <span>R${{ valorSelecionado?.total_valor }}</span> </h4>
      </div>


      <h3 class="subtitulo my-6 text-green">Verificar total de créditos e débitos por hora</h3>

      <div class="div-inputs d-flex ">
      <v-combobox
      class="text-field"
        v-model="horario"
        label="Horário"
        width="50px"
        :items="[
          '0:00 - 1:00', '1:00 - 2:00', '2:00 - 3:00', '3:00 - 4:00', '4:00 - 5:00',
          '5:00 - 6:00', '6:00 - 7:00', '7:00 - 8:00', '8:00 - 9:00', '9:00 - 10:00',
          '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00',
          '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00',
          '20:00 - 21:00', '21:00 - 22:00', '22:00 - 23:00', '23:00 - 24:00'
        ]"
      ></v-combobox>

      <v-btn class="procurar-btn mx-3" @click="handleGetHour">Procurar</v-btn>

      </div>

      <h4 v-if="horaProcurada" > Coop/Agência não encontrado(s)</h4>
      <div v-if="HoraSelecionada" class="d-flex justify-center" >
        <h4 class="mx-5">Horário: <span> {{ HoraSelecionada?.hora }}</span></h4>
        <h4 class="mx-5">Créditos: <span>R${{ HoraSelecionada?.total_credito }}</span> </h4>
        <h4 class="mx-5">Débitos: <span>R${{ HoraSelecionada?.total_debito }}</span> </h4>
      </div>

    </div>

    <v-footer class="bg-green d-flex justify-center flex-column" height="100px">
     <p>Desenvolvido por Gustavo Blume Cortezia</p>
     <p>12/2024</p>
  </v-footer>

</template>

<style scoped>

  .procurar-btn{
    height: 55px !important;
  }

  .div-inputs{
    width: 500px;
    justify-content: space-around !important;
  }

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
    padding-top: 100px;
    padding-bottom: 100px;
    background-color: #f4f7fa;
    height: 100%;
  }


.spinner-div{
  position: fixed;
  width: 100vw;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(8px);
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 99;
}



  @media (max-width: 650px){
    .infos-div{
      width: 100% !important;
    }
    .btn-text{
      word-wrap: break-word;
      overflow-wrap: break-word;
      white-space: normal;
    }
    .div-inputs{
      width: 100% !important;
      align-items: center;
      justify-content: center !important;
      flex-direction: column;
    }
    .text-field{
      width: 50% !important;
    }
    .subtitulo{
      font-size: 1rem;
    }

    .infos-topic-div{
      width: 90%;
  }

  }
</style>
