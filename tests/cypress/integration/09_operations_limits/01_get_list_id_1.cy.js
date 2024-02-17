import { Env, Support as _cy } from '../../support/support';

describe('TC044 - Test api  Wallets', () => {
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

  it('UC001 - get list operations limites', async () => {
    const response = await _cy.get_request(env.operations, headers);
    const validation_array = [
      'id',
      'limit_type_id',
      'limit_type_tag',
      'limit_type_description',
      'daily_limit',
      'monthly_limit',
      'yearly_limit',
    ];
    for (let validation of validation_array) {
      _cy.expect(response, validation);
    }
  });
});
