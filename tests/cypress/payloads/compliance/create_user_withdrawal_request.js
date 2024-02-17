export class ComplianceWitdramal {
  static body = {
    wallet_id: null,
    transaction_type_tag: 'PIXSEND',
    pix_key_type: 'CNPJ',
    pix_key: 'string',
    type: 'DAILY',
    balance: Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000,
    day: Math.floor(Math.random() * (1 - 5 + 1)) + 5,
    week_day: 'MONDAY',
  };
}
