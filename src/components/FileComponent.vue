<script lang="ts" setup>
import { ref } from 'vue';
import type { MovimentacaoType } from '@/types/MovimentacaoType';
import { postarArquivo } from '@/services/api';

const file = ref<File | null>(null);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const fileAdded = ref(false);


const linesProcessed = ref(0);

const tamBloco = 1024 * 1024 * 10;
const tamLote = 1000;
const delay = 3000;


const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files) {
    file.value = target.files[0];
    successMessage.value = null;
    errorMessage.value = null;
    fileAdded.value = true;
    linesProcessed.value = 0;
  }
};


const uploadFile = async () => {
  if (!file.value) {
    errorMessage.value = "Por favor, selecione um arquivo.";
    return;
  }

  try {
    successMessage.value = null;
    errorMessage.value = null;

    await processarEmBlocos(file.value);
    successMessage.value = "Arquivo enviado com sucesso!";
  } catch (error) {
    errorMessage.value = "Erro ao processar ou enviar o arquivo.";
    console.error("uploadFile: Erro:", error);
  }
};

const processarEmBlocos = async (file: File) => {
  const reader = new FileReader();
  let offset = 0;

  const lerProximoBloco = () => {
    const slice = file.slice(offset, offset + tamBloco);
    reader.readAsText(slice);
  };

  reader.onload = async (e: ProgressEvent<FileReader>) => {
    if (e.target?.result) {
      const conteudoBloco = e.target.result as string;
      const movimentacoes = processarBloco(conteudoBloco);

      if (movimentacoes.length > 0) {
        await sendInBatches(movimentacoes, tamLote);
      }

      offset += tamBloco;
      if (offset < file.size) {
        lerProximoBloco();
      }
    }
  };
  lerProximoBloco();
};

const processarBloco = (conteudoBloco: string): MovimentacaoType[] => {
  const lines = conteudoBloco.split('\n');
  const movimentacoes: MovimentacaoType[] = [];

  let currentCoop: string | null = null;
  let currentAgencia: string | null = null;
  let pendingMovimentacao: MovimentacaoType | null = null;

  lines.forEach((line) => {
    linesProcessed.value++;
    line = line.trim();

    const coopAgenciaRegex = /^(\d{4})\/(\d{2})(?:\s+(.+))?$/;
    const matchCoopAgencia = line.match(coopAgenciaRegex);

    if (matchCoopAgencia) {
      currentCoop = matchCoopAgencia[1];
      currentAgencia = matchCoopAgencia[2];

      if (matchCoopAgencia[3]) {
        line = matchCoopAgencia[3];
      } else {
        return;
      }
    }

    const dateRegex = /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/;
    if (dateRegex.test(line)) {
      if (pendingMovimentacao) {
        pendingMovimentacao.dataHora = formatDate(line);
        movimentacoes.push(pendingMovimentacao);
        console.log("Bloco Processado: ", pendingMovimentacao);
        pendingMovimentacao = null;
      }
    } else {
      const movimentacaoRegex = /^(\d{5}-\d)\s+([A-Za-z\s]+)\s+([A-Za-z0-9]*)\s+([A-Za-z0-9]+)\s+([A-Za-z\s]+)\s+((?:\d{1,3}(?:\.\d{3})*(?:,\d{2}))?)\s+((?:\d{1,3}(?:\.\d{3})*(?:,\d{2}))?)\s+(\d{2})$/;
      const match = line.match(movimentacaoRegex);

      if (match) {
        let debito = 0;
        let credito = 0;

        debito = match[6]?.trim() ? parseFloat(match[6].replace(/\./g, '').replace(',', '.')) : 0;
        credito = match[7]?.trim() ? parseFloat(match[7].replace(/\./g, '').replace(',', '.')) : 0;

        let nome = match[2]?.trim();
        let documento = match[3]?.trim() || "";
        let codigo = match[4]?.trim();
        let descricao = match[5]?.trim();

        if (match[3]?.trim().length === 3) {
          documento = ' - ';
          codigo = match[3];
          descricao = match[4] + ' ' + match[5];
        }

        if (match[2].trim().length > 16) {
          nome = match[2].trim().slice(0, 16).trim();
          documento = match[2].trim().slice(17).trim();
        }

        pendingMovimentacao = {
          dataHora: "",
          agencia: currentAgencia || '00',
          coop: currentCoop || '0000',
          conta: match[1],
          nome: nome,
          documento,
          codigo,
          descricao,
          debito: debito > 0 ? debito : 0,
          credito: credito > 0 ? credito : 0,
          descricaoFinal: match[8],
        };
      }
    }
  });

  return movimentacoes;
};

const formatDate = (input: string): string => {
  const [date, time] = input.split(' ');
  const [day, month, year] = date.split('/');
  return `${year}/${month}/${day} ${time}:00`;
};

const sendInBatches = async (data: any[], batchSize: number) => {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);

    let attempt = 0;
    let success = false;
    while (!success && attempt < 5) {
      try {
        const response = await postarArquivo(batch);

        console.log(`Enviando lote ${i / batchSize + 1}`, response.data);
        success = true;
      } catch (error: any) {
        if (error.response?.status === 429) {
          console.error(`Requisições demais, aguardando ${delay / 1000} segundos antes de tentar novamente.`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error(`sendInBatches: Erro ao enviar o lote ${i / batchSize + 1}:`, error.message);
        }
      }

      attempt++;
    }
  }
};
</script>

<template>
  <div class="d-flex justify-center align-center flex-column">
    <h2 class="mb-15 text-green">Adicionar Arquivo:</h2>

    <form @submit.prevent="uploadFile" class="d-flex justify-center flex-column">
      <div class="file-upload-area">
        <input
          class="input-file"
          type="file"
          @change="handleFileChange"
        />

        <div v-if="fileAdded" class="file-added-message">
          Arquivo adicionado!
        </div>
      </div>
      <p class="linhas-processadas" v-if="linesProcessed > 0">Linhas processadas: {{ linesProcessed }}</p>
      <v-btn class="mt-5" type="submit">Upload</v-btn>
    </form>

    <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
    <p v-if="successMessage" style="color: green;">{{ successMessage }}</p>
  </div>
</template>



<style scoped>

.file-upload-area {
  position: relative;
  width: 600px;
  height: 200px;
  border: 3px dashed rgb(0, 184, 0);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.input-file {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-upload-area:hover {
  background-color: rgba(0, 184, 0, 0.1);
}

.input-file:focus {
  outline: none;
}

.file-added-message {
  position: absolute;
  font-size: 18px;
  color: green;
  font-weight: bold;
}

.linhas-processadas{
  font-size: 0.8rem;
}

@media (max-width: 650px){
    .file, .file-upload-area {
      width: 300px !important;
    }
  }

</style>


