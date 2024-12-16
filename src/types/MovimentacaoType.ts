export interface MovimentacaoType {
  dataHora: string | null;  // Data e hora da movimentação
  agencia: string | null,
  coop: string | null,
  conta: string | null;     // Número da conta
  nome: string | null;      // Nome do associado
  documento: string | null; // Documento do associado
  codigo: string | null;    // Código da movimentação
  descricao: string | null; // Descrição do pagamento
  debito: number | null;    // Valor de débito
  credito: number | null;   // Valor de crédito
  descricaoFinal: string | null;  // Descrição final (última parte)
}
