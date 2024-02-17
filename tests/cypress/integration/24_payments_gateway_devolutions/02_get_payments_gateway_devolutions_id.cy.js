import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Test api pix devolutions - list users qrcode', () => {
  let env = Env();
  let headers;
  let token;
  let devolutionsId;
  _cy._time(30000);

  before(async () => {
    token = await _cy.headers();
    headers = await _cy.setCypressEnv(token);

    devolutionsId = _cy.read_json(
      'payments_gateway_devolution',
      'payments_gateway_devolutions',
    );
  });

  it('UC001 - get devolutions by id', async () => {
    const response = await _cy.get_request(
      `${env.gateway_devolutions}/${devolutionsId}`,
      headers,
    );
    const array = [
      'id',
      'reference',
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
      'transaction_type',
      'company_id',
    ];
    for (let validation of array) {
      _cy.expect(response, validation);
    }
    console.log(response);
  });
});
