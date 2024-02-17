export enum PaymentStatusEnum {
  PRE_CHECKOUT = 'PRE_CHECKOUT',
  WAITING_PAYMENT_METHOD = 'WAITING_PAYMENT_METHOD', //	Pedido criado e aguardando o método de pagamento.
  CANCELLED = 'CANCELLED', //	Pagamento cancelado.
  COMPLETED = 'COMPLETED', //	Compra concluída e pagamento efetuado.
  ERROR = 'ERROR', //	Informa quando um erro ocorreu, juntamente com sua causa.
  OPEN = 'OPEN', // O pedido de estorno foi criado e será processado.
  REFUND_REFUNDING = 'REFUND_REFUNDING', // O pedido de estorno está sendo processado.
  REFUND_CANCELLED = 'REFUND_CANCELLED', //	O pedido de estorno foi cancelado.
  REFUND_REFUNDED = 'REFUND_REFUNDED', //	O pedido de estorno foi processado e realizado.
  REFUND_EXPIRED = 'REFUND_EXPIRED', //	O pedido de estorno expirou.
  REFUND_ERROR = 'REFUND_ERROR', //	Informa quando um erro ocorreu, juntamente com sua causa.
}
