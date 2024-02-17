export enum AuthorizationTypeEnum {
  MANUALLY_AUTHORIZED = 'manually_authorized', //  é o fluxo onde o usuário precisa autorizar a cobrança todas as vezes.
  PRE_AUTHORIZED = 'pre_authorized', // é o fluxo onde o usuário fez a autorização previamente pelo fluxo de pagamentos pré-autorizados.
}
