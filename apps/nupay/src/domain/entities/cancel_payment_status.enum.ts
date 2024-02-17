export enum CancelPaymentStatusEnum {
  CANCELLING = 'CANCELLING', //	A requisição de cancelamento é válida e será processada. Ao término do processamento o estado do pagamento será CANCELLED.
  CANCELLED = 'CANCELLED', //	O pagamento foi cancelado.
  DENIED = 'DENIED', //	O pedido de pagamento foi recusado.
  ERROR = 'ERROR', //	Informa quando um erro ocorreu, juntamente com sua razão.
}
