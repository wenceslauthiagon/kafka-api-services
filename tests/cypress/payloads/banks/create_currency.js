export class BanksPayload {
  static body = {
    pin: '1234',
    amount: 10000,
    beneficiary_bank_name: 'Banco Bradesco S.A.',
    beneficiary_bank_code: '237',
    beneficiary_name: 'Name Test',
    beneficiary_type: 'fisico',
    beneficiary_document: null,
    beneficiary_agency: '0001',
    beneficiary_account: '111111',
    beneficiary_account_digit: '10',
    beneficiary_account_type: 'CC',
  };
}
