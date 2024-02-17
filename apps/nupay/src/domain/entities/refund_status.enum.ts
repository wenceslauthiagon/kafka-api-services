export enum RefundStatusEnum {
  OPEN = 'OPEN', // O pedido de estorno foi criado e será processado.
  REFUNDING = 'REFUNDING', // O pedido de estorno está sendo processado.
  CANCELLED = 'CANCELLED', //	O pedido de estorno foi cancelado.
  REFUNDED = 'REFUNDED', //	O pedido de estorno foi processado e realizado.
  EXPIRED = 'EXPIRED', //	O pedido de estorno expirou.
  ERROR = 'ERROR', //	Informa quando um erro ocorreu, juntamente com sua causa.
}
