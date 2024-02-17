import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Payments gateway refunds', () => {
  let env = Env();
  let headers;
  let token;
  let refundId;
  _cy._time(30000);

  before(async () => {
    token = await _cy.headers('+5581944444444');
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  before(async () => {
    refundId = await _cy.read_json(
      'payments_gateway_refund',
      'payments_gateway_refunds',
    );
  });

  it('UC001 - get devolutions by id', async () => {
    const response = await _cy.get_request(
      `${env.gateway_refunds}/${refundId[0].id}`,
      headers,
    );
    const array = [
      'id',
      'process_status',
      'main_transaction',
      'uuid',
      'description',
      'payment_type',
      'status',
      'type_key_pix',
      'key_pix',
      'fee_value',
      'value',
      'created_at',
      'updated_at',
      'psp_bank_name',
      'psp_ispb',
      'transaction_type',
      'company_id',
      'instant_payment_id_field',
    ];
    for (let validation of array) {
      _cy.expect(response, validation);
    }

    const company = response.body.data.company;
    _cy.expect(company, 'id'),
      _cy.expect(company, 'ie'),
      _cy.expect(company, 'name'),
      _cy.expect(company, 'cnpj'),
      _cy.expect(company, 'phone'),
      _cy.expect(company, 'is_matrix'),
      _cy.expect(company, 'trading_name'),
      _cy.expect(company, 'plan_id'),
      _cy.expect(company, 'responsible_id'),
      _cy.expect(company, 'wallet_id'),
      _cy.expect(company, 'webhook_transaction'),
      _cy.expect(company, 'webhook_withdraw'),
      _cy.expect(company, 'created_at'),
      _cy.expect(company, 'updated_at');
    console.log(response);

    const client = response.body.data.client;
    _cy.expect(client, 'id'),
      _cy.expect(client, 'name'),
      _cy.expect(client, 'email'),
      _cy.expect(client, 'document'),
      _cy.expect(client, 'company_id');

    const banks = response.body.data.bank;
    _cy.expect(banks, 'id'),
      _cy.expect(banks, 'agency'),
      _cy.expect(banks, 'cpf_cnpj'),
      _cy.expect(banks, 'chave_pix'),
      _cy.expect(banks, 'account_number'),
      _cy.expect(banks, 'type_chave_pix'),
      _cy.expect(banks, 'bank_name'),
      _cy.expect(banks, 'created_at'),
      _cy.expect(banks, 'updated_at');
  });
});
