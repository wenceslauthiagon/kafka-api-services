import { Env, Support as _cy } from '../../support/support';

describe('TC016 - Test - API Signup - Send code', () => {
  let env = Env();
  let id;

  _cy._time(60000);

  before(async () => {
    await cy
      .readFile('../tests/cypress/fixtures/signup/signup_id.json')
      .then((data) => {
        id = data.id;
      });
  });

  it('UC001 - send confirmation code', async () => {
    const response = await _cy.get_request(`${env.signup}/${id}/code`);
    _cy.expect(response, 'success', true);
  });

  it('UC002 - passing invalid id', async () => {
    const response = await _cy.get_request(
      `${env.signup}/${_cy.uuid_gen()}/code`,
    );
    _cy.expect(
      response,
      'message',
      'Não foi possível processar o seu pedido. Por favor tente novamente.',
    );
  });
});
