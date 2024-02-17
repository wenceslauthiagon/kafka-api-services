export enum RefundErrorTypeEnum {
  PAYMENT_METHOD = 'PAYMENT_METHOD', //	Erro na transação durante a execução do estorno.
  OPERATION = 'OPERATION', //	Erro de validação durante a execução do estorno.
  SYSTEM = 'SYSTEM', //	Erro interno do sistema durante a execução do estorno. Pode ser feita nova tentativa de criação de estorno.
}
