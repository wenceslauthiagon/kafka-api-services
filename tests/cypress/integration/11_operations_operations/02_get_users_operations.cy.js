import { Env, Support as _cy } from '../../support/support';

describe('TC037 - Test api  Operations operations', () => {
  let env = Env();
  let headers;
  let file;
  let operations;
  let token;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  before(async () => {
    operations = await _cy.read_json('operations_operation', 'list_operations');
  });

  it('UC001 - Get users operation.', async () => {
    const response = await _cy.get_request(
      `${env.operations_operations}/${operations[0].id}`,
      headers,
    );
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

    for (const validation of validation_array) {
      _cy.expect(response, validation);
      _cy.expect(response, 'id');
    }

    file = response.body.data;
  });

  it('create json file', async () => {
    await _cy.write_json('operations_operation', 'operations_id', file);
  });
});
