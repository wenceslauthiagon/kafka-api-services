import { Env, Support as _cy } from '../../support/support';

describe('TC046 - Test api  Operations operations', () => {
  let env = Env();
  let headers;

  let token;
  let file;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get list operations currency', async () => {
    const response = await _cy.get_request(env.operations_operations, headers);
    const validation_array = [
      'id',
      'state',
      'description',
      'value',
      'created_at',
      'currency_id',
      'currency_symbol',
      'transaction_id',
      'transaction_tag',
      'owner_wallet_uuid',
    ];
    for (let validation of validation_array) {
      _cy.expect(response, validation);
    }
    file = response.body.data.data;
  });

  it('create json file', async () => {
    await _cy.write_json('operations_operation', 'list_operations', file);
  });
});
