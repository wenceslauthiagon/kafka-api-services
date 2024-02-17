export const JDPI_SERVICES = {
  PIX_KEY: {
    ENTRIES: 'chave-gestao-api/jdpi/dict/api/v2/incluir',
    DELETE: (key: string) => `chave-gestao-api/jdpi/dict/api/v2/${key}/excluir`,
    DECODE: 'chave-gestao-api/jdpi/dict/api/v2',
    CLAIMS: 'chave-reivindicacao-api/jdpi/dict/api/v2/reivindicacao/incluir',
    CLAIMS_LIST:
      'chave-reivindicacao-api/jdpi/dict/api/v2/reivindicacao/listar/pendentes',
    CLAIMS_CONFIRM: (claimId: string) =>
      `chave-reivindicacao-api/jdpi/dict/api/v2/reivindicacao/${claimId}/confirmar`,
    CLAIMS_CANCEL: (claimId: string) =>
      `chave-reivindicacao-api/jdpi/dict/api/v2/reivindicacao/${claimId}/cancelar`,
    CLAIM_FINISH: (claimId: string) =>
      `chave-reivindicacao-api/jdpi/dict/api/v2/reivindicacao/${claimId}/concluir`,
  },
  PIX_PAYMENT: {
    QR_CODE_STATIC: 'qrcode-api/jdpi/qrcode/api/v1/estatico/gerar',
    DECODE_QR_CODE: 'qrcode-api/jdpi/qrcode/api/v1/decodificar',
    QR_CODE_DYNAMIC_DUE_DATE: {
      CREATE: 'qrcode-api/jdpi/qrcode/api/v1/dinamico/cobv/gerar',
      UPDATE: 'qrcode-api/jdpi/qrcode/api/v1/dinamico/cobv/jws',
    },
    QR_CODE_DYNAMIC_INSTANT: 'qrcode-api/jdpi/qrcode/api/v1/dinamico/gerar',
    PAYMENT_LIST: 'spi-api/jdpi/spi/api/v2/lancamento',
    PAYMENT: 'spi-api/jdpi/spi/api/v2/op',
    DEVOLUTION: 'spi-api/jdpi/spi/api/v2/od',
    VERIFY_NOTIFY_CREDIT_STATEMENT:
      'spi-api/jdpi/spi/api/v2/credito-pagamento/validacao',
  },
  BANK: {
    LIST: 'auth/jdpi/spi/api/v1/gestao-psps/listar',
  },
  PIX_INFRACTION: {
    CREATE:
      'chave-relato-infracao-api/jdpi/dict/api/v2/relato-infracao/incluir',
    CANCEL:
      'chave-relato-infracao-api/jdpi/dict/api/v2/relato-infracao/cancelar',
    CLOSE:
      'chave-relato-infracao-api/jdpi/dict/api/v2/relato-infracao/analisar',
    LIST: 'chave-relato-infracao-api/jdpi/dict/api/v2/relato-infracao/listar',
  },
  PIX_REFUND: {
    CANCEL: 'chave-devolucao-api/jdpi/dict/api/v2/devolucao/analisar',
    CLOSE: 'chave-devolucao-api/jdpi/dict/api/v2/devolucao/analisar',
    GET_ALL: 'chave-devolucao-api/jdpi/dict/api/v2/devolucao/listar',
  },
  PIX_FRAUD_DETECTION: {
    CREATE:
      'chave-relato-infracao-api/jdpi/dict/api/v2/marcacao-fraude/incluir',
    GET_BY_ID: (id: string) =>
      `chave-relato-infracao-api/jdpi/dict/api/v2/marcacao-fraude/${id}`,
    GET_ALL:
      'chave-relato-infracao-api/jdpi/dict/api/v2/marcacao-fraude/listar',
    CANCEL: (id: string) =>
      `chave-relato-infracao-api/jdpi/dict/api/v2/marcacao-fraude/${id}/cancelar`,
  },
};

export const ZROBANK_OPEN_BANKING_SERVICES = {
  DYNAMIC_QR_CODE: {
    GET_JWS_INSTANT: (id: string) => `v1/pix/qr/${id}`,
    GET_JWS_DUE_DATE: (id: string) => `v1/pix/qr/cobv/${id}`,
    GET_JWK: '.well-known/pix-jwks',
  },
};
