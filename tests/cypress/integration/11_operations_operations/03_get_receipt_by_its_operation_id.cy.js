import { Env, Support as _cy } from '../../support/support';

describe('TC038 - Test api  Operations operations', () => {
  let env = Env();
  let headers;
  let operationsReceipt;
  let token;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  before(async () => {
    operationsReceipt = await _cy.read_json(
      'operations_operation',
      'operations_id',
    );
  });

  it('UC001 - get receipt by operation id', async () => {
    const response = await _cy.get_request(
      `${env.operations_operations}/${operationsReceipt.id}`,
      headers,
    );
    const validation_array = [
      'created_at',
      'currency_id',
      'currency_symbol',
      'description',
      'id',
      'owner_wallet_uuid',
      'state',
      'transaction_id',
      'transaction_tag',
      'value',
    ];

    for (const validation of validation_array) {
      _cy.expect(response, validation);
    }

    console.log(response);
  });
});
