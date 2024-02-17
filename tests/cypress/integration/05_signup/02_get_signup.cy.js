import { Env, Support as _cy } from '../../support/support';

describe('TC015 - Test - API Signup - Get Sgnup', () => {
  let env = Env();
  let id;

  _cy._time(30000);

  before(async () => {
    await cy
      .readFile('../tests/cypress/fixtures/signup/signup_id.json')
      .then((data) => {
        id = data.id;
      });
  });

  it('UC001 - Get subscription by id', async () => {
    const response = await _cy.get_request(`${env.signup}/${id}`);
    _cy.expect(response, 'data');
    _cy.expect(response, 'id');
    _cy.expect(response, 'state', 'PENDING');
  });
});
