import axios from "axios";

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    Accept: 'application/json'
  }
});


export async function postFile(batch:any){
  try {
    console.log("s1");

    const response = await client.post('http://localhost:8000/api/processar', { movimentacoes: batch });
    console.log("s2");
    return response;
  } catch (error:any) {
    return error?.response;
  }
}
