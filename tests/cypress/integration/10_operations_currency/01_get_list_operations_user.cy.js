import { Env, Support as _cy } from '../../support/support';

describe('TC045 - Test api  Operations currency', () => {
  let env = Env();
  let headers;
  let token;
  _cy._time(60000);

  before(async () => {
    token = await _cy.headers();
  });

  before(async () => {
    headers = await _cy.setCypressEnv(token);
  });

  it('UC001 - get list operations currency', async () => {
    const response = await _cy.get_request(env.operations_currency, headers);
    const validation_array = [
      'id',
      'title',
      'symbol',
      'symbol_align',
      'decimal',
      'tag',
      'state',
    ];
    for (let validation of validation_array) {
      _cy.expect(response, validation);
    }
  });
});
