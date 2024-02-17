export enum PaymentCodeEnum {
  CANCELLED_BY_USER = 'CANCELLED_BY_USER', // . O cliente pressiona/clica em "Voltar para o site" na página de Fallback.
  CANCELLED_BY_INSTITUTION = 'CANCELLED_BY_INSTITUTION', // . O cliente cancela a compra dentro do app do Nubank.
  CANCELLED_BY_TIMEOUT = 'CANCELLED_BY_TIMEOUT', // . O cliente não conclui a compra dentro do tempo que o pedido fica aberto.
  CANCELLED_BY_SELLER = 'CANCELLED_BY_SELLER', // . O e-commerce solicitou o cancelamento do pedido antes que o pagamento fosse concluído pelo cliente.
  REVERSED = 'REVERSED', // . O processamento do pagamento não foi concluído e o valor foi devolvido para o cliente.
}
