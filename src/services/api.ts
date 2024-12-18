import axios from "axios";

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json'
  }
});


export async function postarArquivo(batch: any) {
  try {
    const response = await client.post('/processar', { movimentacoes: batch });
    return response;
  } catch (error: any) {
    return error?.response;
  }
}

export async function getInfos(){
  try {
    const response = await client.get('/metricas');
    return response;
  } catch (error:any) {
    return error?.response;
  }
}

