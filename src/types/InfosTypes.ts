export interface DataMovimentacao{
  data: string,
  total: number
}
export interface MovimentacoesCoopAgencia {
  agencia: string,
  coop: string,
  total: number,
  total_valor: string,
}
export interface CreditosDebitosHora{
  hora: string,
  total_credito: string
  total_debito: string
}
