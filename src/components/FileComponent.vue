<script lang="ts" setup>
import { ref } from 'vue';
import axios from 'axios';
import type { MovimentacaoType } from '@/types/MovimentacaoType';

const file = ref<File | null>(null);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Tamanho do bloco e do lote
const CHUNK_SIZE = 1024 * 1024;
const BATCH_SIZE = 100;
const RETRY_DELAY = 3000;

// Função para capturar o arquivo selecionado
const handleFileChange = (event: Event) => {
  console.log("handleFileChange: Arquivo selecionado.");
  const target = event.target as HTMLInputElement;
  if (target.files) {
    file.value = target.files[0];
    console.log("handleFileChange: Nome do arquivo:", file.value.name);
    successMessage.value = null;
    errorMessage.value = null;
  }
};

// Função para enviar o arquivo ao back-end em blocos
const uploadFile = async () => {
  console.log("uploadFile: Iniciando upload.");
  if (!file.value) {
    errorMessage.value = "Por favor, selecione um arquivo.";
    console.log("uploadFile: Nenhum arquivo selecionado.");
    return;
  }

  try {
    successMessage.value = null;
    errorMessage.value = null;

    console.log("uploadFile: Processando arquivo em blocos.");
    await processFileInChunks(file.value);
    successMessage.value = "Arquivo enviado com sucesso!";
    console.log("uploadFile: Upload finalizado com sucesso.");
  } catch (error) {
    errorMessage.value = "Erro ao processar ou enviar o arquivo.";
    console.error("uploadFile: Erro:", error);
  }
};

// Função para processar o arquivo em blocos
const processFileInChunks = async (file: File) => {
  console.log("processFileInChunks: Iniciando processamento do arquivo:", file.name);
  const reader = new FileReader();
  let offset = 0;

  const readNextChunk = () => {
    console.log(`processFileInChunks: Lendo bloco. Offset: ${offset}, CHUNK_SIZE: ${CHUNK_SIZE}`);
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    reader.readAsText(slice);
  };

  reader.onload = async (e: ProgressEvent<FileReader>) => {
    console.log("processFileInChunks: Bloco carregado com sucesso.");
    if (e.target?.result) {
      const chunkContent = e.target.result as string;
      console.log("processFileInChunks: Conteúdo do bloco lido, tamanho:", chunkContent.length);
      const movimentacoes = parseChunk(chunkContent);

      console.log("processFileInChunks: Quantidade de movimentações processadas:", movimentacoes.length);
      if (movimentacoes.length > 0) {
        await sendInBatches(movimentacoes, BATCH_SIZE);
      }

      offset += CHUNK_SIZE;
      if (offset < file.size) {
        console.log("processFileInChunks: Lendo próximo bloco.");
        readNextChunk();
      } else {
        console.log("processFileInChunks: Todos os blocos processados.");
      }
    }
  };

  reader.onerror = () => {
    console.error("processFileInChunks: Erro ao ler o arquivo.");
    throw new Error("Erro ao ler o arquivo.");
  };

  readNextChunk();
};

// Função para processar o conteúdo de um bloco
const parseChunk = (chunkContent: string): MovimentacaoType[] => {
  console.log("parseChunk: Iniciando parsing do bloco.");
  const lines = chunkContent.split('\n');
  const movimentacoes: MovimentacaoType[] = [];

  let currentCoop: string | null = null;
  let currentAgencia: string | null = null;
  let pendingMovimentacao: MovimentacaoType | null = null;

  lines.forEach((line) => {
    line = line.trim();

    // Detecta e armazena Coop/Agência se estiverem presentes na linha
    const coopAgenciaRegex = /^(\d{4})\/(\d{2})/;
    const matchCoopAgencia = line.match(coopAgenciaRegex);
    if (matchCoopAgencia) {
      currentCoop = matchCoopAgencia[1];
      currentAgencia = matchCoopAgencia[2];
      console.log(`parseChunk: Coop/Agência atualizadas: Coop=${currentCoop}, Agência=${currentAgencia}`);
    }

    // Identifica linha de data (dd/mm/yyyy hh:mm)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}$/;
    if (dateRegex.test(line)) {
      if (pendingMovimentacao) {
        // Se há uma movimentação pendente, associa a data encontrada
        pendingMovimentacao.dataHora = formatDate(line);
        movimentacoes.push(pendingMovimentacao);
        console.log("parseChunk: Movimentação finalizada:", pendingMovimentacao);
        pendingMovimentacao = null;
      }
    } else {
      // Linha de movimentação
      const movimentacaoRegex = /^(\d{5}-\d)\s+([A-Za-z0-9\s\.]+)\s+([A-Za-z0-9]+)\s+(\d{3})\s+([A-Za-z\s]+)\s+((?:\d{1,3}(?:\.\d{3})*(?:,\d{2}))?)\s+((?:\d{1,3}(?:\.\d{3})*(?:,\d{2}))?)\s+(\d{2})$/;
      const match = line.match(movimentacaoRegex);

      if (match) {
        console.log("Movimentação extraída:", match);


        let debito = 0;
        let credito = 0;

        // Extrai débito e crédito da penúltima e última coluna, respectivamente
        debito = match[6]?.trim() ? parseFloat(match[6].replace(/\./g, '').replace(',', '.')) : 0;
        credito = match[7]?.trim() ? parseFloat(match[7].replace(/\./g, '').replace(',', '.')) : 0;


        pendingMovimentacao = {
          dataHora: "",
          agencia: currentAgencia || '00000',
          coop: currentCoop || '000',
          conta: match[1],
          nome: match[2].trim(),
          documento: match[3],
          codigo: match[4],
          descricao: match[5],
          debito: debito > 0 ? debito : 0,
          credito: credito > 0 ? credito : 0,
          descricaoFinal: match[8],
        };
      }
    }
  });

  console.log("parseChunk: Parsing concluído. Movimentações extraídas:", movimentacoes.length);
  return movimentacoes;
};

const formatDate = (input: string): string => {
  const [date, time] = input.split(' ');
  const [day, month, year] = date.split('/');
  return `${year}/${month}/${day} ${time}:00`;
};

// Função para enviar dados em lotes com controle de retries
const sendInBatches = async (data: any[], batchSize: number) => {
  console.log("sendInBatches: Enviando dados em lotes. Total de movimentações:", data.length);
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log(`sendInBatches: Enviando lote ${i / batchSize + 1}. Movimentações neste lote:`, batch.length);

    let attempt = 0;
    let success = false;
    while (!success && attempt < 5) {
      try {
        const response = await axios.post('http://localhost:8000/api/processar', { movimentacoes: batch }, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log(`sendInBatches: Lote ${i / batchSize + 1} enviado com sucesso:`, response.data);
        success = true;
      } catch (error:any) {
        if (error.response?.status === 429) {
          console.error(`sendInBatches: Erro 429 - Too Many Requests, aguardando ${RETRY_DELAY / 1000} segundos antes de tentar novamente.`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        } else {
          console.error(`sendInBatches: Erro ao enviar o lote ${i / batchSize + 1}:`, error);
          break;
        }
      }
    }
  }
};
</script>

<template>
  <div class="d-flex justify-center align-center flex-column">

    <h2 class="mb-15 text-green">Adicionar Arquivo:</h2>
      <!-- Área de upload -->

        <form @submit.prevent="uploadFile" class="d-flex justify-center flex-column">
          <div class="file-upload-area">
            <input
              class="input-file"
              type="file"
              @change="handleFileChange"
            />
          </div>
          <v-btn class="mt-5" type="submit">Upload</v-btn>
        </form>

        <p v-if="errorMessage" style="color: red;">{{ errorMessage }}</p>
        <p v-if="successMessage" style="color: green;">{{ successMessage }}</p>


  </div>
</template>



<style scoped>
/* Estilo da área de upload com bordas pontilhadas */
.file-upload-area {
  position: relative;
  width: 600px;
  height: 200px; /* Tamanho desejado para a área de upload */
  border: 3px dashed rgb(0, 184, 0); /* Borda pontilhada */
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Estilo para o input, removendo o texto e deixando a área de borda visível */
.input-file {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0; /* Tornando o texto invisível */
  cursor: pointer;
}

/* Mensagem visual quando o arquivo está sobre a área */
.file-upload-area:hover {
  background-color: rgba(44, 250, 3, 0.1); /* Cor suave ao passar o mouse */
}

/* Feedback visual quando um arquivo é arrastado para a área */
.input-file:focus {
  outline: none;
}
</style>


