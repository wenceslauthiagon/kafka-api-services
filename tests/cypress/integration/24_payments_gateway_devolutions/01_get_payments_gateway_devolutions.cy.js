import { Env, Support as _cy } from '../../support/support';

describe('TC056 - Gateway devolutions ', () => {
  let env = Env();
  let headers;
  let token;
  let file;
  _cy._time(30000);
  before(async () => {
    token = await _cy.headers('+5581944444444');
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get list devolutions', async () => {
    const response = await _cy.get_request(env.gateway_devolutions, headers);

    //the devolutions endpoint in the database receives data as null but if there is data, uncomment the following code

    // const data = [
    //   'id',
    //   'main_transaction',
    //   'uuid',
    //   'description',
    //   'payment_type',
    //   'status',
    //   'type_key_pix',
    //   'key_pix',
    //   'fee_value',
    //   'value',
    //   'created_at',
    //   'updated_at',
    //   'transaction_type',
    //   'company_id',
    // ];
    // for (let validations of data) {
    //   _cy.expect(response, validations);
    // }

    // const bank = [
    //   'account_number',
    //   'agency',
    //   'bank_name',
    //   'chave_pix',
    //   'company_id',
    //   'cpf_cnpj',
    //   'created_at',
    //   'id',
    //   'type_chave_pix',
    //   'updated_at',
    // ];
    // for (let validatons of bank) {
    //   _cy.expect(response, validatons);
    // }

    // const company = [
    //   'cnpj',
    //   'created_at',
    //   'id',
    //   'ie',
    //   'is_matrix',
    //   'name',
    //   'phone',
    //   'plan_id',
    //   'responsible_id',
    //   'trading_name',
    //   'updated_at',
    //   'wallet_id',
    //   'webhook_transaction',
    //   'webhook_withdraw',
    // ];
    // for (let validation of company) {
    //   _cy.expect(response, validation);
    // }

    // console.log(response);

    const links = ['first', 'last'];
    for (let validations of links) {
      _cy.expect(response, validations);
    }

    const meta = response.body.data.data.meta;
    _cy.expect(meta, 'url'),
      _cy.expect(meta, 'label'),
      _cy.expect(meta, 'active'),
      _cy.expect(meta, 'url', null);

    const path = response.body.data.meta;
    _cy.expect(path, 'path');

    file = response.body.data;
  });

  it('create json file', async () => {
    await _cy.write_json(
      'payments_gateway_devolution',
      'payments_gateway_devolutions',
      file,
    );
  });
});
